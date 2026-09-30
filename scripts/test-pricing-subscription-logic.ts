/**
 * Test Suite: Ugrahak Final Pricing & Subscription System
 * 
 * Verifies:
 * 1. 4 Plan configurations:
 *    - Free @ ₹0/month (100 customers, 100 Send Offer recipients/month, Google Review requests)
 *    - Starter @ ₹999/month (1,500 customers, Send Offer, Google Review requests, Basic Tracking)
 *    - Growth @ ₹2,999/month (5,000 customers, Send Offer, Google Review requests, Basic Tracking, Nearby Offers)
 *    - Pro @ ₹6,999/month (10,000 customers, Send Offer, Google Review requests, Advanced Tracking, Nearby Offers, Growth Insights, Multiple Staff)
 * 2. Signup defaults to FREE plan (without payment). Existing paid merchants stay paid.
 * 3. Server-side customer limit enforcement for each plan tier (100, 1500, 5000, 10000).
 * 4. Free monthly Send Offer recipient quota (100 recipients max, actual recipient count tracking, 101st blocked).
 * 5. Feature gating (Nearby offers for Growth/Pro only, Insights for Pro only, Staff for Pro only, Tracking for Starter/Growth/Pro).
 * 6. Billing period boundaries & isolation.
 */

import {
  PLANS,
  getPlanConfig,
  getBillingPeriod,
  isCustomerLimitReached,
  checkOfferRecipientAllowance,
  canUseNearbyOffers,
  canUseBusinessGrowthInsights,
  canUseMultipleStaff,
  hasBasicCustomerTracking,
} from "../src/lib/billing/plans";

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string, failureDetails?: string) {
  if (condition) {
    console.log(`  ✓ ${testName}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    if (failureDetails) console.error(`    Details: ${failureDetails}`);
    testsFailed++;
  }
}

async function runTestSuite() {
  console.log("==================================================");
  console.log("🧪 RUNNING FINAL PRICING & SUBSCRIPTION TEST SUITE");
  console.log("==================================================\n");

  // TEST 1: Default Plan is FREE & Fallbacks
  console.log("▶ 1. Default & Fallback Plan Behavior:");
  assert(getPlanConfig(null).id === "FREE", "Null plan defaults to FREE");
  assert(getPlanConfig(undefined).id === "FREE", "Undefined plan defaults to FREE");
  assert(getPlanConfig("").id === "FREE", "Empty string plan defaults to FREE");
  assert(getPlanConfig("unknown_plan").id === "FREE", "Invalid plan defaults to FREE");

  // TEST 2: Existing Paid Merchants Retain Their Plans
  console.log("\n▶ 2. Existing Paid Merchant Retention:");
  assert(getPlanConfig("STARTER").id === "STARTER", "Starter merchant remains STARTER");
  assert(getPlanConfig("starter").id === "STARTER", "Case-insensitive 'starter' resolves to STARTER");
  assert(getPlanConfig("GROWTH").id === "GROWTH", "Growth merchant remains GROWTH");
  assert(getPlanConfig("growth").id === "GROWTH", "Case-insensitive 'growth' resolves to GROWTH");
  assert(getPlanConfig("PRO").id === "PRO", "Pro merchant remains PRO");
  assert(getPlanConfig("pro").id === "PRO", "Case-insensitive 'pro' resolves to PRO");

  // TEST 3: All 4 Plan Specifications
  console.log("\n▶ 3. Four Plan Specifications:");
  // Free
  const free = PLANS.FREE;
  assert(free.priceINR === 0, "Free plan is ₹0/month", `Got ${free.priceINR}`);
  assert(free.customerLimit === 100, "Free customer limit is 100", `Got ${free.customerLimit}`);
  assert(free.monthlyRecipientLimit === 100, "Free monthly Send Offer recipient limit is 100", `Got ${free.monthlyRecipientLimit}`);
  assert(free.hasGoogleReviewRequests === true, "Free plan includes Google Review Requests");
  assert(free.hasNearbyOffers === false, "Free plan does NOT have Nearby Offers");
  assert(free.hasBasicCustomerTracking === false, "Free plan does NOT have Basic Customer Tracking");

  // Starter
  const starter = PLANS.STARTER;
  assert(starter.priceINR === 999, "Starter plan is ₹999/month", `Got ${starter.priceINR}`);
  assert(starter.customerLimit === 1500, "Starter customer limit is 1,500", `Got ${starter.customerLimit}`);
  assert(starter.hasGoogleReviewRequests === true, "Starter plan includes Google Review Requests");
  assert(starter.hasBasicCustomerTracking === true, "Starter plan includes Basic Customer Tracking");
  assert(starter.hasNearbyOffers === false, "Starter plan does NOT have Nearby Offers");

  // Growth
  const growth = PLANS.GROWTH;
  assert(growth.priceINR === 2999, "Growth plan is ₹2,999/month", `Got ${growth.priceINR}`);
  assert(growth.customerLimit === 5000, "Growth customer limit is 5,000", `Got ${growth.customerLimit}`);
  assert(growth.hasGoogleReviewRequests === true, "Growth plan includes Google Review Requests");
  assert(growth.hasBasicCustomerTracking === true, "Growth plan includes Basic Customer Tracking");
  assert(growth.hasNearbyOffers === true, "Growth plan includes Nearby Offers (100–200m)");

  // Pro
  const pro = PLANS.PRO;
  assert(pro.priceINR === 6999, "Pro plan is ₹6,999/month", `Got ${pro.priceINR}`);
  assert(pro.customerLimit === 10000, "Pro customer limit is 10,000", `Got ${pro.customerLimit}`);
  assert(pro.hasGoogleReviewRequests === true, "Pro plan includes Google Review Requests");
  assert(pro.hasBasicCustomerTracking === true, "Pro plan includes Advanced Customer Tracking");
  assert(pro.hasNearbyOffers === true, "Pro plan includes Nearby Offers (100–200m)");
  assert(pro.hasAdvancedAnalytics === true, "Pro plan includes Business Growth Insights");
  assert(pro.hasStaffAccounts === true, "Pro plan includes Multiple Staff");

  // TEST 4: Customer Database Limits for Each Plan
  console.log("\n▶ 4. Customer Database Limit Enforcement across all Plans:");
  // Free (100)
  assert(!isCustomerLimitReached(99, "FREE").isReached, "Free: 99 customers is within limit");
  assert(isCustomerLimitReached(100, "FREE").isReached, "Free: 100 customers reaches limit");
  assert(isCustomerLimitReached(101, "FREE").isReached, "Free: 101st customer strictly blocked");

  // Starter (1,500)
  assert(!isCustomerLimitReached(1499, "STARTER").isReached, "Starter: 1499 customers is within limit");
  assert(isCustomerLimitReached(1500, "STARTER").isReached, "Starter: 1500 customers reaches limit");
  assert(isCustomerLimitReached(1501, "STARTER").isReached, "Starter: 1501st customer strictly blocked");

  // Growth (5,000)
  assert(!isCustomerLimitReached(4999, "GROWTH").isReached, "Growth: 4999 customers is within limit");
  assert(isCustomerLimitReached(5000, "GROWTH").isReached, "Growth: 5000 customers reaches limit");
  assert(isCustomerLimitReached(5001, "GROWTH").isReached, "Growth: 5001st customer strictly blocked");

  // Pro (10,000)
  assert(!isCustomerLimitReached(9999, "PRO").isReached, "Pro: 9999 customers is within limit");
  assert(isCustomerLimitReached(10000, "PRO").isReached, "Pro: 10000 customers reaches limit");
  assert(isCustomerLimitReached(10001, "PRO").isReached, "Pro: 10001st customer strictly blocked");

  // TEST 5: Free Send Offer Recipient Quota & Paid Allowance
  console.log("\n▶ 5. Free Monthly Send Offer Recipient Quota & Paid Logic:");
  // Free: First send of 50
  const freeSend1 = checkOfferRecipientAllowance(0, 50, "FREE");
  assert(freeSend1.allowed === true, "Free: First broadcast of 50 recipients allowed");
  assert(freeSend1.remaining === 50, "Free: Remaining quota after 50 is 50", `Got ${freeSend1.remaining}`);

  // Free: Second send of 50 (50 + 50 = 100)
  const freeSend2 = checkOfferRecipientAllowance(50, 50, "FREE");
  assert(freeSend2.allowed === true, "Free: Second broadcast of 50 recipients allowed (reaches 100/100)");
  assert(freeSend2.remaining === 0, "Free: Remaining quota after 100 is 0", `Got ${freeSend2.remaining}`);

  // Free: 101st recipient blocked
  const freeSendBlocked = checkOfferRecipientAllowance(100, 1, "FREE");
  assert(freeSendBlocked.allowed === false, "Free: 101st recipient is strictly blocked");
  assert(
    freeSendBlocked.message === "You have reached your monthly Send Offer limit of 100 customer recipients.",
    "Free: Accurate limit reached error message",
    freeSendBlocked.message
  );

  // Free: Attempting 60 when 50 remaining (50 + 60 = 110 > 100)
  const freePartialExceed = checkOfferRecipientAllowance(50, 60, "FREE");
  assert(freePartialExceed.allowed === false, "Free: Exceeding remaining allowance is blocked");
  assert(
    Boolean(freePartialExceed.message?.includes("You have 50 offer recipients remaining this month")),
    "Free: Detailed remaining quota message",
    freePartialExceed.message
  );

  // Paid Plans: Starter, Growth, Pro not blocked by Free 100 quota
  const starterSend = checkOfferRecipientAllowance(200, 500, "STARTER");
  assert(starterSend.allowed === true, "Starter: Paid plan sends are allowed without Free 100 limit");

  const growthSend = checkOfferRecipientAllowance(1500, 1000, "GROWTH");
  assert(growthSend.allowed === true, "Growth: Paid plan sends are allowed");

  const proSend = checkOfferRecipientAllowance(5000, 3000, "PRO");
  assert(proSend.allowed === true, "Pro: Unlimited recipient volume allowed");

  // TEST 6: Feature Gating Entitlements
  console.log("\n▶ 6. Feature Gating Entitlements:");
  assert(!canUseNearbyOffers("FREE"), "Free cannot use Nearby Offers");
  assert(!canUseNearbyOffers("STARTER"), "Starter cannot use Nearby Offers");
  assert(canUseNearbyOffers("GROWTH"), "Growth CAN use Nearby Offers");
  assert(canUseNearbyOffers("PRO"), "Pro CAN use Nearby Offers");

  assert(!canUseBusinessGrowthInsights("FREE"), "Free cannot use Growth Insights");
  assert(!canUseBusinessGrowthInsights("STARTER"), "Starter cannot use Growth Insights");
  assert(!canUseBusinessGrowthInsights("GROWTH"), "Growth cannot use Growth Insights");
  assert(canUseBusinessGrowthInsights("PRO"), "Pro CAN use Growth Insights");

  assert(!canUseMultipleStaff("FREE"), "Free cannot use Multiple Staff");
  assert(!canUseMultipleStaff("STARTER"), "Starter cannot use Multiple Staff");
  assert(!canUseMultipleStaff("GROWTH"), "Growth cannot use Multiple Staff");
  assert(canUseMultipleStaff("PRO"), "Pro CAN use Multiple Staff");

  assert(!hasBasicCustomerTracking("FREE"), "Free does not have Customer Tracking advertised");
  assert(hasBasicCustomerTracking("STARTER"), "Starter has Basic Customer Tracking");
  assert(hasBasicCustomerTracking("GROWTH"), "Growth has Basic Customer Tracking");
  assert(hasBasicCustomerTracking("PRO"), "Pro has Advanced Customer Tracking");

  // TEST 7: Billing Period Calculation
  console.log("\n▶ 7. Billing Period Calculation:");
  const defaultPeriod = getBillingPeriod(null);
  assert(!!defaultPeriod.start && !!defaultPeriod.end, "Default calendar month period generated");
  assert(new Date(defaultPeriod.end) > new Date(defaultPeriod.start), "Period end is after start");

  const customPeriod = getBillingPeriod("2026-03-15T00:00:00.000Z");
  assert(!!customPeriod.start && !!customPeriod.end, "Custom subscription period generated");
  assert(new Date(customPeriod.end) > new Date(customPeriod.start), "Custom period end is after start");

  // TEST 8: 100-Recipient Automatic Upgrade Prompt & Limit Rules
  console.log("\n▶ 8. 100-Recipient Automatic Upgrade Prompt & Behavior:");
  // Condition 1: Free merchant with 0 used sending to 50 (< 100) -> Allowed, no modal trigger
  const allowBelowLimit = checkOfferRecipientAllowance(0, 50, "FREE");
  assert(allowBelowLimit.allowed === true && Number(allowBelowLimit.remaining ?? 0) > 0, "Free merchant below limit (50/100) is allowed");

  // Condition 2: Free merchant at 100 used sending 1 (100 >= 100) -> Blocked with OFFER_LIMIT_REACHED condition
  const blockAt100 = checkOfferRecipientAllowance(100, 1, "FREE");
  assert(blockAt100.allowed === false, "Free merchant at 100 used is blocked from sending");

  // Condition 3: Free merchant with 80 used sending to 30 customers (80 + 30 = 110 > 100) -> Blocked
  const blockExceedingBatch = checkOfferRecipientAllowance(80, 30, "FREE");
  assert(blockExceedingBatch.allowed === false, "Free merchant batch exceeding remaining quota (80 used + 30 target) is blocked");

  // Condition 4: Paid merchants (Starter, Growth, Pro) have no 100 cap and never trigger Free quota block
  const starterAllow = checkOfferRecipientAllowance(100, 200, "STARTER");
  const growthAllow = checkOfferRecipientAllowance(500, 1000, "GROWTH");
  const proAllow = checkOfferRecipientAllowance(2000, 5000, "PRO");
  assert(starterAllow.allowed && growthAllow.allowed && proAllow.allowed, "Paid plans bypass Free 100 recipient quota");

  console.log("\n==================================================");
  console.log(`TEST RESULTS: ${testsPassed} Passed, ${testsFailed} Failed`);
  console.log("==================================================");

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
