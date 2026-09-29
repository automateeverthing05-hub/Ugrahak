export type PlanId = "FREE" | "STARTER" | "GROWTH" | "PRO";

export interface PlanConfig {
  id: PlanId;
  name: string;
  priceINR: number;
  period: "month";
  customerLimit: number;
  monthlyRecipientLimit: number | "unlimited";
  weeklyOfferLimit: number | "unlimited";
  hasNearbyOffers: boolean;
  hasAdvancedAnalytics: boolean;
  hasStaffAccounts: boolean;
  hasBasicCustomerTracking: boolean;
  hasGoogleReviewRequests: boolean;
  features: string[];
}

export const PLANS: Record<PlanId, PlanConfig> = {
  FREE: {
    id: "FREE",
    name: "Free",
    priceINR: 0,
    period: "month",
    customerLimit: 100,
    monthlyRecipientLimit: 100,
    weeklyOfferLimit: "unlimited",
    hasNearbyOffers: false,
    hasAdvancedAnalytics: false,
    hasStaffAccounts: false,
    hasBasicCustomerTracking: false,
    hasGoogleReviewRequests: true,
    features: [
      "Maximum 100 customers",
      "Maximum 100 Send Offer customer recipients per month",
      "Google Review Requests",
      "Store QR code & scratch cards",
    ],
  },
  STARTER: {
    id: "STARTER",
    name: "Starter",
    priceINR: 999,
    period: "month",
    customerLimit: 1500,
    monthlyRecipientLimit: "unlimited",
    weeklyOfferLimit: "unlimited",
    hasNearbyOffers: false,
    hasAdvancedAnalytics: false,
    hasStaffAccounts: false,
    hasBasicCustomerTracking: true,
    hasGoogleReviewRequests: true,
    features: [
      "Maximum 1,500 customers",
      "Send Offer",
      "Google Review Requests",
      "Basic Customer Tracking",
      "Store QR code & scratch cards",
    ],
  },
  GROWTH: {
    id: "GROWTH",
    name: "Growth",
    priceINR: 2999,
    period: "month",
    customerLimit: 5000,
    monthlyRecipientLimit: "unlimited",
    weeklyOfferLimit: "unlimited",
    hasNearbyOffers: true,
    hasAdvancedAnalytics: false,
    hasStaffAccounts: false,
    hasBasicCustomerTracking: true,
    hasGoogleReviewRequests: true,
    features: [
      "Maximum 5,000 customers",
      "Send Offer",
      "Google Review Requests",
      "Basic Customer Tracking",
      "Nearby Offers (100–200m)",
      "Priority offer sending",
    ],
  },
  PRO: {
    id: "PRO",
    name: "Pro",
    priceINR: 6999,
    period: "month",
    customerLimit: 10000,
    monthlyRecipientLimit: "unlimited",
    weeklyOfferLimit: "unlimited",
    hasNearbyOffers: true,
    hasAdvancedAnalytics: true,
    hasStaffAccounts: true,
    hasBasicCustomerTracking: true,
    hasGoogleReviewRequests: true,
    features: [
      "Maximum 10,000 customers",
      "Send Offer",
      "Google Review Requests",
      "Advanced Customer Tracking",
      "Nearby Offers (100–200m)",
      "Business Growth Insights",
      "Multiple Staff",
    ],
  },
};

/**
 * Returns plan configuration for a given plan ID (defaults to FREE)
 */
export function getPlanConfig(planId?: string | null): PlanConfig {
  const normalized = (planId || "FREE").toUpperCase();
  if (normalized === "STARTER") return PLANS.STARTER;
  if (normalized === "GROWTH") return PLANS.GROWTH;
  if (normalized === "PRO") return PLANS.PRO;
  return PLANS.FREE;
}

/**
 * Calculates current billing month start and end dates for a merchant
 */
export function getBillingPeriod(subscriptionStartedAt?: string | null): { start: string; end: string } {
  const now = new Date();
  if (!subscriptionStartedAt) {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0)).toISOString();
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999)).toISOString();
    return { start, end };
  }

  const subStart = new Date(subscriptionStartedAt);
  const dayOfMonth = subStart.getUTCDate();

  let periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), dayOfMonth, 0, 0, 0, 0));
  if (periodStart > now) {
    periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, dayOfMonth, 0, 0, 0, 0));
  }
  const periodEnd = new Date(periodStart);
  periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1);
  periodEnd.setUTCMilliseconds(periodEnd.getUTCMilliseconds() - 1);

  return {
    start: periodStart.toISOString(),
    end: periodEnd.toISOString(),
  };
}

/**
 * Checks if merchant has reached customer database limit
 */
export function isCustomerLimitReached(currentCustomerCount: number, planId?: string | null): {
  isReached: boolean;
  limit: number;
  current: number;
} {
  const config = getPlanConfig(planId);
  return {
    isReached: currentCustomerCount >= config.customerLimit,
    limit: config.customerLimit,
    current: currentCustomerCount,
  };
}

/**
 * Checks monthly Send Offer recipient limit allowance
 */
export function checkOfferRecipientAllowance(
  usedRecipients: number,
  recipientsNeeded: number,
  planId?: string | null
): {
  allowed: boolean;
  used: number;
  limit: number | "unlimited";
  remaining: number | "unlimited";
  message?: string;
} {
  const config = getPlanConfig(planId);

  if (config.monthlyRecipientLimit === "unlimited") {
    return {
      allowed: true,
      used: usedRecipients,
      limit: "unlimited",
      remaining: "unlimited",
    };
  }

  const limit = config.monthlyRecipientLimit;
  const remaining = Math.max(0, limit - usedRecipients);

  if (remaining <= 0) {
    return {
      allowed: false,
      used: usedRecipients,
      limit,
      remaining: 0,
      message: `You have reached your monthly Send Offer limit of ${limit} customer recipients.`,
    };
  }

  if (recipientsNeeded > remaining) {
    return {
      allowed: false,
      used: usedRecipients,
      limit,
      remaining,
      message: `You have ${remaining} offer recipients remaining this month. This campaign requires ${recipientsNeeded}.`,
    };
  }

  return {
    allowed: true,
    used: usedRecipients,
    limit,
    remaining: remaining - recipientsNeeded,
  };
}

/**
 * Checks if merchant's plan supports Nearby Offers
 */
export function canUseNearbyOffers(planId?: string | null): boolean {
  const config = getPlanConfig(planId);
  return config.hasNearbyOffers;
}

/**
 * Checks if merchant's plan supports Business Growth Insights
 */
export function canUseBusinessGrowthInsights(planId?: string | null): boolean {
  const config = getPlanConfig(planId);
  return config.hasAdvancedAnalytics;
}

/**
 * Checks if merchant's plan supports Multiple Staff
 */
export function canUseMultipleStaff(planId?: string | null): boolean {
  const config = getPlanConfig(planId);
  return config.hasStaffAccounts;
}

/**
 * Checks if merchant's plan supports Basic Customer Tracking
 */
export function hasBasicCustomerTracking(planId?: string | null): boolean {
  const config = getPlanConfig(planId);
  return config.hasBasicCustomerTracking;
}

/**
 * Razorpay Payment Gateway Interface Adapter
 */
export interface PaymentOrderParams {
  merchantId: string;
  planId: "STARTER" | "GROWTH" | "PRO";
  amountINR: number;
}

export interface PaymentGatewayAdapter {
  createSubscriptionOrder(params: PaymentOrderParams): Promise<{ orderId: string }>;
  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): Promise<boolean>;
}
