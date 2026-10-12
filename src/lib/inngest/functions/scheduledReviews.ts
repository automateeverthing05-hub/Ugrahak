import { inngest } from "@/lib/inngest/client";
import { processPendingReviewRequests } from "@/lib/reviews/reviewScheduler";
import {
  findAndScheduleInactiveCustomers,
  processPendingReengagementCampaigns,
} from "@/lib/automations/reengagementScheduler";
import { logger } from "@/lib/observability/logger";

/**
 * Inngest Background Function: Process Pending Google Review Requests via Inngest Cron
 * Automatically triggered every minute by Inngest's built-in scheduler (replaces Vercel Cron)
 * and can also be triggered manually via event "merchant/reviews.process".
 */
export const processReviewRequestsFunction = inngest.createFunction(
  {
    id: "process-pending-review-requests",
    name: "Process Pending Google Review Requests (Inngest Cron)",
    retries: 2,
    concurrency: {
      limit: 5,
    },
    triggers: [
      { cron: "* * * * *" },
      { event: "merchant/reviews.process" },
    ],
  },
  async ({ step }: { step: any }) => {
    const summary = await step.run("process-review-requests", async () => {
      return await processPendingReviewRequests();
    });

    logger.info("Inngest review requests processed via Inngest Cron", {
      operation: "INNGEST_PROCESS_REVIEWS",
      metadata: summary,
    });

    return summary;
  }
);

/**
 * Inngest Durable Workflow: 30-Minute Post-Visit Google Review Reminder
 * Triggered on customer first visit, sleeps durably for 30 minutes in Inngest,
 * and then executes review reminder processing idempotently.
 */
export const scheduledCustomerReviewReminderFunction = inngest.createFunction(
  {
    id: "scheduled-customer-review-reminder",
    name: "Scheduled 30-Min First Visit Review Reminder",
    retries: 3,
    concurrency: {
      limit: 20,
    },
    triggers: [
      { event: "merchant/customer.checked_in" },
      { event: "merchant/review.schedule" },
    ],
  },
  async ({ event, step }: { event: any; step: any }) => {
    const data = event?.data || {};

    // Only schedule review reminder for first visits
    if (!data.isFirstVisit && event.name !== "merchant/review.schedule") {
      return { status: "SKIPPED", reason: "Not a first visit" };
    }

    // Step 1: Sleep durably for 30 minutes via Inngest scheduler
    await step.sleep("wait-30-minutes", "30m");

    // Step 2: Run idempotent review dispatch for pending requests
    const summary = await step.run("dispatch-review-request", async () => {
      return await processPendingReviewRequests();
    });

    logger.info("Inngest 30-minute review reminder workflow completed", {
      operation: "INNGEST_30MIN_REVIEW_REMINDER",
      merchantId: data.merchantId,
      customerId: data.customerId,
      metadata: summary,
    });

    return {
      status: "COMPLETED",
      merchantId: data.merchantId,
      customerId: data.customerId,
      summary,
    };
  }
);

/**
 * Inngest Background Function: Process 30-Day Inactive Customer Re-engagement
 * Runs daily at 10:00 AM IST (04:30 AM UTC) to scan and dispatch personalized offers.
 */
export const processInactiveCustomerReengagementFunction = inngest.createFunction(
  {
    id: "process-inactive-customer-reengagement",
    name: "30-Day Inactive Customer Re-engagement Workflow",
    retries: 2,
    concurrency: {
      limit: 5,
    },
    triggers: [
      { cron: "30 4 * * *" }, // Daily at 10:00 AM IST (04:30 UTC)
      { event: "merchant/reengagement.process" },
    ],
  },
  async ({ step }: { step: any }) => {
    // Step 1: Scan inactive customers and schedule campaigns
    const scanSummary = await step.run("scan-inactive-customers", async () => {
      return await findAndScheduleInactiveCustomers();
    });

    // Step 2: Process pending campaigns and dispatch personalized notifications
    const dispatchSummary = await step.run("dispatch-reengagement-campaigns", async () => {
      return await processPendingReengagementCampaigns();
    });

    logger.info("Inngest 30-day inactive re-engagement completed", {
      operation: "INNGEST_30DAY_REENGAGEMENT",
      metadata: { scanSummary, dispatchSummary },
    });

    return {
      status: "COMPLETED",
      scanSummary,
      dispatchSummary,
    };
  }
);

