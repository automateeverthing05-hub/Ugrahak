import { createAdminClient } from "@/lib/supabase/admin";
import { sendMulticastPushNotification } from "@/lib/firebase/admin";
import { getBillingPeriod, checkOfferRecipientAllowance } from "@/lib/billing/plans";
import { logger } from "@/lib/observability/logger";
import type {
  InactiveCustomerCampaign,
  Customer,
  Merchant,
  Offer,
} from "@/lib/types/database";

export interface ReengagementSummary {
  scanned: number;
  scheduled: number;
  processed: number;
  sent: number;
  skipped: number;
  failed: number;
  details: {
    customerId: string;
    merchantId: string;
    status: string;
    reason?: string;
  }[];
}

/**
 * 1. Durable Inactivity Scanner:
 * Finds customers across active merchants whose last qualifying visit was >= 30 days ago.
 * Idempotently schedules a re-engagement campaign per unique inactivity cycle.
 */
export async function findAndScheduleInactiveCustomers(): Promise<{
  scanned: number;
  scheduled: number;
  skipped: number;
}> {
  const admin = createAdminClient();
  const summary = { scanned: 0, scheduled: 0, skipped: 0 };

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  try {
    // 1. Fetch all merchants who have reengagement automation enabled
    const { data: merchants, error: merchantErr } = await admin
      .from("merchants")
      .select("id, shop_name, is_reengagement_enabled, reengagement_offer_id, reengagement_cooldown_days, plan, subscription_started_at")
      .eq("is_reengagement_enabled", true);

    if (merchantErr || !merchants || merchants.length === 0) {
      return summary;
    }

    for (const merchant of merchants) {
      // Must have an active reengagement offer configured
      if (!merchant.reengagement_offer_id) {
        summary.skipped++;
        continue;
      }

      // Verify the configured offer exists and is active
      const { data: offer } = await admin
        .from("offers")
        .select("id, title, status, end_at")
        .eq("id", merchant.reengagement_offer_id)
        .eq("merchant_id", merchant.id)
        .maybeSingle<Offer>();

      if (!offer || offer.status !== "ACTIVE" || (offer.end_at && new Date(offer.end_at) < new Date())) {
        summary.skipped++;
        continue;
      }

      // 2. Find customers for this merchant whose last_visit_at <= 30 days ago
      const { data: inactiveCustomers, error: custErr } = await admin
        .from("customers")
        .select("id, name, last_visit_at")
        .eq("merchant_id", merchant.id)
        .lte("last_visit_at", thirtyDaysAgo)
        .limit(100); // Process in batches of 100 per merchant to ensure high performance

      if (custErr || !inactiveCustomers || inactiveCustomers.length === 0) {
        continue;
      }

      summary.scanned += inactiveCustomers.length;

      for (const customer of inactiveCustomers) {
        // Enforce idempotency: Has a campaign already been scheduled/processed for this exact visit cycle?
        const { data: existing } = await admin
          .from("inactive_customer_campaigns")
          .select("id, status")
          .eq("merchant_id", merchant.id)
          .eq("customer_id", customer.id)
          .eq("last_qualifying_visit_at", customer.last_visit_at)
          .maybeSingle();

        if (existing) {
          summary.skipped++;
          continue;
        }

        // Schedule new re-engagement campaign
        const { error: insertErr } = await admin
          .from("inactive_customer_campaigns")
          .insert({
            merchant_id: merchant.id,
            customer_id: customer.id,
            offer_id: offer.id,
            last_qualifying_visit_at: customer.last_visit_at,
            scheduled_at: now,
            status: "PENDING",
          });

        if (!insertErr) {
          summary.scheduled++;
        } else {
          summary.skipped++;
        }
      }
    }
  } catch (err: unknown) {
    logger.error(
      "Error in findAndScheduleInactiveCustomers",
      { operation: "REENGAGEMENT_SCAN" },
      err
    );
  }

  return summary;
}

/**
 * 2. Campaign Dispatch Worker:
 * Processes pending re-engagement campaigns, validates customer consent & push tokens,
 * checks monthly plan quotas, formats personalized messages, and dispatches via FCM.
 */
export async function processPendingReengagementCampaigns(): Promise<ReengagementSummary> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const summary: ReengagementSummary = {
    scanned: 0,
    scheduled: 0,
    processed: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    details: [],
  };

  try {
    // 1. Fetch pending campaigns whose scheduled_at <= NOW()
    const { data: pendingCampaigns, error: fetchErr } = await admin
      .from("inactive_customer_campaigns")
      .select("*")
      .eq("status", "PENDING")
      .lte("scheduled_at", now)
      .limit(50); // Bound batch size per run

    if (fetchErr || !pendingCampaigns || pendingCampaigns.length === 0) {
      return summary;
    }

    summary.processed = pendingCampaigns.length;

    for (const campaign of pendingCampaigns as InactiveCustomerCampaign[]) {
      // Concurrency lock: Claim request PENDING -> PROCESSING
      const { data: claimed, error: claimErr } = await admin
        .from("inactive_customer_campaigns")
        .update({ status: "PROCESSING", updated_at: now })
        .eq("id", campaign.id)
        .eq("status", "PENDING")
        .select("id")
        .maybeSingle();

      if (claimErr || !claimed) {
        summary.skipped++;
        continue;
      }

      // Fetch Merchant
      const { data: merchant } = await admin
        .from("merchants")
        .select("id, shop_name, slug, is_reengagement_enabled, plan, subscription_started_at")
        .eq("id", campaign.merchant_id)
        .maybeSingle<Merchant & { subscription_started_at?: string | null }>();

      if (!merchant || !merchant.is_reengagement_enabled) {
        await updateCampaignStatus(
          campaign.id,
          "SKIPPED",
          null,
          "Re-engagement automation is disabled for this merchant."
        );
        summary.skipped++;
        summary.details.push({
          customerId: campaign.customer_id,
          merchantId: campaign.merchant_id,
          status: "SKIPPED",
          reason: "Automation disabled",
        });
        continue;
      }

      // Fetch Customer and verify visit state: Did customer return since campaign was scheduled?
      const { data: customer } = await admin
        .from("customers")
        .select("id, name, last_visit_at")
        .eq("id", campaign.customer_id)
        .eq("merchant_id", campaign.merchant_id)
        .maybeSingle<Customer>();

      if (!customer) {
        await updateCampaignStatus(campaign.id, "SKIPPED", null, "Customer record not found.");
        summary.skipped++;
        summary.details.push({
          customerId: campaign.customer_id,
          merchantId: campaign.merchant_id,
          status: "SKIPPED",
          reason: "Customer deleted",
        });
        continue;
      }

      // If customer has visited again, their inactivity cycle is reset
      const customerLastVisit = new Date(customer.last_visit_at).getTime();
      const campaignQualifyingVisit = new Date(campaign.last_qualifying_visit_at).getTime();

      if (customerLastVisit > campaignQualifyingVisit) {
        await updateCampaignStatus(
          campaign.id,
          "SKIPPED",
          null,
          "Customer returned and visited the store. Inactivity cycle reset."
        );
        summary.skipped++;
        summary.details.push({
          customerId: campaign.customer_id,
          merchantId: campaign.merchant_id,
          status: "SKIPPED",
          reason: "Customer returned before delivery",
        });
        continue;
      }

      // Fetch Offer details
      if (!campaign.offer_id) {
        await updateCampaignStatus(
          campaign.id,
          "SKIPPED",
          null,
          "No offer configured on this campaign."
        );
        summary.skipped++;
        summary.details.push({
          customerId: campaign.customer_id,
          merchantId: campaign.merchant_id,
          status: "SKIPPED",
          reason: "Offer missing",
        });
        continue;
      }

      const { data: offer } = await admin
        .from("offers")
        .select("id, title, message, end_at, status")
        .eq("id", campaign.offer_id)
        .eq("merchant_id", campaign.merchant_id)
        .maybeSingle<Offer>();

      if (!offer || offer.status !== "ACTIVE" || (offer.end_at && new Date(offer.end_at) < new Date())) {
        await updateCampaignStatus(
          campaign.id,
          "SKIPPED",
          null,
          "Configured re-engagement offer is inactive or expired."
        );
        summary.skipped++;
        summary.details.push({
          customerId: campaign.customer_id,
          merchantId: campaign.merchant_id,
          status: "SKIPPED",
          reason: "Offer inactive or expired",
        });
        continue;
      }

      // Verify Monthly Messaging Quota
      const { start: periodStart, end: periodEnd } = getBillingPeriod(merchant.subscription_started_at);
      const { count: usedCount } = await admin
        .from("notification_logs")
        .select("*", { count: "exact", head: true })
        .eq("merchant_id", campaign.merchant_id)
        .eq("status", "SENT")
        .gte("sent_at", periodStart)
        .lte("sent_at", periodEnd);

      const quotaCheck = checkOfferRecipientAllowance(usedCount || 0, 1, merchant.plan);
      if (!quotaCheck.allowed) {
        await updateCampaignStatus(
          campaign.id,
          "SKIPPED",
          null,
          quotaCheck.message || "Monthly Send Offer recipient quota limit reached."
        );
        summary.skipped++;
        summary.details.push({
          customerId: campaign.customer_id,
          merchantId: campaign.merchant_id,
          status: "SKIPPED",
          reason: "Monthly quota exhausted",
        });
        continue;
      }

      // Fetch Active Push Tokens for Customer
      const { data: tokens } = await admin
        .from("push_tokens")
        .select("token")
        .eq("merchant_id", campaign.merchant_id)
        .eq("customer_id", campaign.customer_id)
        .eq("is_valid", true);

      const validTokens = (tokens || [])
        .map((t) => t.token)
        .filter((t) => t && t.length > 20);

      if (validTokens.length === 0) {
        await updateCampaignStatus(
          campaign.id,
          "SKIPPED",
          null,
          "No active FCM push token registered for customer device."
        );
        summary.skipped++;
        summary.details.push({
          customerId: campaign.customer_id,
          merchantId: campaign.merchant_id,
          status: "SKIPPED",
          reason: "No push token registered",
        });
        continue;
      }

      // Construct Personalized Message
      const customerName = customer.name?.trim() || "Customer";
      const shopName = merchant.shop_name?.trim() || "Store";
      const offerTitle = offer.title?.trim() || "Special Reward";
      const expiryText = offer.end_at
        ? new Date(offer.end_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          })
        : "Limited Time";

      const notificationTitle = `We Miss You, ${customerName}! ❤️`;
      const notificationBody = `${shopName} par aapko aaye hue 30 din ho gaye hain. Wapas aaiye aur apna special offer paaiye: ${offerTitle} (Valid till ${expiryText}).`;

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const clickUrl = merchant.slug ? `${baseUrl}/shop/${merchant.slug}` : baseUrl;

      // Dispatch Push Notification via Firebase Admin
      const pushResult = await sendMulticastPushNotification({
        tokens: validTokens,
        title: notificationTitle,
        body: notificationBody,
        linkUrl: clickUrl,
        data: {
          type: "INACTIVE_REENGAGEMENT",
          offer_id: offer.id,
          url: clickUrl,
        },
      });

      // Insert audit notification logs
      for (const token of validTokens) {
        const isSuccessful = pushResult.successfulTokens.includes(token);
        const isInvalid = pushResult.invalidTokens.includes(token);
        const failureObj = pushResult.failedTokens.find((f) => f.token === token);

        try {
          await admin.from("notification_logs").insert({
            offer_id: offer.id,
            merchant_id: campaign.merchant_id,
            customer_id: campaign.customer_id,
            token,
            status: isSuccessful ? "SENT" : isInvalid ? "INVALID_TOKEN" : "FAILED",
            error_message: failureObj ? failureObj.error : isInvalid ? "Token invalid or expired" : null,
            sent_at: new Date().toISOString(),
          });

          if (isInvalid) {
            await admin
              .from("push_tokens")
              .update({ is_valid: false, updated_at: new Date().toISOString() })
              .eq("token", token);
          }
        } catch {
          // Ignore audit write error
        }
      }

      if (pushResult.totalSent > 0) {
        await updateCampaignStatus(campaign.id, "SENT", new Date().toISOString(), null);
        summary.sent++;
        summary.details.push({
          customerId: campaign.customer_id,
          merchantId: campaign.merchant_id,
          status: "SENT",
        });
      } else {
        const errMessage = pushResult.failedTokens[0]?.error || "Failed to deliver push notification.";
        await updateCampaignStatus(campaign.id, "FAILED", null, errMessage);
        summary.failed++;
        summary.details.push({
          customerId: campaign.customer_id,
          merchantId: campaign.merchant_id,
          status: "FAILED",
          reason: errMessage,
        });
      }
    }
  } catch (err: unknown) {
    logger.error(
      "Error in processPendingReengagementCampaigns",
      { operation: "REENGAGEMENT_DISPATCH" },
      err
    );
  }

  return summary;
}

async function updateCampaignStatus(
  id: string,
  status: "PENDING" | "PROCESSING" | "SENT" | "FAILED" | "SKIPPED",
  sentAt: string | null,
  errorMessage: string | null
) {
  const admin = createAdminClient();
  try {
    await admin
      .from("inactive_customer_campaigns")
      .update({
        status,
        sent_at: sentAt,
        error_message: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
  } catch {
    // Ignore update error
  }
}

/**
 * Fetch re-engagement campaigns for a specific merchant with customer & offer details
 */
export async function getMerchantReengagementCampaigns(merchantId: string, limit = 50) {
  const boundedLimit = Math.min(Math.max(1, limit), 100);
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("inactive_customer_campaigns")
      .select("*, customers(name, phone), offers(title)")
      .eq("merchant_id", merchantId)
      .order("created_at", { ascending: false })
      .limit(boundedLimit);

    if (!error && data) {
      return data.map((c: any) => ({
        ...c,
        customer: c.customers || undefined,
        offer: c.offers || undefined,
      }));
    }
  } catch {
    // Fallback to empty
  }
  return [];
}

