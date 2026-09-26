export type PlanId = "TRIAL" | "STARTER" | "GROWTH" | "PRO";

export interface PlanConfig {
  id: PlanId;
  name: string;
  priceINR: number;
  period: "month" | "trial";
  customerLimit: number;
  weeklyOfferLimit: number | "unlimited";
  hasNearbyOffers: boolean;
  hasAdvancedAnalytics: boolean;
  hasStaffAccounts: boolean;
  features: string[];
}

export const PLANS: Record<PlanId, PlanConfig> = {
  TRIAL: {
    id: "TRIAL",
    name: "7-Day Free Trial",
    priceINR: 0,
    period: "trial",
    customerLimit: 100,
    weeklyOfferLimit: 1,
    hasNearbyOffers: false,
    hasAdvancedAnalytics: false,
    hasStaffAccounts: false,
    features: [
      "Up to 100 customers",
      "Scratch-card reward for new customers",
      "1 weekly offer",
      "Store QR code",
    ],
  },
  STARTER: {
    id: "STARTER",
    name: "Starter",
    priceINR: 999,
    period: "month",
    customerLimit: 1500,
    weeklyOfferLimit: 1,
    hasNearbyOffers: false,
    hasAdvancedAnalytics: false,
    hasStaffAccounts: false,
    features: [
      "Up to 1,500 customers",
      "Automatically send weekly offers",
      "Get More Google Reviews",
      "Track customer visits",
      "Store QR code & scratch cards",
    ],
  },
  GROWTH: {
    id: "GROWTH",
    name: "Growth",
    priceINR: 2999,
    period: "month",
    customerLimit: 5000,
    weeklyOfferLimit: 3,
    hasNearbyOffers: true,
    hasAdvancedAnalytics: false,
    hasStaffAccounts: false,
    features: [
      "Up to 5,000 customers",
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
    weeklyOfferLimit: "unlimited",
    hasNearbyOffers: true,
    hasAdvancedAnalytics: true,
    hasStaffAccounts: true,
    features: [
      "Up to 10,000 customers",
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
 * Returns plan configuration for a given plan ID (defaults to TRIAL)
 */
export function getPlanConfig(planId?: string | null): PlanConfig {
  const normalized = (planId || "TRIAL").toUpperCase() as PlanId;
  return PLANS[normalized] || PLANS.TRIAL;
}

/**
 * Checks if merchant has reached customer limit
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
 * Checks if merchant's plan supports Nearby Offers
 */
export function canUseNearbyOffers(planId?: string | null): boolean {
  const config = getPlanConfig(planId);
  return config.hasNearbyOffers;
}

/**
 * Future Payment Gateway Interface Adapter (Razorpay ready abstraction)
 */
export interface PaymentOrderParams {
  merchantId: string;
  planId: PlanId;
  amountINR: number;
}

export interface PaymentGatewayAdapter {
  createSubscriptionOrder(params: PaymentOrderParams): Promise<{ orderId: string }>;
  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): Promise<boolean>;
}

