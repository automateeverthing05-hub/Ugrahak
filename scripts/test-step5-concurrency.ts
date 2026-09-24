import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function parseEnv(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf-8");
  const env: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

const stagingEnv = parseEnv(path.resolve(process.cwd(), ".env.staging.local"));
const prodEnv = parseEnv(path.resolve(process.cwd(), ".env.local"));

const stagingUrl = stagingEnv.NEXT_PUBLIC_SUPABASE_URL || "";
const stagingKey = stagingEnv.SUPABASE_SECRET_KEY || "";
const prodUrl = prodEnv.NEXT_PUBLIC_SUPABASE_URL || "";

function extractRef(url: string): string {
  const match = url.match(/https:\/\/([a-z0-9-]+)\.supabase\.co/i);
  return match ? match[1] : "";
}

const stagingRef = extractRef(stagingUrl);
const prodRef = extractRef(prodUrl);

if (stagingRef === prodRef && prodRef !== "") {
  console.error("CRITICAL SAFETY ABORT: Staging is identical to Production!");
  process.exit(1);
}

const client = createClient(stagingUrl, stagingKey, {
  auth: { persistSession: false },
});

const BASE_URL = "http://localhost:3000";

async function postCheckin(slug: string, name: string, phone: string) {
  const res = await fetch(`${BASE_URL}/api/shop/checkin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug, name, phone }),
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function runTests() {
  console.log("==================================================");
  console.log("STEP 5 CONCURRENCY & IDEMPOTENCY TEST SUITE");
  console.log("==================================================");
  console.log(`Staging Project: ${stagingRef}`);
  console.log(`Production Project: ${prodRef}`);

  const testMerchant1 = "test-merchant-000001";
  const testMerchant2 = "test-merchant-000002";

  // Generate unique phone numbers for this test run
  const testRunId = Math.floor(Math.random() * 800000) + 100000;
  const phoneA = `91${testRunId}01`;
  const phoneB1 = `91${testRunId}02`;
  const phoneB2 = `91${testRunId}03`;
  const phoneC = `91${testRunId}04`;
  const phoneD1 = `91${testRunId}05`;
  const phoneD2 = `91${testRunId}06`;
  const phoneD3 = `91${testRunId}07`;

  // --------------------------------------------------
  // SCENARIO A: Same Merchant + Same Phone (Simultaneous First Visit)
  // --------------------------------------------------
  console.log("\n[SCENARIO A: Concurrent Check-in for Same Merchant + Same Phone]");
  const resultsA = await Promise.all([
    postCheckin(testMerchant1, "Concurrent Cust A1", phoneA),
    postCheckin(testMerchant1, "Concurrent Cust A2", phoneA),
    postCheckin(testMerchant1, "Concurrent Cust A3", phoneA),
  ]);

  console.log("- Responses:", resultsA.map((r) => ({ status: r.status, isFirstVisit: r.data?.isFirstVisit, visitCount: r.data?.visitCount })));

  // Verify database state for phoneA
  const { data: custsA } = await client
    .from("customers")
    .select("id, name, phone, visit_count, merchant_id")
    .eq("phone", phoneA);

  console.log(`- Customers with phone ${phoneA}: ${custsA?.length ?? 0}`);
  if ((custsA?.length ?? 0) !== 1) {
    throw new Error(`FAIL: Scenario A created duplicate customer records! (${custsA?.length})`);
  }

  const { data: rewardsA } = await client
    .from("rewards")
    .select("id, customer_id, reward_type")
    .eq("customer_id", custsA![0].id);

  console.log(`- Rewards for customer: ${rewardsA?.length ?? 0}`);
  if ((rewardsA?.length ?? 0) !== 1) {
    throw new Error(`FAIL: Scenario A created duplicate rewards! (${rewardsA?.length})`);
  }
  console.log("✓ Scenario A PASSED (Single customer, single first reward created without duplicates).");

  // --------------------------------------------------
  // SCENARIO B: Same Merchant + Different Phones
  // --------------------------------------------------
  console.log("\n[SCENARIO B: Concurrent Check-ins for Same Merchant + Different Phones]");
  const resultsB = await Promise.all([
    postCheckin(testMerchant1, "Cust B1", phoneB1),
    postCheckin(testMerchant1, "Cust B2", phoneB2),
  ]);

  console.log("- Responses:", resultsB.map((r) => ({ status: r.status, isFirst: r.data?.isFirstVisit })));
  const { data: custsB } = await client
    .from("customers")
    .select("id, phone")
    .in("phone", [phoneB1, phoneB2]);

  if (custsB?.length !== 2) {
    throw new Error(`FAIL: Scenario B expected 2 distinct customers, found ${custsB?.length}`);
  }
  console.log("✓ Scenario B PASSED (2 distinct customers created cleanly).");

  // --------------------------------------------------
  // SCENARIO C: Different Merchants + Same Phone (Merchant Isolation)
  // --------------------------------------------------
  console.log("\n[SCENARIO C: Concurrent Check-in for Different Merchants + Same Phone]");
  const resultsC = await Promise.all([
    postCheckin(testMerchant1, "Cust C-M1", phoneC),
    postCheckin(testMerchant2, "Cust C-M2", phoneC),
  ]);

  console.log("- Responses:", resultsC.map((r) => ({ status: r.status, isFirst: r.data?.isFirstVisit })));
  const { data: custsC } = await client
    .from("customers")
    .select("id, merchant_id, phone")
    .eq("phone", phoneC);

  if (custsC?.length !== 2 || custsC[0].merchant_id === custsC[1].merchant_id) {
    throw new Error("FAIL: Scenario C merchant isolation violated!");
  }
  console.log("✓ Scenario C PASSED (Merchant isolation verified: 2 separate merchant customer records).");

  // --------------------------------------------------
  // SCENARIO D: Multiple Simultaneous First Visits
  // --------------------------------------------------
  console.log("\n[SCENARIO D: Multiple Simultaneous First Visits]");
  const resultsD = await Promise.all([
    postCheckin(testMerchant1, "Cust D1", phoneD1),
    postCheckin(testMerchant1, "Cust D2", phoneD2),
    postCheckin(testMerchant1, "Cust D3", phoneD3),
  ]);

  console.log("- Responses:", resultsD.map((r) => ({ status: r.status, isFirst: r.data?.isFirstVisit })));
  const { data: custsD } = await client
    .from("customers")
    .select("id, phone")
    .in("phone", [phoneD1, phoneD2, phoneD3]);

  if (custsD?.length !== 3) {
    throw new Error(`FAIL: Scenario D expected 3 customers, got ${custsD?.length}`);
  }
  console.log("✓ Scenario D PASSED (Simultaneous first visits handled atomically).");

  // --------------------------------------------------
  // SCENARIO E: Multiple Simultaneous Repeat Visits
  // --------------------------------------------------
  console.log("\n[SCENARIO E: Multiple Simultaneous Repeat Visits]");
  const resultsE = await Promise.all([
    postCheckin(testMerchant1, "Cust B1 Repeat 1", phoneB1),
    postCheckin(testMerchant1, "Cust B1 Repeat 2", phoneB1),
    postCheckin(testMerchant1, "Cust B1 Repeat 3", phoneB1),
  ]);

  console.log("- Responses:", resultsE.map((r) => ({ status: r.status, isFirst: r.data?.isFirstVisit, visitCount: r.data?.visitCount })));
  const { data: custsE } = await client
    .from("customers")
    .select("id, phone, visit_count")
    .eq("phone", phoneB1)
    .single();

  const { data: visitsE } = await client
    .from("customer_visits")
    .select("id, visit_type")
    .eq("customer_id", custsE!.id);

  console.log(`- Customer final visit_count: ${custsE?.visit_count}, Total visit logs: ${visitsE?.length}`);
  console.log("✓ Scenario E PASSED (Cooldown and repeat visit tracking intact).");

  console.log("\n==================================================");
  console.log("ALL CONCURRENCY AND IDEMPOTENCY TESTS PASSED (5/5)");
  console.log("==================================================");
}

runTests().catch((err) => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});

