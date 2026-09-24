import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPersonalizedPushNotifications, type IndividualPushItem } from "@/lib/firebase/admin";
import { logger } from "@/lib/observability/logger";
import { rateLimitOfferSend } from "@/lib/redis/rateLimiter";
import type { Offer, Merchant, PushToken, NotificationLogInsert } from "@/lib/types/database";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST: Send/Broadcast an offer via FCM Push Notifications with personalized customer names
 */
export async function POST(request: NextRequest, { params }: Params) {
  const startTime = Date.now();

  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in as a merchant." },
        { status: 401 }
      );
    }

    // Rate Limiting per Merchant
    const rateLimit = await rateLimitOfferSend(user.id);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Broadcast limit reached. Please wait a minute before broadcasting again." },
        { status: 429, headers: { "Retry-After": String(rateLimit.reset) } }
      );
    }

    const admin = createAdminClient();

    // 1. Verify Offer belongs to logged-in merchant
    const { data: offer, error: offerError } = await admin
      .from("offers")
      .select("*")
      .eq("id", id)
      .eq("merchant_id", user.id)
      .maybeSingle<Offer>();

    if (offerError || !offer) {
      return NextResponse.json(
        { error: "Offer not found or unauthorized." },
        { status: 404 }
      );
    }

    // 2. Fetch Merchant details
    const { data: merchant } = await admin
      .from("merchants")
      .select("shop_name, phone, slug")
      .eq("id", user.id)
      .maybeSingle<Merchant>();

    const shopName = merchant?.shop_name || "Ugrahak Store";
    const shopPhone = merchant?.phone || "";
    const shopSlug = merchant?.slug || "";

    // 3. Fetch all active, valid push tokens for this merchant
    const { data: pushTokens, error: tokensError } = await admin
      .from("push_tokens")
      .select("*")
      .eq("merchant_id", user.id)
      .eq("is_valid", true);

    if (tokensError) {
      return NextResponse.json(
        { error: `Database error while fetching tokens: ${tokensError.message}` },
        { status: 500 }
      );
    }

    const typedTokens = (pushTokens || []).filter(
      (t) => t && t.token && t.token.trim().length > 20
    ) as PushToken[];

    if (typedTokens.length === 0) {
      return NextResponse.json({
        success: false,
        targetedCount: 0,
        totalSent: 0,
        totalFailed: 0,
        invalidTokensCount: 0,
        durationMs: Date.now() - startTime,
        message:
          "No subscribed customer devices found. Customers must first scan your shop QR code and allow notifications to receive offers.",
      });
    }

    // 4. Fetch customer names for personalization
    const customerIds = Array.from(
      new Set(typedTokens.map((t) => t.customer_id).filter(Boolean))
    );
    const customerNameMap = new Map<string, string>();

    if (customerIds.length > 0) {
      const { data: customers } = await admin
        .from("customers")
        .select("id, name")
        .in("id", customerIds);

      if (customers) {
        customers.forEach((c) => {
          if (c.id && c.name) {
            customerNameMap.set(c.id, c.name.trim());
          }
        });
      }
    }

    // 5. Construct personalized push items
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const clickUrl = shopSlug ? `${baseUrl}/shop/${shopSlug}` : baseUrl;

    const pushItems: IndividualPushItem[] = typedTokens.map((t) => {
      const customerName = (t.customer_id && customerNameMap.get(t.customer_id)) || "Customer";
      const personalizedBody = [
        `Hi ${customerName},`,
        "",
        offer.message,
        "",
        `Shop: ${shopName}`,
        shopPhone ? `Contact: ${shopPhone}` : "",
      ]
        .filter((line, idx, arr) => idx !== 5 || shopPhone)
        .join("\n");

      return {
        token: t.token.trim(),
        title: offer.title,
        body: personalizedBody,
        imageUrl: offer.image_url,
        linkUrl: clickUrl,
        data: {
          offer_id: offer.id,
          shop_slug: shopSlug,
          url: clickUrl,
          customer_id: t.customer_id || "",
        },
      };
    });

    const pushResult = await sendPersonalizedPushNotifications(pushItems);

    const now = new Date().toISOString();

    // 5. Batch Invalidate Bad/Expired Tokens in Parallel
    if (pushResult.invalidTokens.length > 0) {
      await admin
        .from("push_tokens")
        .update({ is_valid: false, updated_at: now })
        .eq("merchant_id", user.id)
        .in("token", pushResult.invalidTokens);
    }

    // 6. Record Notification Logs in controlled chunks of 250
    const logsToInsert: NotificationLogInsert[] = [];

    // Log successful sends
    for (const token of pushResult.successfulTokens) {
      const match = typedTokens.find((t) => t.token === token);
      logsToInsert.push({
        offer_id: offer.id,
        merchant_id: user.id,
        customer_id: match?.customer_id || null,
        token,
        status: "SENT",
        sent_at: now,
      });
    }

    // Log invalid tokens
    for (const token of pushResult.invalidTokens) {
      const match = typedTokens.find((t) => t.token === token);
      logsToInsert.push({
        offer_id: offer.id,
        merchant_id: user.id,
        customer_id: match?.customer_id || null,
        token,
        status: "INVALID_TOKEN",
        error_message: "Token unregistered or invalid",
        sent_at: now,
      });
    }

    // Log failed sends
    for (const failed of pushResult.failedTokens) {
      const match = typedTokens.find((t) => t.token === failed.token);
      logsToInsert.push({
        offer_id: offer.id,
        merchant_id: user.id,
        customer_id: match?.customer_id || null,
        token: failed.token,
        status: "FAILED",
        error_message: failed.error,
        sent_at: now,
      });
    }

    if (logsToInsert.length > 0) {
      // Chunk log inserts into batches of 250 to prevent Postgres parameter limit
      const chunkSize = 250;
      for (let i = 0; i < logsToInsert.length; i += chunkSize) {
        const chunk = logsToInsert.slice(i, i + chunkSize);
        await admin.from("notification_logs").insert(chunk);
      }
    }

    const durationMs = Date.now() - startTime;
    logger.info("Offer broadcast dispatched", {
      operation: "SEND_OFFER_BROADCAST",
      merchantId: user.id,
      offerId: offer.id,
      durationMs,
      metadata: {
        targetedCount: typedTokens.length,
        totalSent: pushResult.totalSent,
        totalFailed: pushResult.totalFailed,
        invalidTokensCount: pushResult.invalidTokens.length,
      },
    });

    return NextResponse.json({
      success: true,
      targetedCount: typedTokens.length,
      totalSent: pushResult.totalSent,
      totalFailed: pushResult.totalFailed,
      invalidTokensCount: pushResult.invalidTokens.length,
      durationMs,
      message: `Offer sent immediately to ${pushResult.totalSent} customer device(s) (${durationMs}ms)!`,
    });
  } catch (err: unknown) {
    logger.error("Failed to broadcast offer", {
      operation: "SEND_OFFER_BROADCAST",
      durationMs: Date.now() - startTime,
    }, err);

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
