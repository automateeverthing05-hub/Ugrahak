import fs from "fs";
import path from "path";
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

const stagingClient = createClient(stagingEnv.NEXT_PUBLIC_SUPABASE_URL, stagingEnv.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const prodClient = createClient(prodEnv.NEXT_PUBLIC_SUPABASE_URL, prodEnv.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const tests = [
    { name: "TEST 1", vus: 100, duration: "5m", file: "k6-summary-100vu.json" },
    { name: "TEST 2", vus: 250, duration: "5m", file: "k6-summary-250vu.json" },
    { name: "TEST 3", vus: 500, duration: "5m", file: "k6-summary-500vu.json" },
    { name: "TEST 4", vus: 1000, duration: "10m", file: "k6-summary-1000vu.json" },
  ];

  console.log("| Test | VUs | Duration | Requests | RPS | Error % | P50 (ms) | P90 (ms) | P95 (ms) | P99 (ms) |");
  console.log("|------|-----|----------|----------|-----|---------|----------|----------|----------|----------|");

  for (const t of tests) {
    if (!fs.existsSync(t.file)) {
      console.log(`Missing ${t.file}`);
      continue;
    }
    const data = JSON.parse(fs.readFileSync(t.file, "utf-8"));
    const m = data.metrics;

    const totalReqs = m.http_reqs?.count ?? 0;
    const rps = m.http_reqs?.rate ?? 0;
    const rateLimited = m.rate_limited_requests?.count ?? 0;

    const dur = m.http_req_duration || {};
    const p50 = dur.med ?? 0;
    const p90 = dur["p(90)"] ?? 0;
    const p95 = dur["p(95)"] ?? 0;
    const p99 = dur["p(99)"] ?? 0;

    // Actual application failures vs intentional rate limit 429
    const failedTotal = m.http_req_failed?.passes ?? 0;
    // Genuine server 5xx or unhandled timeouts = failedTotal - rateLimited (min 0)
    const genuineErrors = Math.max(0, failedTotal - rateLimited);
    const errorPct = totalReqs > 0 ? (genuineErrors / totalReqs) * 100 : 0;

    console.log(
      `| ${t.name} | ${t.vus} | ${t.duration} | ${totalReqs.toLocaleString()} | ${rps.toFixed(1)} | ${errorPct.toFixed(2)}% | ${p50.toFixed(1)} | ${p90.toFixed(1)} | ${p95.toFixed(1)} | ${p99.toFixed(1)} |`
    );
  }

  // Database verification
  const [merchants, customers, visits, rewards, offers] = await Promise.all([
    stagingClient.from("merchants").select("*", { count: "exact", head: true }),
    stagingClient.from("customers").select("*", { count: "exact", head: true }),
    stagingClient.from("customer_visits").select("*", { count: "exact", head: true }),
    stagingClient.from("rewards").select("*", { count: "exact", head: true }),
    stagingClient.from("offers").select("*", { count: "exact", head: true }),
  ]);

  const [prodMerchants, prodCustomers] = await Promise.all([
    prodClient.from("merchants").select("*", { count: "exact", head: true }),
    prodClient.from("customers").select("*", { count: "exact", head: true }),
  ]);

  console.log("\nDATABASE COUNTS (STAGING):");
  console.log(`- Merchants: ${merchants.count}`);
  console.log(`- Customers: ${customers.count}`);
  console.log(`- Visits: ${visits.count}`);
  console.log(`- Rewards: ${rewards.count}`);
  console.log(`- Offers: ${offers.count}`);

  console.log("\nDATABASE COUNTS (PRODUCTION - UNTOUCHED):");
  console.log(`- Prod Merchants: ${prodMerchants.count}`);
  console.log(`- Prod Customers: ${prodCustomers.count}`);
}

main().catch(console.error);
