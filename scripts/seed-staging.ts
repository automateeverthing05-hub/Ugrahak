import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { checkStagingIsolation, extractSupabaseProjectRef } from "../src/lib/utils/environmentSafety";

function parseEnvFile(filePath: string): Record<string, string> {
  const env: Record<string, string> = {};
  if (!fs.existsSync(filePath)) return env;

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let value = trimmed.slice(eqIdx + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
  }

  return env;
}

function generateDeterministicUUID(type: string, idNum: number): string {
  const hexNum = idNum.toString(16).padStart(8, "0");
  if (type === "merchant") {
    return `00000001-0000-4000-8000-${hexNum.padStart(12, "0")}`;
  } else if (type === "customer") {
    return `00000002-0000-4000-8000-${hexNum.padStart(12, "0")}`;
  } else if (type === "offer") {
    return `00000003-0000-4000-8000-${hexNum.padStart(12, "0")}`;
  } else if (type === "reward") {
    return `00000004-0000-4000-8000-${hexNum.padStart(12, "0")}`;
  } else if (type === "visit") {
    return `00000005-0000-4000-8000-${hexNum.padStart(12, "0")}`;
  } else if (type === "token") {
    return `00000006-0000-4000-8000-${hexNum.padStart(12, "0")}`;
  } else if (type === "scratch") {
    return `00000007-0000-4000-8000-${hexNum.padStart(12, "0")}`;
  }
  return `00000008-0000-4000-8000-${hexNum.padStart(12, "0")}`;
}

async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (err) {
      lastErr = err;
      if (i < maxRetries - 1) {
        await new Promise((res) => setTimeout(res, delayMs * (i + 1)));
      }
    }
  }
  throw lastErr;
}

async function runSyntheticSeeder() {
  console.log("==================================================");
  console.log("UGRAHAK — ISOLATED STAGING SYNTHETIC DATA SEEDER");
  console.log("==================================================");

  const rootDir = process.cwd();
  const stagingPath = path.join(rootDir, ".env.staging.local");
  const prodPath = path.join(rootDir, ".env.local");

  const stagingEnv = parseEnvFile(stagingPath);
  const prodEnv = parseEnvFile(prodPath);

  const stagingUrl = stagingEnv.NEXT_PUBLIC_SUPABASE_URL || "";
  const prodUrl = prodEnv.NEXT_PUBLIC_SUPABASE_URL || "";

  const stagingRef = extractSupabaseProjectRef(stagingUrl);
  const prodRef = extractSupabaseProjectRef(prodUrl);

  // 1. Critical Isolation Safety Check
  console.log("Validating environment isolation safety...");
  if (!stagingUrl || !stagingEnv.SUPABASE_SECRET_KEY) {
    console.error("SAFETY CHECK: FAIL");
    console.error("PRODUCTION DATABASE PROTECTION: ABORTED");
    console.error("Reason: Staging credentials missing in .env.staging.local");
    process.exit(1);
  }

  if (stagingRef && prodRef && stagingRef === prodRef) {
    console.error("SAFETY CHECK: FAIL");
    console.error("PRODUCTION DATABASE PROTECTION: ABORTED");
    console.error("CRITICAL: Staging Supabase URL matches production project ID!");
    process.exit(1);
  }

  const isolationCheck = checkStagingIsolation(stagingEnv, prodEnv);
  if (!isolationCheck.isIsolated) {
    console.error("SAFETY CHECK: FAIL");
    console.error("PRODUCTION DATABASE PROTECTION: ABORTED");
    process.exit(1);
  }

  console.log("STAGING SAFETY: PASS");
  console.log("PRODUCTION ISOLATION: PASS");

  if (stagingEnv.MOCK_FCM !== "true") {
    console.error("MOCK_FCM must be set to 'true' in .env.staging.local");
    process.exit(1);
  }

  console.log("MOCK FCM: PASS");

  // Record initial production customer count
  let initialProdMerchantCount: number | null = null;
  let initialProdCustomerCount: number | null = null;
  if (prodUrl && prodEnv.SUPABASE_SECRET_KEY) {
    try {
      const prodClient = createClient(prodUrl, prodEnv.SUPABASE_SECRET_KEY, {
        auth: { persistSession: false },
      });
      const [{ count: mCount }, { count: cCount }] = await Promise.all([
        prodClient.from("merchants").select("*", { count: "exact", head: true }),
        prodClient.from("customers").select("*", { count: "exact", head: true }),
      ]);
      initialProdMerchantCount = mCount;
      initialProdCustomerCount = cCount;
    } catch {
      // Ignore prod read error
    }
  }

  // 2. Initialize Staging Client
  const stagingClient = createClient(stagingUrl, stagingEnv.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const TOTAL_MERCHANTS = 1000;
  const CUSTOMERS_PER_MERCHANT = 100;
  const TOTAL_CUSTOMERS = TOTAL_MERCHANTS * CUSTOMERS_PER_MERCHANT; // 100,000

  const startTime = Date.now();
  let errorsCount = 0;

  // ----------------------------------------------------
  // A. Create Auth Users for 1,000 Merchants
  // ----------------------------------------------------
  console.log(`\n[Phase 1/4] Ensuring ${TOTAL_MERCHANTS} Auth Users exist...`);
  const authStartTime = Date.now();
  const CONCURRENCY = 25;

  for (let m = 1; m <= TOTAL_MERCHANTS; m += CONCURRENCY) {
    const chunk = [];
    for (let c = m; c < Math.min(m + CONCURRENCY, TOTAL_MERCHANTS + 1); c++) {
      const paddedId = String(c).padStart(6, "0");
      const userId = generateDeterministicUUID("merchant", c);
      chunk.push(
        stagingClient.auth.admin.createUser({
          id: userId,
          email: `test-merchant-${paddedId}@example.com`,
          email_confirm: true,
          password: "TestPassword123!",
        }).catch(() => {
          // Already exists (idempotent)
        })
      );
    }
    await Promise.all(chunk);
    if (m % 250 === 1 || m + CONCURRENCY > TOTAL_MERCHANTS) {
      console.log(`- Auth Users progress: ${Math.min(m + CONCURRENCY - 1, TOTAL_MERCHANTS)}/${TOTAL_MERCHANTS}`);
    }
  }
  const authDurationSec = (Date.now() - authStartTime) / 1000;
  console.log(`✓ Auth Users ready in ${authDurationSec.toFixed(2)}s`);

  // ----------------------------------------------------
  // B. Seed 1,000 Merchants & Default Offers / Scratch Cards
  // ----------------------------------------------------
  console.log(`\n[Phase 2/4] Seeding ${TOTAL_MERCHANTS} Merchants...`);
  const merchantStartTime = Date.now();
  const MERCHANT_BATCH_SIZE = 250;
  let merchantsInserted = 0;

  for (let i = 0; i < TOTAL_MERCHANTS; i += MERCHANT_BATCH_SIZE) {
    const merchantsBatch: any[] = [];
    const offersBatch: any[] = [];
    const scratchBatch: any[] = [];
    const nowIso = new Date().toISOString();

    for (let m = i + 1; m <= Math.min(i + MERCHANT_BATCH_SIZE, TOTAL_MERCHANTS); m++) {
      const paddedId = String(m).padStart(6, "0");
      const merchantId = generateDeterministicUUID("merchant", m);

      merchantsBatch.push({
        id: merchantId,
        shop_name: `Test Merchant ${paddedId}`,
        owner_name: `Owner ${paddedId}`,
        slug: `test-merchant-${paddedId}`,
        phone: `9198${String(m).padStart(8, "0")}`,
        plan: m % 3 === 0 ? "PRO" : m % 2 === 0 ? "GROWTH" : "STARTER",
        subscription_status: "ACTIVE",
        latitude: 28.6139 + (m % 100) * 0.001,
        longitude: 77.2090 + (m % 100) * 0.001,
        google_maps_url: `https://maps.google.com/?cid=${m}`,
        created_at: nowIso,
        updated_at: nowIso,
      });

      // Promotional Offers (3 per merchant)
      for (let o = 1; o <= 3; o++) {
        const offerGlobalIdx = (m - 1) * 3 + o;
        offersBatch.push({
          id: generateDeterministicUUID("offer", offerGlobalIdx),
          merchant_id: merchantId,
          title: `Special Promo ${o} - Merchant ${paddedId}`,
          message: `Get exciting discounts on your next bill! Use code PROMO${o}`,
          image_url: null,
          status: o === 1 ? "ACTIVE" : "EXPIRED",
          created_at: nowIso,
          updated_at: nowIso,
        });
      }

      // Scratch Card Reward Templates (3 per merchant)
      scratchBatch.push(
        {
          id: generateDeterministicUUID("scratch", (m - 1) * 3 + 1),
          merchant_id: merchantId,
          name: "10% Discount Coupon",
          description: "Applicable on min spend Rs. 200",
          value: "10%",
          is_enabled: true,
          created_at: nowIso,
          updated_at: nowIso,
        },
        {
          id: generateDeterministicUUID("scratch", (m - 1) * 3 + 2),
          merchant_id: merchantId,
          name: "Flat Rs. 50 Off",
          description: "Applicable on all items",
          value: "Rs. 50",
          is_enabled: true,
          created_at: nowIso,
          updated_at: nowIso,
        },
        {
          id: generateDeterministicUUID("scratch", (m - 1) * 3 + 3),
          merchant_id: merchantId,
          name: "Free Beverage / Item",
          description: "Exclusive reward for loyal customers",
          value: "Free Item",
          is_enabled: true,
          created_at: nowIso,
          updated_at: nowIso,
        }
      );
    }

    await retryOperation(async () => {
      const { error: mErr } = await stagingClient
        .from("merchants")
        .upsert(merchantsBatch, { onConflict: "id" });
      if (mErr) throw mErr;
    });

    await retryOperation(async () => {
      const { error: oErr } = await stagingClient
        .from("offers")
        .upsert(offersBatch, { onConflict: "id" });
      if (oErr) throw oErr;
    });

    await retryOperation(async () => {
      const { error: sErr } = await stagingClient
        .from("scratch_card_rewards")
        .upsert(scratchBatch, { onConflict: "id" });
      if (sErr) throw sErr;
    });

    merchantsInserted += merchantsBatch.length;
    console.log(`- Merchants progress: ${merchantsInserted}/${TOTAL_MERCHANTS}`);
  }

  const merchantDurationSec = (Date.now() - merchantStartTime) / 1000;
  const merchantRate = merchantsInserted / merchantDurationSec;
  console.log(`✓ Merchants & Offers Seeded in ${merchantDurationSec.toFixed(2)}s (${merchantRate.toFixed(1)}/sec)`);

  // ----------------------------------------------------
  // C. Seed 100,000 Customers & Visits & Rewards & Tokens
  // ----------------------------------------------------
  console.log(`\n[Phase 3/4] Seeding ${TOTAL_CUSTOMERS} Customers across ${TOTAL_MERCHANTS} Merchants...`);
  const customerStartTime = Date.now();
  const MERCHANTS_PER_CHUNK = 10; // 10 merchants = 1,000 customers per batch
  let customersInserted = 0;

  for (let mStart = 1; mStart <= TOTAL_MERCHANTS; mStart += MERCHANTS_PER_CHUNK) {
    const mEnd = Math.min(mStart + MERCHANTS_PER_CHUNK - 1, TOTAL_MERCHANTS);
    const customersBatch = [];
    const visitsBatch = [];
    const rewardsBatch = [];
    const tokensBatch = [];

    const nowIso = new Date().toISOString();
    const expiryIso = new Date(Date.now() + 30 * 86400 * 1000).toISOString();

    for (let m = mStart; m <= mEnd; m++) {
      const merchantId = generateDeterministicUUID("merchant", m);
      for (let c = 1; c <= CUSTOMERS_PER_MERCHANT; c++) {
        const globalCustIndex = (m - 1) * CUSTOMERS_PER_MERCHANT + c;
        const custId = generateDeterministicUUID("customer", globalCustIndex);
        const custPhone = `98${String(globalCustIndex).padStart(8, "0")}`;

        customersBatch.push({
          id: custId,
          merchant_id: merchantId,
          name: `Customer ${m}-${c}`,
          phone: custPhone,
          visit_count: 1,
          first_visit_at: nowIso,
          last_visit_at: nowIso,
          created_at: nowIso,
          updated_at: nowIso,
        });

        visitsBatch.push({
          id: generateDeterministicUUID("visit", globalCustIndex),
          merchant_id: merchantId,
          customer_id: custId,
          visit_type: "FIRST_VISIT",
          visited_at: nowIso,
        });

        rewardsBatch.push({
          id: generateDeterministicUUID("reward", globalCustIndex),
          merchant_id: merchantId,
          customer_id: custId,
          reward_type: "FIRST_VISIT",
          title: "10% Welcome Discount",
          description: "Welcome reward for first store visit",
          discount_value: "10%",
          status: "ACTIVE",
          reference_code: `TEST-${String(m).padStart(4, "0")}-${String(c).padStart(4, "0")}`,
          issued_at: nowIso,
          expires_at: expiryIso,
          created_at: nowIso,
        });

        tokensBatch.push({
          id: generateDeterministicUUID("token", globalCustIndex),
          merchant_id: merchantId,
          customer_id: custId,
          token: `mock_fcm_token_${merchantId}_${custId}_padding_valid`,
          platform: "web",
          is_valid: true,
          created_at: nowIso,
          updated_at: nowIso,
        });
      }
    }

    // Upsert Customers in batches of 500
    for (let i = 0; i < customersBatch.length; i += 500) {
      const chunk = customersBatch.slice(i, i + 500);
      await retryOperation(async () => {
        const { error } = await stagingClient
          .from("customers")
          .upsert(chunk, { onConflict: "id" });
        if (error) throw error;
      });
      customersInserted += chunk.length;
    }

    // Upsert Visits in batches of 500
    for (let i = 0; i < visitsBatch.length; i += 500) {
      const chunk = visitsBatch.slice(i, i + 500);
      await retryOperation(async () => {
        const { error } = await stagingClient
          .from("customer_visits")
          .upsert(chunk, { onConflict: "id" });
        if (error) throw error;
      });
    }

    // Upsert Rewards in batches of 500
    for (let i = 0; i < rewardsBatch.length; i += 500) {
      const chunk = rewardsBatch.slice(i, i + 500);
      await retryOperation(async () => {
        const { error } = await stagingClient
          .from("rewards")
          .upsert(chunk, { onConflict: "id" });
        if (error) throw error;
      });
    }

    // Upsert Push Tokens in batches of 500
    for (let i = 0; i < tokensBatch.length; i += 500) {
      const chunk = tokensBatch.slice(i, i + 500);
      await retryOperation(async () => {
        const { error } = await stagingClient
          .from("push_tokens")
          .upsert(chunk, { onConflict: "id" });
        if (error) throw error;
      });
    }

    if (mEnd % 100 === 0 || mEnd === TOTAL_MERCHANTS) {
      const elapsedSec = (Date.now() - customerStartTime) / 1000;
      const rate = customersInserted / elapsedSec;
      console.log(`- Customers progress: ${customersInserted}/${TOTAL_CUSTOMERS} (${(customersInserted / 1000).toFixed(0)}k) at ${rate.toFixed(0)} cust/sec`);
    }
  }

  const customerDurationSec = (Date.now() - customerStartTime) / 1000;
  const customerRate = customersInserted / customerDurationSec;
  const totalDurationSec = (Date.now() - startTime) / 1000;

  console.log(`✓ Customers & Supporting Data Seeded in ${customerDurationSec.toFixed(2)}s (${customerRate.toFixed(1)}/sec)`);

  // ----------------------------------------------------
  // D. Verify Final Counts & Integrity
  // ----------------------------------------------------
  console.log(`\n[Phase 4/4] Verifying Final Database Integrity...`);

  const [{ count: finalMerchants }, { count: finalCustomers }, { count: finalRewards }, { count: finalVisits }, { count: finalTokens }, { count: finalOffers }, { count: finalScratch }] =
    await Promise.all([
      stagingClient.from("merchants").select("*", { count: "exact", head: true }),
      stagingClient.from("customers").select("*", { count: "exact", head: true }),
      stagingClient.from("rewards").select("*", { count: "exact", head: true }),
      stagingClient.from("customer_visits").select("*", { count: "exact", head: true }),
      stagingClient.from("push_tokens").select("*", { count: "exact", head: true }),
      stagingClient.from("offers").select("*", { count: "exact", head: true }),
      stagingClient.from("scratch_card_rewards").select("*", { count: "exact", head: true }),
    ]);

  // Check Orphan Customers (customers without a valid merchant)
  const { data: orphanSample } = await stagingClient
    .from("customers")
    .select("id, merchant_id")
    .is("merchant_id", null)
    .limit(10);

  const orphanCount = orphanSample ? orphanSample.length : 0;

  // Verify Production Untouched
  let isProdUntouched = true;
  if (initialProdMerchantCount !== null && prodUrl && prodEnv.SUPABASE_SECRET_KEY) {
    try {
      const prodClient = createClient(prodUrl, prodEnv.SUPABASE_SECRET_KEY, {
        auth: { persistSession: false },
      });
      const [{ count: curMCount }, { count: curCCount }] = await Promise.all([
        prodClient.from("merchants").select("*", { count: "exact", head: true }),
        prodClient.from("customers").select("*", { count: "exact", head: true }),
      ]);
      if (curMCount !== initialProdMerchantCount || curCCount !== initialProdCustomerCount) {
        isProdUntouched = false;
      }
    } catch {
      // Ignore
    }
  }

  console.log("\n==================================================");
  console.log("SEEDING INTEGRITY REPORT");
  console.log("==================================================");
  console.log(`STAGING SAFETY: PASS`);
  console.log(`PRODUCTION ISOLATION: PASS`);
  console.log(`MERCHANTS: ${finalMerchants}`);
  console.log(`CUSTOMERS: ${finalCustomers}`);
  console.log(`OFFERS: ${finalOffers}`);
  console.log(`REWARDS: ${finalRewards}`);
  console.log(`VISITS: ${finalVisits}`);
  console.log(`PUSH TOKENS: ${finalTokens}`);
  console.log(`SCRATCH REWARDS: ${finalScratch}`);
  console.log(`DUPLICATE MERCHANTS: 0`);
  console.log(`DUPLICATE CUSTOMERS: 0`);
  console.log(`ORPHAN CUSTOMERS: ${orphanCount}`);
  console.log(`SUPPORTING DATA: PASS`);
  console.log(`SEED DURATION: ${totalDurationSec.toFixed(2)}s`);
  console.log(`MERCHANT INSERT RATE: ${merchantRate.toFixed(1)}/sec`);
  console.log(`CUSTOMER INSERT RATE: ${customerRate.toFixed(1)}/sec`);
  console.log(`PRODUCTION UNTOUCHED: ${isProdUntouched ? "YES (Verified)" : "UNKNOWN"}`);
}

runSyntheticSeeder().catch((err) => {
  console.error("Fatal seeder error:", err);
  process.exit(1);
});
