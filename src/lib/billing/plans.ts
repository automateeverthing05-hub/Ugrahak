export type PlanId = "STARTER" | "GROWTH" | "PRO" | "TRIAL";

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
  features: string[];
}

export const PLANS: Record<"STARTER" | "GROWTH" | "PRO", PlanConfig> = {
  STARTER: {
    id: "STARTER",
    name: "Starter",
    priceINR: 999,
    period: "month",
    customerLimit: 100,
    monthlyRecipientLimit: 100,
    weeklyOfferLimit: 1,
    hasNearbyOffers: false,
    hasAdvancedAnalytics: false,
    hasStaffAccounts: false,
    features: [
      "Up to 100 customers",
      "Customer List",
      "New Customer Reward",
      "Send Offers (100 customer recipients/month)",
      "Google Review requests",
      "Basic customer tracking",
      "Store QR code & scratch cards",
    ],
  },
  GROWTH: {
    id: "GROWTH",
    name: "Growth",
    priceINR: 2999,
    period: "month",
    customerLimit: 5000,
    monthlyRecipientLimit: 5000,
    weeklyOfferLimit: 3,
    hasNearbyOffers: true,
    hasAdvancedAnalytics: false,
    hasStaffAccounts: false,
    features: [
      "Up to 5,000 customers",
      "Send Offers (5,000 customer recipients/month)",
      "3 weekly offers",
      "Get More Google Reviews",
      "Track repeat customers",
      "Offers for Nearby Customers (100–200m radius)",
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
    features: [
      "Up to 10,000 customers",
      "Unlimited customer recipients for Send Offer",
      "Unlimited weekly offers",
      "Get More Google Reviews",
      "Track Repeat Customers",
      "Offers for Nearby Customers (100–200m radius)",
      "Business Growth Insights",
      "Multiple staff support",
    ],
  },
};

/**
 * Returns plan configuration for a given plan ID (defaults to STARTER)
 */
export function getPlanConfig(planId?: string | null): PlanConfig {
  const normalized = (planId || "STARTER").toUpperCase();
  if (normalized === "GROWTH") return PLANS.GROWTH;
  if (normalized === "PRO") return PLANS.PRO;
  return PLANS.STARTER;
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
