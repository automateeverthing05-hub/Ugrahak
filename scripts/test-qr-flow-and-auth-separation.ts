import fs from "fs";
import path from "path";

// Load .env.local
const envContent = fs.readFileSync(path.resolve(process.cwd(), ".env.local"), "utf-8");
envContent.split("\n").forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = (match[2] || "").trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[match[1]] = val;
  }
});

import { POST as handleCheckin } from "../src/app/api/shop/checkin/route";
import { POST as handleTokenRegistration } from "../src/app/api/shop/notifications/register-token/route";
import { NextRequest } from "next/server";
import { updateSession } from "../src/lib/supabase/middleware";
import { createAdminClient } from "../src/lib/supabase/admin";

async function runTests() {
  console.log("=======================================================");
  console.log("TESTING CUSTOMER QR FLOW & AUTH SEPARATION SUITE");
  console.log("=======================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  const admin = createAdminClient();
  const { data: merchant } = await admin
    .from("merchants")
    .select("id, shop_name, slug")
    .limit(1)
    .single();

  if (!merchant) {
    console.error("No merchant found in database to run tests with.");
    process.exit(1);
  }

  console.log(`Found test merchant: "${merchant.shop_name}" (slug: ${merchant.slug})`);

  // --- TEST A: Public Access to /shop/[slug] & Middleware Fast-Path ---
  console.log("\n--- TEST A: Public Access to Customer QR Routes ---");
  const publicShopReq = new NextRequest(`https://ugrahak.com/shop/${merchant.slug}`);
  const publicMiddlewareRes = await updateSession(publicShopReq);
  assert(
    publicMiddlewareRes.status === 200,
    `Middleware returns 200 OK for /shop/${merchant.slug} without auth`
  );
  assert(
    !publicMiddlewareRes.headers.get("location")?.includes("/login"),
    `Middleware does NOT redirect /shop/${merchant.slug} to /login`
  );

  const publicShopIndexReq = new NextRequest("https://ugrahak.com/shop");
  const publicShopIndexRes = await updateSession(publicShopIndexReq);
  assert(
    publicShopIndexRes.status === 200,
    "Middleware returns 200 OK for /shop without auth"
  );
  assert(
    !publicShopIndexRes.headers.get("location")?.includes("/login"),
    "Middleware does NOT redirect /shop to /login"
  );

  // --- TEST B: Customer Name Submission & Instant Checkin ---
  console.log("\n--- TEST B: Customer Name Checkin ---");
  const customerName = `Test Customer ${Date.now()}`;
  const checkinReq = new NextRequest("https://ugrahak.com/api/shop/checkin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      slug: merchant.slug,
      name: customerName,
    }),
  });

  const checkinRes = await handleCheckin(checkinReq);
  const checkinData = await checkinRes.json();

  assert(checkinRes.status === 200, "Check-in API returns HTTP 200 OK");
  assert(checkinData.success === true, "Check-in response has success: true");
  assert(
    checkinData.customer?.name === customerName,
    "Check-in accurately records customer name"
  );
  assert(
    Boolean(checkinData.customer?.id),
    "Check-in returns valid customer UUID"
  );
  assert(
    Boolean(checkinData.reward?.reference_code),
    `Check-in generates reward reference code (${checkinData.reward?.reference_code})`
  );
  assert(
    checkinData.reward?.status === "ACTIVE",
    "Reward is ACTIVE and ready to be scratched"
  );

  // --- TEST C: FCM Push Token Registration ---
  console.log("\n--- TEST C: FCM Push Token Registration ---");
  const sampleFcmToken = `fcm_test_token_${Date.now()}_abc123xyz456`;
  const tokenReq = new NextRequest(
    "https://ugrahak.com/api/shop/notifications/register-token",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: merchant.slug,
        customer_id: checkinData.customer.id,
        token: sampleFcmToken,
        platform: "web",
      }),
    }
  );

  const tokenRes = await handleTokenRegistration(tokenReq);
  const tokenData = await tokenRes.json();

  assert(tokenRes.status === 200, "Token registration returns HTTP 200 OK");
  assert(tokenData.success === true, "Token registration response has success: true");

  // --- TEST D: Customer Flow Separated from Merchant Auth ---
  console.log("\n--- TEST D: Scratch Card & Reward State ---");
  assert(
    checkinData.reward !== null,
    "Customer receives reward data without requiring merchant authentication"
  );
  assert(
    typeof checkinData.reward.title === "string" && checkinData.reward.title.length > 0,
    `Reward title present: "${checkinData.reward.title}"`
  );

  // --- TEST E: Merchant Dashboard Protection ---
  console.log("\n--- TEST E: Protected Merchant Dashboard Redirects Unauthenticated Users ---");
  const dashboardReq = new NextRequest("https://ugrahak.com/dashboard");
  const dashboardRes = await updateSession(dashboardReq);
  assert(
    Boolean(dashboardRes.status === 307 || dashboardRes.status === 308 || dashboardRes.headers.get("location")?.includes("/login")),
    "Unauthenticated access to /dashboard is redirected to /login"
  );
  const locationHeader = dashboardRes.headers.get("location");
  assert(
    Boolean(locationHeader && locationHeader.includes("/login")),
    `Redirect destination is /login (received: ${locationHeader})`
  );

  // --- TEST F: Cross-Merchant Data Protection ---
  console.log("\n--- TEST F: Cross-Merchant Data Security ---");
  // Try to register token for customer using a DIFFERENT merchant's slug
  const crossMerchantReq = new NextRequest(
    "https://ugrahak.com/api/shop/notifications/register-token",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: "nonexistent-other-shop",
        customer_id: checkinData.customer.id,
        token: sampleFcmToken,
        platform: "web",
      }),
    }
  );
  const crossMerchantRes = await handleTokenRegistration(crossMerchantReq);
  assert(
    crossMerchantRes.status === 404 || crossMerchantRes.status === 403,
    "Cross-merchant mismatched token registration is strictly rejected (404/403)"
  );

  console.log("\n=======================================================");
  console.log(`TOTAL TESTS: ${passed + failed}`);
  console.log(`PASSED:      ${passed}`);
  console.log(`FAILED:      ${failed}`);
  console.log("=======================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
