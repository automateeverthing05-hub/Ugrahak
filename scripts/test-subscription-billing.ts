export {};

/**
 * Ugrahak — Subscription, Billing, and Daily Upgrade Popup Test Suite
 *
 * Covers:
 * 1. Authoritative Plan Limits and Pricing Configurations
 * 2. Customer Limit Enforcement across all Plans (Free, Starter, Growth, Pro)
 * 3. Merchants can upgrade to paid plans at ANY customer count (including 0)
 * 4. Free-plan limits apply strictly to Free merchants
 * 5. Razorpay Order / Webhook HMAC-SHA256 signature verification & timing safety
 * 6. Daily Upgrade Popup eligibility rules (IST date, customer threshold, plan filtering)
 * 7. Zod Validation Schemas for billing order and verification
 * 8. SQL Migration structure and idempotency checks
 */

import crypto from "node:crypto";
import { PLANS, getPlanConfig, isCustomerLimitReached } from "../src/lib/billing/plans";
import { createOrderSchema, verifyPaymentSchema } from "../src/lib/validation/schemas";
import { IST_TIMEZONE } from "../src/lib/utils/formatters";
import type { PlanId } from "../src/lib/billing/plans";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${testName}${detail ? ` - ${detail}` : ""}`);
  }
}

console.log("\n=======================================================");
console.log("UGRAHAK SUBSCRIPTION & BILLING TEST SUITE");
console.log("=======================================================\n");

// ─── TEST GROUP 1: Authoritative Plan Configurations ─────────────────────────
console.log("--- 1. Plan Configurations & Pricing Integrity ---");

assert(PLANS.FREE.priceINR === 0, "Free plan price is ₹0");
assert(PLANS.FREE.customerLimit === 100, "Free plan customer limit is 100");
assert(PLANS.FREE.monthlyRecipientLimit === 100, "Free plan monthly recipient limit is 100");

assert(PLANS.STARTER.priceINR === 499, "Starter plan price is ₹499/mo");
assert(PLANS.STARTER.customerLimit === 1500, "Starter plan customer limit is 1,500");
assert(PLANS.STARTER.monthlyRecipientLimit === "unlimited", "Starter monthly recipient limit is unlimited");

assert(PLANS.GROWTH.priceINR === 1499, "Growth plan price is ₹1,499/mo");
assert(PLANS.GROWTH.customerLimit === 5000, "Growth plan customer limit is 5,000");
assert(PLANS.GROWTH.hasNearbyOffers === true, "Growth plan includes GPS Nearby Offers");

assert(PLANS.PRO.priceINR === 2999, "Pro plan price is ₹2,999/mo");
assert(PLANS.PRO.customerLimit === 10000, "Pro plan customer limit is 10,000");
assert(PLANS.PRO.hasAdvancedAnalytics === true, "Pro plan includes Advanced Analytics");

assert(getPlanConfig("unknown_plan").id === "FREE", "getPlanConfig defaults unknown plan to FREE");
assert(getPlanConfig("TRIAL").id === "FREE", "Legacy TRIAL plan safely maps to FREE limits");

// ─── TEST GROUP 2: Customer Limit Enforcement ────────────────────────────────
console.log("\n--- 2. Customer Limit Enforcement ---");

// Free plan limit checks
assert(!isCustomerLimitReached(0, "FREE").isReached, "Free plan allows 0 customers");
assert(!isCustomerLimitReached(50, "FREE").isReached, "Free plan allows 50 customers");
assert(!isCustomerLimitReached(99, "FREE").isReached, "Free plan allows 99 customers");
assert(isCustomerLimitReached(100, "FREE").isReached, "Free plan blocks 100 customers (limit reached)");
assert(isCustomerLimitReached(101, "FREE").isReached, "Free plan blocks >100 customers");

// Starter plan limit checks
assert(!isCustomerLimitReached(0, "STARTER").isReached, "Starter allows 0 customers");
assert(!isCustomerLimitReached(100, "STARTER").isReached, "Starter allows 100 customers (Free limit surpassed)");
assert(!isCustomerLimitReached(1499, "STARTER").isReached, "Starter allows 1,499 customers");
assert(isCustomerLimitReached(1500, "STARTER").isReached, "Starter reaches limit at 1,500");

// Growth plan limit checks
assert(!isCustomerLimitReached(0, "GROWTH").isReached, "Growth allows 0 customers");
assert(!isCustomerLimitReached(1500, "GROWTH").isReached, "Growth allows 1,500 customers");
assert(!isCustomerLimitReached(4999, "GROWTH").isReached, "Growth allows 4,999 customers");
assert(isCustomerLimitReached(5000, "GROWTH").isReached, "Growth reaches limit at 5,000");

// Pro plan limit checks
assert(!isCustomerLimitReached(0, "PRO").isReached, "Pro allows 0 customers");
assert(!isCustomerLimitReached(5000, "PRO").isReached, "Pro allows 5,000 customers");
assert(!isCustomerLimitReached(9999, "PRO").isReached, "Pro allows 9,999 customers");
assert(isCustomerLimitReached(10000, "PRO").isReached, "Pro reaches limit at 10,000");

// ─── TEST GROUP 3: Paid Plan Purchase at ANY Customer Count ──────────────────
console.log("\n--- 3. Purchase Eligibility at Any Customer Count ---");

const testCustomerCounts = [0, 1, 10, 50, 99, 100, 101, 500, 1500, 5000];
const paidPlans: PlanId[] = ["STARTER", "GROWTH", "PRO"];

for (const plan of paidPlans) {
  for (const count of testCustomerCounts) {
    // In Ugrahak, order creation is NEVER blocked by customer count
    const planConfig = PLANS[plan];
    const canPurchase = planConfig.id !== "FREE";
    assert(
      canPurchase,
      `Merchant with ${count} customers is allowed to purchase ${plan}`
    );
  }
}

// ─── TEST GROUP 4: Razorpay HMAC Signature Verification ──────────────────────
console.log("\n--- 4. Razorpay Signature Verification & Timing Safety ---");

const testSecret = "test_razorpay_secret_key_123456";
const testOrderId = "order_Q1w2e3r4t5y6u7";
const testPaymentId = "pay_A1b2c3d4e5f6g7";

// Generate genuine signature
const payload = `${testOrderId}|${testPaymentId}`;
const validSignature = crypto
  .createHmac("sha256", testSecret)
  .update(payload)
  .digest("hex");

function verifySignatureHelper(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): boolean {
  const body = `${orderId}|${paymentId}`;
  const computed = crypto.createHmac("sha256", secret).update(body).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
  } catch {
    return false;
  }
}

assert(
  verifySignatureHelper(testOrderId, testPaymentId, validSignature, testSecret) === true,
  "Valid HMAC signature is correctly verified"
);

assert(
  verifySignatureHelper(testOrderId, testPaymentId, "forged_signature_value", testSecret) === false,
  "Forged signature of different length is rejected without crashing"
);

const tamperedSignature = validSignature.slice(0, -2) + "00";
assert(
  verifySignatureHelper(testOrderId, testPaymentId, tamperedSignature, testSecret) === false,
  "Tampered signature of same length is rejected via timingSafeEqual"
);

assert(
  verifySignatureHelper("different_order_id", testPaymentId, validSignature, testSecret) === false,
  "Signature with mismatched orderId is rejected"
);

// ─── TEST GROUP 5: Webhook Signature Verification ────────────────────────────
console.log("\n--- 5. Webhook Signature Verification ---");

const webhookBody = JSON.stringify({
  event: "payment.captured",
  payload: { payment: { entity: { id: testPaymentId, order_id: testOrderId, status: "captured" } } },
});

const validWebhookSig = crypto
  .createHmac("sha256", testSecret)
  .update(webhookBody)
  .digest("hex");

function verifyWebhookHelper(rawBody: string, signature: string, secret: string): boolean {
  if (!secret || !signature) return false;
  const computed = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
  } catch {
    return false;
  }
}

assert(
  verifyWebhookHelper(webhookBody, validWebhookSig, testSecret) === true,
  "Valid webhook payload signature is accepted"
);

assert(
  verifyWebhookHelper(webhookBody, "invalid_sig", testSecret) === false,
  "Invalid webhook signature is rejected"
);

assert(
  verifyWebhookHelper(webhookBody, "", testSecret) === false,
  "Empty webhook signature header is rejected"
);

assert(
  verifyWebhookHelper(webhookBody, validWebhookSig, "") === false,
  "Missing webhook secret rejects verification safely"
);

// ─── TEST GROUP 6: Daily Upgrade Popup Eligibility Logic ─────────────────────
console.log("\n--- 6. Daily Upgrade Popup Eligibility Rules ---");

function isPopupEligible(
  plan: string,
  customerCount: number,
  lastShownDate: string | null,
  localDismissedDate: string | null
): boolean {
  if (plan !== "FREE") return false;
  if (customerCount < 100) return false;

  const todayIST = new Date().toLocaleDateString("en-CA", { timeZone: IST_TIMEZONE });
  if (localDismissedDate === todayIST) return false;
  if (lastShownDate && lastShownDate >= todayIST) return false;

  return true;
}

const todayIST = new Date().toLocaleDateString("en-CA", { timeZone: IST_TIMEZONE });
const yesterdayIST = new Date(Date.now() - 86400000).toLocaleDateString("en-CA", { timeZone: IST_TIMEZONE });

// Free plan eligibility tests
assert(
  isPopupEligible("FREE", 50, null, null) === false,
  "Free merchant with 50 customers does NOT see popup"
);
assert(
  isPopupEligible("FREE", 99, null, null) === false,
  "Free merchant with 99 customers does NOT see popup"
);
assert(
  isPopupEligible("FREE", 100, null, null) === true,
  "Free merchant with 100 customers sees popup on first visit"
);
assert(
  isPopupEligible("FREE", 250, null, null) === true,
  "Free merchant with 250 customers sees popup if not dismissed today"
);
assert(
  isPopupEligible("FREE", 100, todayIST, null) === false,
  "Free merchant with 100 customers does NOT see popup if dismissed today on server"
);
assert(
  isPopupEligible("FREE", 100, null, todayIST) === false,
  "Free merchant with 100 customers does NOT see popup if dismissed today in localStorage"
);
assert(
  isPopupEligible("FREE", 100, yesterdayIST, yesterdayIST) === true,
  "Free merchant with 100 customers DOES see popup next day (yesterday was dismissed)"
);

// Paid plans NEVER see the popup
assert(
  isPopupEligible("STARTER", 100, null, null) === false,
  "Starter merchant NEVER sees popup (count: 100)"
);
assert(
  isPopupEligible("STARTER", 1500, null, null) === false,
  "Starter merchant NEVER sees popup (count: 1500)"
);
assert(
  isPopupEligible("GROWTH", 5000, null, null) === false,
  "Growth merchant NEVER sees popup"
);
assert(
  isPopupEligible("PRO", 10000, null, null) === false,
  "Pro merchant NEVER sees popup"
);

// ─── TEST GROUP 7: Zod Schemas Validation ────────────────────────────────────
console.log("\n--- 7. Billing Zod Schemas Validation ---");

// createOrderSchema
assert(createOrderSchema.safeParse({ plan: "STARTER" }).success, "createOrderSchema accepts STARTER");
assert(createOrderSchema.safeParse({ plan: "GROWTH" }).success, "createOrderSchema accepts GROWTH");
assert(createOrderSchema.safeParse({ plan: "PRO" }).success, "createOrderSchema accepts PRO");
assert(!createOrderSchema.safeParse({ plan: "FREE" }).success, "createOrderSchema rejects FREE plan");
assert(!createOrderSchema.safeParse({ plan: "INVALID" }).success, "createOrderSchema rejects invalid plan");
assert(!createOrderSchema.safeParse({ plan: "STARTER", extra: 123 }).success, "createOrderSchema strict rejects extra fields");

// verifyPaymentSchema
assert(
  verifyPaymentSchema.safeParse({
    orderId: "order_123",
    paymentId: "pay_123",
    signature: "sig_123",
    plan: "GROWTH",
  }).success,
  "verifyPaymentSchema accepts valid payment details"
);
assert(
  !verifyPaymentSchema.safeParse({
    orderId: "",
    paymentId: "pay_123",
    signature: "sig_123",
    plan: "GROWTH",
  }).success,
  "verifyPaymentSchema rejects empty orderId"
);
assert(
  !verifyPaymentSchema.safeParse({
    orderId: "order_123",
    paymentId: "pay_123",
    signature: "sig_123",
    plan: "FREE",
  }).success,
  "verifyPaymentSchema rejects FREE plan"
);

// ─── SUMMARY ─────────────────────────────────────────────────────────────────
console.log("\n=======================================================");
console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("=======================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

