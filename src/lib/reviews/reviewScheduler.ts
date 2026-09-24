import { createAdminClient } from "@/lib/supabase/admin";
import { sendMulticastPushNotification } from "@/lib/firebase/admin";
import type { ReviewRequest } from "@/lib/types/database";

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
 */
export async function processPendingReviewRequests(): Promise<{
  processed: number;
  sent: number;
  skipped: number;
  failed: number;
  details: { customerId: string; status: string; reason?: string }[];
}> {
  const now = new Date().toISOString();
  let pendingRequests: ReviewRequest[] = [];

  const admin = createAdminClient();

  // 1. Fetch pending requests from Supabase
  try {
    const { data, error } = await admin
      .from("review_requests")
      .select("*")
      .eq("status", "PENDING")
      .lte("scheduled_at", now);

    if (!error && data) {
      pendingRequests = data as ReviewRequest[];
    }
  } catch {
    // Ignore read failure
  }

  const summary = {
    processed: pendingRequests.length,
    sent: 0,
    skipped: 0,
    failed: 0,
    details: [] as { customerId: string; status: string; reason?: string }[],
  };

  for (const req of pendingRequests) {
    try {
      // 1. Fetch Merchant to check Google Review URL
      const { data: merchant } = await admin
        .from("merchants")
        .select("id, shop_name, google_maps_url")
        .eq("id", req.merchant_id)
        .maybeSingle();

      const reviewUrl = merchant?.google_maps_url || req.review_url;

      // If merchant has no configured review URL, mark as SKIPPED
      if (!reviewUrl || !reviewUrl.trim() || !reviewUrl.startsWith("http")) {
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

      // 2. Fetch active FCM push tokens for this customer
      const { data: tokens } = await admin
        .from("push_tokens")
        .select("token")
        .eq("merchant_id", req.merchant_id)
        .eq("customer_id", req.customer_id)
        .eq("is_valid", true);

      const validTokens = (tokens || [])
        .map((t) => t.token)
        .filter((t) => t && t.length > 20);

      if (validTokens.length === 0) {
        await updateRequestStatus(
          req.id,
          "FAILED",
          null,
          "No active FCM push token found for customer device."
        );
        summary.failed++;
        summary.details.push({
          customerId: req.customer_id,
          status: "FAILED",
          reason: "No FCM token",
        });
        continue;
      }

      // 3. Dispatch FCM Notification
      const pushResult = await sendMulticastPushNotification({
        tokens: validTokens,
        title: "How was your experience? ⭐",
        body: "Thanks for visiting! We'd love to hear about your experience.",
        linkUrl: reviewUrl.trim(),
        data: {
          type: "REVIEW_REQUEST",
          url: reviewUrl.trim(),
          click_action: reviewUrl.trim(),
        },
      });

      // Insert notification logs for audit & history
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
        } catch {
          // Ignore log failure
        }
      }

      if (pushResult.totalSent > 0) {
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
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Unexpected scheduler error";
      await updateRequestStatus(req.id, "FAILED", null, errMsg);
      summary.failed++;
      summary.details.push({
        customerId: req.customer_id,
        status: "FAILED",
        reason: errMsg,
      });
    }
  }

  return summary;
}

async function updateRequestStatus(
  id: string,
  status: "PENDING" | "SENT" | "FAILED" | "SKIPPED",
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
  } catch {
    // Ignore update failure
  }
}
