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

const INSTANCE_1 = "http://localhost:3000";
const INSTANCE_2 = "http://localhost:3001";

async function postCheckin(targetUrl: string, slug: string, name: string, phone: string) {
  const start = Date.now();
  try {
    const res = await fetch(`${targetUrl}/api/shop/checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, name, phone }),
    });
    const latency = Date.now() - start;
    const data = await res.json().catch(() => ({}));
    return { status: res.status, latency, data, targetUrl };
  } catch (err: any) {
    return { status: 0, latency: Date.now() - start, error: err.message, targetUrl };
  }
}

async function runHorizontalScalingTests() {
  console.log("==================================================");
  console.log("UGRAHAK — STEP 7 HORIZONTAL SCALING & FAILOVER SUITE");
  console.log("==================================================");
  console.log(`Staging Project: ${stagingRef}`);
  console.log(`Production Project: ${prodRef}`);
  console.log(`Instance 1: ${INSTANCE_1}`);
  console.log(`Instance 2: ${INSTANCE_2}`);

  const runTag = Math.floor(Math.random() * 800000) + 100000;
  const raceMerchant = "test-merchant-000009";

  // ====================================================
  // Phase 1: Simultaneous Multi-Instance Cross-Node Race Condition Check
  // (Instance 1 & Instance 2 simultaneously processing the exact same customer)
  // ====================================================
  console.log(`\n[Phase 1: Multi-Instance Cross-Node Race Condition Check]`);
  const racePhone = `97${runTag}99`;
  const raceResponses = await Promise.all([
    postCheckin(INSTANCE_1, raceMerchant, "Cross Node Cust 1", racePhone),
    postCheckin(INSTANCE_2, raceMerchant, "Cross Node Cust 2", racePhone),
    postCheckin(INSTANCE_1, raceMerchant, "Cross Node Cust 3", racePhone),
    postCheckin(INSTANCE_2, raceMerchant, "Cross Node Cust 4", racePhone),
  ]);

  console.log(`- Race Responses across both nodes:`, raceResponses.map((r) => ({ inst: r.targetUrl, status: r.status, isFirst: r.data?.isFirstVisit })));

  const { data: raceCusts } = await client
    .from("customers")
    .select("id, name, phone")
    .eq("phone", racePhone);

  console.log(`- Customers created in Supabase for ${racePhone}: ${raceCusts?.length ?? 0}`);
  if ((raceCusts?.length ?? 0) !== 1) {
    throw new Error(`FAIL: Multi-instance race condition created ${raceCusts?.length} customers!`);
  }

  const { data: raceRewards } = await client
    .from("rewards")
    .select("id, customer_id")
    .eq("customer_id", raceCusts![0].id);

  console.log(`- First Visit Rewards allocated: ${raceRewards?.length ?? 0}`);
  if ((raceRewards?.length ?? 0) !== 1) {
    throw new Error(`FAIL: Multi-instance race condition created ${raceRewards?.length} rewards!`);
  }
  console.log("✓ Phase 1 PASSED: Multi-Instance Consistency Verified (1 Customer, 1 Reward).");

  // ====================================================
  // Phase 2: Round-Robin Multi-Instance Concurrent Load (250, 500, 1000 requests)
  // ====================================================
  console.log(`\n[Phase 2: Multi-Instance Concurrent Load Testing]`);
  for (const totalReqs of [250, 500, 1000]) {
    console.log(`\n- Testing ${totalReqs} Requests Distributed Across 2 Instances...`);
    const promises = Array.from({ length: totalReqs }, (_, i) => {
      const target = i % 2 === 0 ? INSTANCE_1 : INSTANCE_2;
      const merchantIdx = (i % 100) + 10;
      const slug = `test-merchant-${String(merchantIdx).padStart(6, "0")}`;
      const phone = `96${runTag}${String(i).padStart(4, "0")}`;
      return postCheckin(target, slug, `Multi-Inst Cust ${i}`, phone);
    });

    const start = Date.now();
    const responses = await Promise.all(promises);
    const duration = Date.now() - start;

    const byInstance: Record<string, Record<number, number>> = {
      [INSTANCE_1]: {},
      [INSTANCE_2]: {},
    };

    let total2xx = 0;
    let total429 = 0;
    let total5xx = 0;

    responses.forEach((r) => {
      const inst = r.targetUrl;
      byInstance[inst][r.status] = (byInstance[inst][r.status] || 0) + 1;
      if (r.status >= 200 && r.status < 300) total2xx++;
      else if (r.status === 429) total429++;
      else if (r.status >= 500) total5xx++;
    });

    console.log(`  Completed in: ${duration}ms (${((totalReqs / duration) * 1000).toFixed(1)} req/s aggregate)`);
    console.log(`  Instance 1 Distribution:`, byInstance[INSTANCE_1]);
    console.log(`  Instance 2 Distribution:`, byInstance[INSTANCE_2]);
    console.log(`  Totals: 2xx=${total2xx}, 429=${total429}, 5xx=${total5xx}`);
    if (total5xx > 0) {
      throw new Error(`FAIL: Detected ${total5xx} HTTP 5xx errors during multi-instance load!`);
    }
  }

  console.log("\n==================================================");
  console.log("HORIZONTAL SCALING VALIDATION: ALL TESTS PASSED");
  console.log("==================================================");
}

runHorizontalScalingTests().catch((err) => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});

