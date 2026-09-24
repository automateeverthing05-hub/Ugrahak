import { inngest } from "@/lib/inngest/client";
import { logger } from "@/lib/observability/logger";

export interface CustomerCheckinEventData {
  merchantId: string;
  customerId: string;
  isFirstVisit: boolean;
  visitCount: number;
  visitedAt: string;
}

/**
 * Inngest Background Function: Process Non-Critical Check-In Analytics & Telemetry
 * Runs asynchronously and idempotently without blocking or failing the customer check-in response.
 */
export const processCustomerCheckinAnalyticsFunction = inngest.createFunction(
  {
    id: "process-customer-checkin-analytics",
    name: "Process Customer Check-in Analytics",
    retries: 3,
    concurrency: {
      limit: 20,
    },
    triggers: [{ event: "merchant/customer.checked_in" }],
  },
  async ({ event, step }: { event: any; step: any }) => {
    const data = (event?.data || {}) as CustomerCheckinEventData;

    await step.run("log-telemetry", async () => {
      logger.info("Asynchronous check-in telemetry recorded", {
        operation: "CHECKIN_ANALYTICS",
        metadata: {
          merchantId: data.merchantId,
          customerId: data.customerId,
          isFirstVisit: data.isFirstVisit,
          visitCount: data.visitCount,
          visitedAt: data.visitedAt,
        },
      });
      return { success: true };
    });

    return {
      status: "COMPLETED",
      merchantId: data.merchantId,
      customerId: data.customerId,
      visitCount: data.visitCount,
    };
  }
);

