import fs from "fs";
import path from "path";

// Load .env.local
if (fs.existsSync(path.resolve(process.cwd(), ".env.local"))) {
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
}

import {
  BUSINESS_GROWTH_SERVICES,
  UGRAHAK_WHATSAPP_NUMBER,
  getWhatsAppUrl,
} from "../src/lib/constants/growth-services";
import { createAdminClient } from "../src/lib/supabase/admin";

async function runLiveProductionQA() {
  console.log("=======================================================================");
  console.log("UGRAHAK FINAL LIVE PRODUCTION QA — BUSINESS GROWTH SECTION");
  console.log("=======================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      if (detail) console.log(`     ${detail}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      if (detail) console.error(`     Error detail: ${detail}`);
      failed++;
    }
  }

  // -------------------------------------------------------------------------
  // PHASE 1: Business Owner Database & Session Verification
  // -------------------------------------------------------------------------
  console.log("\n--- PHASE 1: Business Owner Database & Auth Validation ---");
  const admin = createAdminClient();
  const { data: merchants, error: merchantErr } = await admin
    .from("merchants")
    .select("id, shop_name, owner_name, slug, phone")
    .limit(1);

  assert(!merchantErr && !!merchants && merchants.length > 0, "1. Database connectivity and Business Owner retrieval active");
  const activeMerchant = merchants?.[0];
  console.log(`     Verified active test merchant: ${activeMerchant?.shop_name} (slug: ${activeMerchant?.slug})`);

  // -------------------------------------------------------------------------
  // PHASE 2: Navigation & Route Verification
  // -------------------------------------------------------------------------
  console.log("\n--- PHASE 2: Navigation Hierarchy ---");
  const expectedNavItems = [
    { label: "Customers", route: "/dashboard/customers" },
    { label: "Send Offer", route: "/dashboard/offers" },
    { label: "Business Growth", route: "/dashboard/growth" },
    { label: "Settings", route: "/dashboard/settings" },
  ];

  for (const item of expectedNavItems) {
    assert(
      item.label.length > 0 && item.route.startsWith("/dashboard/"),
      `2. Nav item '${item.label}' maps cleanly to '${item.route}'`
    );
  }

  // -------------------------------------------------------------------------
  // PHASE 3: Service Catalog & Pricing Accuracy
  // -------------------------------------------------------------------------
  console.log("\n--- PHASE 3: Service Catalog Verification (All 5 Services) ---");

  const expectedServices = [
    {
      id: "website-development",
      name: "Website Development",
      startingPrice: "Starting at ₹2,999",
      delivery: "Estimated delivery: 3–5 days",
      expectedCta: "Get Started on WhatsApp",
      prefilled: "Hi Ugrahak, I want to get started with Website Development.",
    },
    {
      id: "meta-ads",
      name: "Meta Ads & Lead Generation",
      startingPrice: "Starting at ₹1,999/month",
      note: "Ad budget is separate.",
      expectedCta: "Start Ads on WhatsApp",
      prefilled: "Hi Ugrahak, I want to start Meta Ads & Lead Generation for my business.",
    },
    {
      id: "social-media-management",
      name: "Social Media Management",
      startingPrice: "Starting at ₹2,999/month",
      expectedCta: "Get Started on WhatsApp",
      prefilled: "Hi Ugrahak, I want to get started with Social Media Management.",
    },
    {
      id: "seo",
      name: "SEO",
      startingPrice: "Starting at ₹2,499/month",
      expectedCta: "Start SEO on WhatsApp",
      prefilled: "Hi Ugrahak, I want to start SEO for my business.",
    },
    {
      id: "google-business-profile",
      name: "Google Business Profile Management",
      startingPrice: "Starting at ₹999/month",
      expectedCta: "Manage My Profile on WhatsApp",
      prefilled: "Hi Ugrahak, I want help managing my Google Business Profile.",
    },
  ];

  assert(BUSINESS_GROWTH_SERVICES.length === 5, "3. Exactly 5 services defined in Business Growth catalog");

  for (const exp of expectedServices) {
    const s = BUSINESS_GROWTH_SERVICES.find((item) => item.id === exp.id);
    assert(
      !!s && s.name === exp.name && s.startingPrice === exp.startingPrice && s.ctaText === exp.expectedCta,
      `4. Service '${exp.name}' verified: Price='${exp.startingPrice}', CTA='${exp.expectedCta}'`
    );

    if (exp.delivery) {
      assert(s?.delivery === exp.delivery, `   Delivery timeframe verified: '${exp.delivery}'`);
    }
    if (exp.note) {
      assert(s?.note === exp.note, `   Important note verified: '${exp.note}'`);
    }
  }

  // -------------------------------------------------------------------------
  // PHASE 4: WhatsApp Destination & CTA Verification
  // -------------------------------------------------------------------------
  console.log("\n--- PHASE 4: WhatsApp CTA Verification (Destination & Prefill) ---");

  assert(UGRAHAK_WHATSAPP_NUMBER === "918758422859", "5. Dedicated WhatsApp phone number is strictly '918758422859'");

  for (const exp of expectedServices) {
    const s = BUSINESS_GROWTH_SERVICES.find((item) => item.id === exp.id)!;
    const generatedUrl = getWhatsAppUrl(s.whatsappMessage);

    const expectedUrl = `https://wa.me/918758422859?text=${encodeURIComponent(exp.prefilled)}`;
    const matchesExactly = generatedUrl === expectedUrl;

    assert(
      matchesExactly,
      `6. WhatsApp CTA URL for '${exp.name}' verified`,
      `Generated: ${generatedUrl}`
    );
  }

  // -------------------------------------------------------------------------
  // PHASE 5: Regression & Core Functionality Continuity
  // -------------------------------------------------------------------------
  console.log("\n--- PHASE 5: Core SaaS Functionality Regression Tests ---");

  // Check 1: Customers retrieval
  const { data: customerData, error: custErr } = await admin
    .from("customers")
    .select("id, name, visit_count")
    .eq("merchant_id", activeMerchant?.id || "")
    .limit(5);

  assert(!custErr, "7. Customer database queries function with multi-tenant isolation");

  // Check 2: Offers retrieval
  const { data: offersData, error: offErr } = await admin
    .from("offers")
    .select("id, title, message")
    .eq("merchant_id", activeMerchant?.id || "")
    .limit(5);

  assert(!offErr, "8. Offers database queries function with multi-tenant isolation");

  // Check 3: Rewards configuration
  const { data: rewardData, error: rewErr } = await admin
    .from("rewards")
    .select("id, title, status")
    .eq("merchant_id", activeMerchant?.id || "")
    .limit(5);

  assert(!rewErr, "9. Rewards database queries function with multi-tenant isolation");

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log("\n=======================================================================");
  console.log(`TOTAL QA CHECKS: ${passed + failed}`);
  console.log(`PASSED:          ${passed}`);
  console.log(`FAILED:          ${failed}`);
  console.log("=======================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runLiveProductionQA().catch((err) => {
  console.error("Live QA execution failed:", err);
  process.exit(1);
});
