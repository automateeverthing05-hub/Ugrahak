import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimitTokenRegistration } from "@/lib/redis/rateLimiter";
import type { Customer, Merchant } from "@/lib/types/database";

/**
 * Public Customer FCM Token Registration Endpoint
 * Securely verifies that customer_id belongs to the merchant identified by slug.
 */
export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "anonymous";
    const rateLimit = await rateLimitTokenRegistration(ip);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many token registration requests. Please wait a moment." },
        { status: 429, headers: { "Retry-After": String(rateLimit.reset) } }
      );
    }

    const body = await request.json();
    const { slug, customer_id, token, platform = "web" } = body;

    // 1. Validation
    if (!slug || typeof slug !== "string" || !slug.trim() || slug.trim().length > 100) {
      return NextResponse.json(
        { error: "Shop slug is required." },
        { status: 400 }
      );
    }

    if (!customer_id || typeof customer_id !== "string" || customer_id.length > 50) {
      return NextResponse.json(
        { error: "Customer ID is required." },
        { status: 400 }
      );
    }

    const trimmedToken = typeof token === "string" ? token.trim() : "";
    if (
      !trimmedToken ||
      trimmedToken.length < 20 ||
      trimmedToken.length > 500 ||
      trimmedToken.startsWith("fcm_web_token_") ||
      trimmedToken.startsWith("fcm_web_granted_")
    ) {
      return NextResponse.json(
        { error: "A valid FCM registration token is required." },
        { status: 400 }
      );
    }

    const validPlatform = typeof platform === "string" && ["web", "android", "ios"].includes(platform.toLowerCase())
      ? platform.toLowerCase()
      : "web";

    const admin = createAdminClient();

    // 2. Fetch Merchant by Slug
    const { data: merchant, error: merchantError } = await admin
      .from("merchants")
      .select("id")
      .eq("slug", slug.trim().toLowerCase())
      .maybeSingle<Merchant>();

    if (merchantError || !merchant) {
      return NextResponse.json(
        { error: "Shop not found." },
        { status: 404 }
      );
    }

    // 3. Verify Customer belongs to this Merchant
    const { data: customer, error: custError } = await admin
      .from("customers")
      .select("id, merchant_id")
      .eq("id", customer_id)
      .eq("merchant_id", merchant.id)
      .maybeSingle<Customer>();

    if (custError || !customer) {
      return NextResponse.json(
        { error: "Customer record not found for this merchant." },
        { status: 403 }
      );
    }

    // 4. Cap push tokens per customer to max 5 (prune oldest tokens)
    const { data: existingTokens } = await admin
      .from("push_tokens")
      .select("id, token, updated_at")
      .eq("merchant_id", merchant.id)
      .eq("customer_id", customer.id)
      .order("updated_at", { ascending: true });

    if (existingTokens && existingTokens.length >= 5) {
      // If token isn't already one of the 5, prune oldest tokens to maintain max 5
      const alreadyExists = existingTokens.some((t) => t.token === trimmedToken);
      if (!alreadyExists) {
        const tokensToRemove = existingTokens.slice(0, existingTokens.length - 4);
        const idsToRemove = tokensToRemove.map((t) => t.id);
        if (idsToRemove.length > 0) {
          await admin
            .from("push_tokens")
            .delete()
            .in("id", idsToRemove);
        }
      }
    }

    // 5. Upsert FCM Push Token
    const now = new Date().toISOString();
    const { error: upsertError } = await admin
      .from("push_tokens")
      .upsert(
        {
          merchant_id: merchant.id,
          customer_id: customer.id,
          token: trimmedToken,
          platform: validPlatform,
          is_valid: true,
          updated_at: now,
          last_seen_at: now,
        },
        { onConflict: "merchant_id,customer_id,token" }
      );

    if (upsertError) {
      return NextResponse.json(
        { error: `Failed to register notification token: ${upsertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notification token registered successfully.",
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error." },
      { status: 500 }
    );
  }
}

