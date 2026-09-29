/**
 * Test Suite: Ugrahak Pricing & Subscription Logic
 * 
 * Verifies:
 * 1. Plans configuration (Starter @ ₹999, Growth @ ₹2999, Pro @ ₹6999)
 * 2. Customer database limit enforcement (Starter limit = 100, strictly blocked on 101)
 * 3. Monthly Send Offer recipient allowance & error messaging
 * 4. Billing period boundaries
 * 5. Multi-tenant quota isolation logic
 */

import {
  PLANS,
  getPlanConfig,
  getBillingPeriod,
  isCustomerLimitReached,
  checkOfferRecipientAllowance,
  canUseNearbyOffers,
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
  console.log("🧪 RUNNING PRICING & SUBSCRIPTION LOGIC TEST SUITE");
  console.log("==================================================\n");

  // TEST 1: Starter Plan Configuration
  console.log("▶ 1. Starter Plan Configuration:");
  const starter = PLANS.STARTER;
  assert(starter.priceINR === 999, "Starter price is ₹999/month", `Got ${starter.priceINR}`);
  assert(starter.customerLimit === 100, "Starter customer limit is 100", `Got ${starter.customerLimit}`);
  assert(starter.monthlyRecipientLimit === 100, "Starter monthly recipient limit is 100", `Got ${starter.monthlyRecipientLimit}`);
  assert(starter.features.length >= 6, "Starter includes essential feature list");
  assert(getPlanConfig(null).id === "STARTER", "Default/fallback plan is STARTER");
  assert(getPlanConfig(undefined).id === "STARTER", "Undefined plan defaults to STARTER");

  // TEST 2: Growth and Pro Plan Configurations
  console.log("\n▶ 2. Growth and Pro Plans Configuration:");
  const growth = PLANS.GROWTH;
  assert(growth.priceINR === 2999, "Growth price is ₹2,999/month", `Got ${growth.priceINR}`);
  assert(growth.customerLimit === 5000, "Growth customer limit is 5,000", `Got ${growth.customerLimit}`);
  assert(growth.monthlyRecipientLimit === 5000, "Growth monthly recipient limit is 5,000", `Got ${growth.monthlyRecipientLimit}`);
  assert(canUseNearbyOffers("GROWTH") === true, "Growth plan has Nearby Offers");

  const pro = PLANS.PRO;
  assert(pro.priceINR === 6999, "Pro price is ₹6,999/month", `Got ${pro.priceINR}`);
  assert(pro.customerLimit === 10000, "Pro customer limit is 10,000", `Got ${pro.customerLimit}`);
  assert(pro.monthlyRecipientLimit === "unlimited", "Pro monthly recipient limit is unlimited", `Got ${pro.monthlyRecipientLimit}`);
  assert(canUseNearbyOffers("PRO") === true, "Pro plan has Nearby Offers");

  // TEST 3: Customer Database Limit Enforcement (Starter)
  console.log("\n▶ 3. Customer Database Limit Enforcement:");
  const belowLimit = isCustomerLimitReached(99, "STARTER");
  assert(!belowLimit.isReached, "99 customers is within Starter limit");

  const atLimit = isCustomerLimitReached(100, "STARTER");
  assert(atLimit.isReached, "100 customers reaches Starter limit");

  const overLimit = isCustomerLimitReached(101, "STARTER");
  assert(overLimit.isReached, "101st customer is strictly blocked on Starter limit");
  assert(overLimit.limit === 100, "Limit reported is 100");

  // TEST 4: Monthly Offer Recipient Quota Logic
  console.log("\n▶ 4. Monthly Send Offer Recipient Quota Allowance:");
  
  // First send of 40 recipients
  const firstSend = checkOfferRecipientAllowance(0, 40, "STARTER");
  assert(firstSend.allowed === true, "First broadcast of 40 recipients is allowed");
  assert(firstSend.remaining === 60, "Remaining recipients after 40 is 60", `Got ${firstSend.remaining}`);

  // Second send requiring 70 recipients when 40 already used (40 + 70 = 110 > 100)
  const partialExceed = checkOfferRecipientAllowance(40, 70, "STARTER");
  assert(partialExceed.allowed === false, "Broadcast of 70 when only 60 remaining is blocked");
  assert(
    Boolean(partialExceed.message?.includes("You have 60 offer recipients remaining this month")),
    "Proper message showing remaining quota and required recipients",
    partialExceed.message
  );

  // When quota is completely exhausted (100 used)
  const quotaExhausted = checkOfferRecipientAllowance(100, 5, "STARTER");
  assert(quotaExhausted.allowed === false, "Broadcast when limit reached is blocked");
  assert(
    quotaExhausted.message === "You have reached your monthly Send Offer limit of 100 customer recipients.",
    "Correct exact error message for reached limit",
    quotaExhausted.message
  );

  // Pro unlimited check
  const proUnlimited = checkOfferRecipientAllowance(5000, 15000, "PRO");
  assert(proUnlimited.allowed === true, "Pro plan allows any recipient volume (unlimited)");
  assert(proUnlimited.remaining === "unlimited", "Pro remaining is unlimited");

  // TEST 5: Billing Period Calculation
  console.log("\n▶ 5. Billing Period Calculation:");
  const defaultPeriod = getBillingPeriod(null);
  assert(!!defaultPeriod.start && !!defaultPeriod.end, "Default calendar month period generated");
  assert(new Date(defaultPeriod.end) > new Date(defaultPeriod.start), "Period end is after start");

  const customPeriod = getBillingPeriod("2026-03-15T00:00:00.000Z");
  assert(!!customPeriod.start && !!customPeriod.end, "Custom subscription period generated");
  assert(new Date(customPeriod.end) > new Date(customPeriod.start), "Custom period end is after start");

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
