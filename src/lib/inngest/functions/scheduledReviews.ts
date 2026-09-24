import { inngest } from "@/lib/inngest/client";
import { processPendingReviewRequests } from "@/lib/reviews/reviewScheduler";
import { logger } from "@/lib/observability/logger";

export const processReviewRequestsFunction = inngest.createFunction(
  {
    id: "process-pending-review-requests",
    name: "Process Pending Google Review Requests",
    retries: 2,
    concurrency: {
      limit: 5,
    },
    triggers: [{ event: "merchant/reviews.process" }],
  },
  async ({ step }: { step: any }) => {
    const summary = await step.run("process-review-requests", async () => {
      return await processPendingReviewRequests();
    });

    logger.info("Inngest review requests processed", {
      operation: "INNGEST_PROCESS_REVIEWS",
      metadata: summary,
    });

    return summary;
  }
);

