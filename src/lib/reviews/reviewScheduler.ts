import { createAdminClient } from "@/lib/supabase/admin";
import { sendMulticastPushNotification } from "@/lib/firebase/admin";
import type { ReviewRequest } from "@/lib/types/database";
import { logger } from "@/lib/observability/logger";

export interface ReviewRequestWithCustomer extends ReviewRequest {
  customer?: {
    name: string;
    phone: string;
  };
}

/**
 * Idempotently schedules a 30-minute Google review request for a newly registered customer in Supabase.
 */
export async function scheduleReviewRequest(
  merchantId: string,
  customerId: string,
  reviewUrl: string | null,
  firstVisitAt: string
): Promise<{ success: boolean; request?: ReviewRequest; error?: string }> {
  const visitTime = new Date(firstVisitAt).getTime();
  const scheduledAt = new Date(visitTime + 30 * 60 * 1000).toISOString();

  try {
    const admin = createAdminClient();

    // Prevent duplicate review request creation if already scheduled/processed
    const { data: existing } = await admin
      .from("review_requests")
      .select("id, status")
      .eq("merchant_id", merchantId)
      .eq("customer_id", customerId)
      .maybeSingle<ReviewRequest>();

    if (existing) {
      return { success: true, request: existing };
    }

    const { data, error } = await admin
      .from("review_requests")
      .insert({
        merchant_id: merchantId,
        customer_id: customerId,
        review_url: reviewUrl || null,
        scheduled_at: scheduledAt,
        status: "PENDING",
      })
      .select()
      .single<ReviewRequest>();

    if (!error && data) {
      return { success: true, request: data };
    }
    return { success: false, error: error?.message || "Failed to schedule review request." };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Fetch all review requests for a specific merchant with customer information from Supabase.
 */
export async function getMerchantReviewRequests(
  merchantId: string,
  limit = 50
): Promise<ReviewRequestWithCustomer[]> {
  const boundedLimit = Math.min(Math.max(1, limit), 100);
  try {
    const admin = createAdminClient();
    const { data: requests, error } = await admin
      .from("review_requests")
      .select("*, customers(name, phone)")
      .eq("merchant_id", merchantId)
      .order("created_at", { ascending: false })
      .limit(boundedLimit);

    if (!error && requests) {
      return requests.map((r: any) => ({
        ...r,
        customer: r.customers || undefined,
      })) as ReviewRequestWithCustomer[];
    }
  } catch {
    // Graceful fallback to empty
  }

  return [];
}

/**
 * Process all pending review requests where scheduled_at <= NOW().
 * Idempotent, server-side processing for Vercel Cron and Inngest triggers.
 * Includes stale PROCESSING lock recovery, bounded batching, and atomic claiming.
 */
export async function processPendingReviewRequests(): Promise<{
  processed: number;
  sent: number;
  skipped: number;
  failed: number;
  details: { customerId: string; status: string; reason?: string }[];
}> {
  const now = new Date().toISOString();
  const admin = createAdminClient();

  const summary = {
    processed: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    details: [] as { customerId: string; status: string; reason?: string }[],
  };

  // 0. Auto-recover stale PROCESSING records:
  // If a worker crashed or timed out mid-flight > 10 minutes ago, reset to PENDING
  // so the invitation is not permanently stuck.
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  try {
    await admin
      .from("review_requests")
      .update({ status: "PENDING", updated_at: now })
      .eq("status", "PROCESSING")
      .lte("updated_at", tenMinutesAgo);
  } catch {
    // Stale lock recovery is best-effort and non-blocking
  }

  // 1. Fetch pending requests from Supabase (capped to 50 items to fit serverless execution limits)
  let pendingRequests: ReviewRequest[] = [];
  try {
    const { data, error } = await admin
      .from("review_requests")
      .select("*")
      .eq("status", "PENDING")
      .lte("scheduled_at", now)
      .order("scheduled_at", { ascending: true })
      .limit(50);

    if (!error && data) {
      pendingRequests = data as ReviewRequest[];
    }
  } catch {
    // Ignore read failure
  }

  summary.processed = pendingRequests.length;

  for (const req of pendingRequests) {
    let pushSentSuccess = false;

    try {
      // 0. Concurrency lock: Claim request by transitioning status PENDING -> PROCESSING atomically
      // If another concurrent cron or Inngest runner already claimed it, skip immediately
      const { data: claimed, error: claimErr } = await admin
        .from("review_requests")
        .update({ status: "PROCESSING", updated_at: now })
        .eq("id", req.id)
        .eq("status", "PENDING")
        .select("id")
        .maybeSingle();

      if (claimErr || !claimed) {
        summary.skipped++;
        continue;
      }

      // 1. Fetch Merchant to check settings & Google Review URL
      const { data: merchant } = await admin
        .from("merchants")
        .select("id, shop_name, google_maps_url, is_review_request_enabled, plan")
        .eq("id", req.merchant_id)
        .maybeSingle();

      if (!merchant) {
        await updateRequestStatus(
          req.id,
          "SKIPPED",
          null,
          "Merchant account no longer exists."
        );
        summary.skipped++;
        summary.details.push({
          customerId: req.customer_id,
          status: "SKIPPED",
          reason: "Merchant not found",
        });
        continue;
      }

      // Check merchant on/off automation toggle
      if (merchant.is_review_request_enabled === false) {
        await updateRequestStatus(
          req.id,
          "SKIPPED",
          null,
          "Google review invitation automation disabled by merchant."
        );
        summary.skipped++;
        summary.details.push({
          customerId: req.customer_id,
          status: "SKIPPED",
          reason: "Automation disabled by merchant",
        });
        continue;
      }

      const reviewUrl = (merchant.google_maps_url || req.review_url || "").trim();

      // If merchant has no configured review URL, mark as SKIPPED
      if (!reviewUrl || !reviewUrl.startsWith("http")) {
        await updateRequestStatus(
          req.id,
          "SKIPPED",
          null,
          "Google review URL not configured by merchant."
        );
        summary.skipped++;
        summary.details.push({
          customerId: req.customer_id,
          status: "SKIPPED",
          reason: "No review URL configured",
        });
        continue;
      }

      // 2. Fetch active FCM push tokens and customer name for this customer
      const [{ data: tokens }, { data: customerRecord }] = await Promise.all([
        admin
          .from("push_tokens")
          .select("token")
          .eq("merchant_id", req.merchant_id)
          .eq("customer_id", req.customer_id)
          .eq("is_valid", true),
        admin
          .from("customers")
          .select("name")
          .eq("id", req.customer_id)
          .eq("merchant_id", req.merchant_id)
          .maybeSingle(),
      ]);

      const validTokens = (tokens || [])
        .map((t) => t.token)
        .filter((t) => t && t.length > 20);

      if (validTokens.length === 0) {
        await updateRequestStatus(
          req.id,
          "SKIPPED",
          null,
          "No active FCM push token found. Customer device has not enabled push notifications."
        );
        summary.skipped++;
        summary.details.push({
          customerId: req.customer_id,
          status: "SKIPPED",
          reason: "No active push token registered",
        });
        continue;
      }

      // 3. Dispatch Personalized FCM Notification
      const shopName = merchant.shop_name?.trim() || "Dukaan";
      const customerFirstName = customerRecord?.name?.trim() ? ` ${customerRecord.name.trim()}` : "";
      const notificationTitle = `${shopName} par aapka anubhav kaisa raha? ⭐`;
      const notificationBody = customerFirstName
        ? `Namaste${customerFirstName}! ${shopName} visit karne ke liye dhanyawad. Kripya apna Google review dekar humari sahayata karein.`
        : `${shopName} visit karne ke liye dhanyawad! Kripya apna anubhav Google par share karein.`;

      const pushResult = await sendMulticastPushNotification({
        tokens: validTokens,
        title: notificationTitle,
        body: notificationBody,
        linkUrl: reviewUrl,
        data: {
          type: "REVIEW_REQUEST",
          url: reviewUrl,
          click_action: reviewUrl,
        },
      });

      // 4. Record successful dispatch status IMMEDIATELY to prevent duplicate sends
      if (pushResult.totalSent > 0) {
        pushSentSuccess = true;
        await updateRequestStatus(
          req.id,
          "SENT",
          new Date().toISOString(),
          null
        );
        summary.sent++;
        summary.details.push({
          customerId: req.customer_id,
          status: "SENT",
        });
      } else {
        const errMessage =
          pushResult.failedTokens[0]?.error ||
          "Failed to deliver FCM review request notification.";
        await updateRequestStatus(
          req.id,
          "FAILED",
          null,
          errMessage
        );
        summary.failed++;
        summary.details.push({
          customerId: req.customer_id,
          status: "FAILED",
          reason: errMessage,
        });
      }

      // 5. Post-send audit logging (errors here must never alter SENT status)
      for (const token of validTokens) {
        const isSuccessful = pushResult.successfulTokens.includes(token);
        const isInvalid = pushResult.invalidTokens.includes(token);
        const failureObj = pushResult.failedTokens.find((f) => f.token === token);

        try {
          await admin.from("notification_logs").insert({
            offer_id: null,
            merchant_id: req.merchant_id,
            customer_id: req.customer_id,
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
        } catch (logErr) {
          logger.warn("Non-critical notification log insert failed", {
            operation: "REVIEW_NOTIFICATION_LOG",
            customerId: req.customer_id,
            merchantId: req.merchant_id,
          });
        }
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Unexpected scheduler error";
      logger.error("Error processing review request", {
        operation: "PROCESS_REVIEW_REQUEST",
        customerId: req.customer_id,
        merchantId: req.merchant_id,
      }, err);

      // Only mark FAILED if notification was not already sent successfully
      if (!pushSentSuccess) {
        await updateRequestStatus(req.id, "FAILED", null, errMsg);
        summary.failed++;
        summary.details.push({
          customerId: req.customer_id,
          status: "FAILED",
          reason: errMsg,
        });
      }
    }
  }

  return summary;
}

async function updateRequestStatus(
  id: string,
  status: "PENDING" | "PROCESSING" | "SENT" | "FAILED" | "SKIPPED",
  sentAt: string | null,
  errorMessage: string | null
) {
  const now = new Date().toISOString();

  try {
    const admin = createAdminClient();
    await admin
      .from("review_requests")
      .update({
        status,
        sent_at: sentAt,
        error_message: errorMessage,
        updated_at: now,
      })
      .eq("id", id);
  } catch (err) {
    logger.error("Failed to update review request status", {
      operation: "UPDATE_REVIEW_REQUEST_STATUS",
      metadata: { id, status },
    }, err);
  }
}

