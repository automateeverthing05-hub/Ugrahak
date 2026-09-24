import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { broadcastOfferFunction } from "@/lib/inngest/functions/broadcastOffer";
import {
  processReviewRequestsFunction,
  scheduledCustomerReviewReminderFunction,
} from "@/lib/inngest/functions/scheduledReviews";
import { processCustomerCheckinAnalyticsFunction } from "@/lib/inngest/functions/checkinAnalytics";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    broadcastOfferFunction,
    processReviewRequestsFunction,
    scheduledCustomerReviewReminderFunction,
    processCustomerCheckinAnalyticsFunction,
  ],
});
