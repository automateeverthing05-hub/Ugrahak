import { inngest } from "@/lib/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPersonalizedPushNotifications, type IndividualPushItem } from "@/lib/firebase/admin";
import { logger } from "@/lib/observability/logger";
import { chunkArray } from "@/lib/queue/batchWorker";
import type { Offer, Merchant, PushToken, NotificationLogInsert } from "@/lib/types/database";

export interface OfferBroadcastEventData {
  offerId: string;
  merchantId: string;
  correlationId?: string;
}

export const broadcastOfferFunction = inngest.createFunction(
  {
    id: "broadcast-merchant-offer",
    name: "Broadcast Merchant Offer via FCM",
    retries: 3,
    concurrency: {
      limit: 10,
    },
    triggers: [{ event: "merchant/offer.broadcast" }],
  },
  async ({ event, step }: { event: { data: OfferBroadcastEventData }; step: any }) => {
    const { offerId, merchantId, correlationId } = event.data;
    const admin = createAdminClient();

    // Step 1: Fetch and validate offer & merchant details
    const { offer, merchant } = (await step.run("fetch-offer-and-merchant", async () => {
      const [{ data: o }, { data: m }] = await Promise.all([
        admin
          .from("offers")
          .select("*")
          .eq("id", offerId)
          .eq("merchant_id", merchantId)
          .maybeSingle<Offer>(),
        admin
          .from("merchants")
          .select("shop_name, phone, slug")
          .eq("id", merchantId)
          .maybeSingle<Merchant>(),
      ]);

      if (!o) throw new Error(`Offer ${offerId} not found for merchant ${merchantId}`);
      return { offer: o, merchant: m };
    })) as { offer: Offer; merchant: Merchant | null };

    // Step 2: Fetch valid push tokens
    const tokens = (await step.run("fetch-push-tokens", async () => {
      const { data: pushTokens, error } = await admin
        .from("push_tokens")
        .select("*")
        .eq("merchant_id", merchantId)
        .eq("is_valid", true);

      if (error) throw new Error(`Failed to fetch push tokens: ${error.message}`);
      return (pushTokens || []) as PushToken[];
    })) as PushToken[];

    if (tokens.length === 0) {
      logger.info("No subscribers found for broadcast", {
        operation: "INNGEST_OFFER_BROADCAST",
        merchantId,
        offerId,
        correlationId,
      });
      return { status: "SKIPPED", message: "No subscribers found." };
    }

    // Step 3: Fetch customer names for tokens with customer_id
    const customerNameMap = (await step.run("fetch-customer-names", async () => {
      const customerIds = Array.from(
        new Set(tokens.map((t) => t.customer_id).filter(Boolean))
      );
      const nameMap: Record<string, string> = {};

      if (customerIds.length > 0) {
        const { data: customers } = await admin
          .from("customers")
          .select("id, name")
          .in("id", customerIds);

        if (customers) {
          customers.forEach((c) => {
            if (c.id && c.name) {
              nameMap[c.id] = c.name.trim();
            }
          });
        }
      }

      return nameMap;
    })) as Record<string, string>;

    // Step 4: Chunk tokens into batches of 500 (FCM limit)
    const tokenChunks: PushToken[][] = chunkArray(tokens, 500);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const shopSlug = merchant?.slug || "";
    const shopName = merchant?.shop_name || "Ugrahak Store";
    const shopPhone = merchant?.phone || "";
    const clickUrl = shopSlug ? `${baseUrl}/shop/${shopSlug}` : baseUrl;

    let totalSent = 0;
    let totalFailed = 0;

    for (let i = 0; i < tokenChunks.length; i++) {
      const chunk: PushToken[] = tokenChunks[i];
      const batchResult = (await step.run(`send-fcm-batch-${i + 1}`, async () => {
        const pushItems: IndividualPushItem[] = chunk.map((t: PushToken) => {
          const customerName = (t.customer_id && customerNameMap[t.customer_id]) || "Customer";
          const personalizedBody = [
            `Hi ${customerName},`,
            "",
            offer.message,
            "",
            `Shop: ${shopName}`,
            shopPhone ? `Contact: ${shopPhone}` : "",
          ]
            .filter((line, idx) => idx !== 5 || shopPhone)
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

        const pushRes = await sendPersonalizedPushNotifications(pushItems);

        const now = new Date().toISOString();

        // Invalidate bad tokens
        if (pushRes.invalidTokens.length > 0) {
          await admin
            .from("push_tokens")
            .update({ is_valid: false, updated_at: now })
            .eq("merchant_id", merchantId)
            .in("token", pushRes.invalidTokens);
        }

        // Prepare logs
        const logs: NotificationLogInsert[] = [];
        for (const token of pushRes.successfulTokens) {
          const match = chunk.find((t: PushToken) => t.token === token);
          logs.push({
            offer_id: offer.id,
            merchant_id: merchantId,
            customer_id: match?.customer_id || null,
            token,
            status: "SENT",
            sent_at: now,
          });
        }

        for (const token of pushRes.invalidTokens) {
          const match = chunk.find((t: PushToken) => t.token === token);
          logs.push({
            offer_id: offer.id,
            merchant_id: merchantId,
            customer_id: match?.customer_id || null,
            token,
            status: "INVALID_TOKEN",
            error_message: "Token unregistered or invalid",
            sent_at: now,
          });
        }

        for (const failed of pushRes.failedTokens) {
          const match = chunk.find((t: PushToken) => t.token === failed.token);
          logs.push({
            offer_id: offer.id,
            merchant_id: merchantId,
            customer_id: match?.customer_id || null,
            token: failed.token,
            status: "FAILED",
            error_message: failed.error,
            sent_at: now,
          });
        }

        if (logs.length > 0) {
          await admin.from("notification_logs").insert(logs);
        }

        return {
          sent: pushRes.totalSent,
          failed: pushRes.totalFailed,
        };
      })) as { sent: number; failed: number };

      totalSent += batchResult.sent;
      totalFailed += batchResult.failed;
    }

    logger.info("Inngest offer broadcast completed", {
      operation: "INNGEST_OFFER_BROADCAST",
      merchantId,
      offerId,
      correlationId,
      metadata: { totalSent, totalFailed, totalSubscribers: tokens.length },
    });

    return {
      success: true,
      totalSent,
      totalFailed,
      totalSubscribers: tokens.length,
    };
  }
);

