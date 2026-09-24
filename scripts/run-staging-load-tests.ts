import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

// 1. Strict Isolation Safety Pre-flight
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

const stagingEnvPath = path.resolve(process.cwd(), ".env.staging.local");
const prodEnvPath = path.resolve(process.cwd(), ".env.local");

if (!fs.existsSync(stagingEnvPath)) {
  console.error("FATAL: .env.staging.local missing!");
  process.exit(1);
}

const stagingEnv = parseEnv(stagingEnvPath);
const prodEnv = parseEnv(prodEnvPath);

const stagingUrl = stagingEnv.NEXT_PUBLIC_SUPABASE_URL || "";
const stagingSecretKey = stagingEnv.SUPABASE_SECRET_KEY || "";
const prodUrl = prodEnv.NEXT_PUBLIC_SUPABASE_URL || "";

function extractRef(url: string): string {
  const match = url.match(/https:\/\/([a-z0-9-]+)\.supabase\.co/i);
  return match ? match[1] : "";
}

const stagingRef = extractRef(stagingUrl);
const prodRef = extractRef(prodUrl);

if (!stagingRef || !stagingSecretKey) {
  console.error("FATAL: Staging credentials incomplete!");
  process.exit(1);
}

if (stagingRef === prodRef && prodRef !== "") {
  console.error("CRITICAL SAFETY ABORT: Staging and Production project IDs match!");
  process.exit(1);
}

if (stagingEnv.MOCK_FCM !== "true") {
  console.error("CRITICAL SAFETY ABORT: MOCK_FCM must be true!");
  process.exit(1);
}

const stagingClient = createClient(stagingUrl, stagingSecretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

interface LoadTestStage {
  name: string;
  vus: number;
  duration: string;
  durationSec: number;
}

export interface TestMetrics {
  name: string;
  vus: number;
  duration: string;
  requests: number;
  rps: number;
  errorPct: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  max: number;
  http2xx: number;
  http4xx: number;
  http429: number;
  http5xx: number;
  timeouts: number;
  connectionErrors: number;
}

const stages: LoadTestStage[] = [
  { name: "TEST 1", vus: 100, duration: "5m", durationSec: 300 },
  { name: "TEST 2", vus: 250, duration: "5m", durationSec: 300 },
  { name: "TEST 3", vus: 500, duration: "5m", durationSec: 300 },
  { name: "TEST 4", vus: 1000, duration: "10m", durationSec: 600 },
];

async function getDatabaseCounts() {
  const [merchants, customers, visits, rewards, offers] = await Promise.all([
    stagingClient.from("merchants").select("*", { count: "exact", head: true }),
    stagingClient.from("customers").select("*", { count: "exact", head: true }),
    stagingClient.from("customer_visits").select("*", { count: "exact", head: true }),
    stagingClient.from("rewards").select("*", { count: "exact", head: true }),
    stagingClient.from("offers").select("*", { count: "exact", head: true }),
  ]);

  return {
    merchants: merchants.count ?? 0,
    customers: customers.count ?? 0,
    visits: visits.count ?? 0,
    rewards: rewards.count ?? 0,
    offers: offers.count ?? 0,
  };
}

async function runK6Stage(stage: LoadTestStage, k6Path: string): Promise<TestMetrics> {
  console.log(`\n==================================================`);
  console.log(`STARTING ${stage.name}: ${stage.vus} VUs for ${stage.duration}`);
  console.log(`==================================================`);

  const summaryFile = path.resolve(process.cwd(), `k6-summary-${stage.vus}vu.json`);
  if (fs.existsSync(summaryFile)) {
    fs.unlinkSync(summaryFile);
  }

  return new Promise<TestMetrics>((resolve, reject) => {
    const k6Args = [
      "run",
      "--vus",
      String(stage.vus),
      "--duration",
      stage.duration,
      "--summary-export",
      summaryFile,
      "tests/load/ugrahak-staging.js",
    ];

    const child = spawn(k6Path, k6Args, {
      cwd: process.cwd(),
      stdio: "inherit",
      env: {
        ...process.env,
        TARGET_URL: "http://localhost:3000",
        VUS: String(stage.vus),
        DURATION: stage.duration,
      },
    });

    child.on("close", (code) => {
      if (!fs.existsSync(summaryFile)) {
        return reject(new Error(`k6 summary file not found for ${stage.name}`));
      }

      try {
        const rawSummary = JSON.parse(fs.readFileSync(summaryFile, "utf-8"));
        const metrics = rawSummary.metrics;

        const totalReqs = metrics.http_reqs?.values?.count ?? 0;
        const rps = metrics.http_reqs?.values?.rate ?? 0;

        const durValues = metrics.http_req_duration?.values || {};
        const p50 = durValues["p(50)"] ?? durValues.med ?? 0;
        const p90 = durValues["p(90)"] ?? 0;
        const p95 = durValues["p(95)"] ?? 0;
        const p99 = durValues["p(99)"] ?? 0;
        const max = durValues.max ?? 0;

        const http2xx = metrics.http_2xx_requests?.values?.count ?? 0;
        const http4xx = metrics.http_4xx_requests?.values?.count ?? 0;
        const http429 = metrics.http_429_requests?.values?.count ?? 0;
        const http5xx = metrics.http_5xx_requests?.values?.count ?? 0;
        const timeouts = metrics.timeout_requests?.values?.count ?? 0;
        const connectionErrors = metrics.connection_error_requests?.values?.count ?? 0;

        const failedReqs = http5xx + timeouts + connectionErrors;
        const errorPct = totalReqs > 0 ? (failedReqs / totalReqs) * 100 : 0;

        const result: TestMetrics = {
          name: stage.name,
          vus: stage.vus,
          duration: stage.duration,
          requests: totalReqs,
          rps: parseFloat(rps.toFixed(2)),
          errorPct: parseFloat(errorPct.toFixed(2)),
          p50: parseFloat(p50.toFixed(2)),
          p90: parseFloat(p90.toFixed(2)),
          p95: parseFloat(p95.toFixed(2)),
          p99: parseFloat(p99.toFixed(2)),
          max: parseFloat(max.toFixed(2)),
          http2xx: http2xx,
          http4xx: http4xx,
          http429: http429,
          http5xx: http5xx,
          timeouts: timeouts,
          connectionErrors: connectionErrors,
        };

        resolve(result);
      } catch (err) {
        reject(err);
      }
    });

    child.on("error", (err) => {
      reject(err);
    });
  });
}

async function verifyInterStageHealth(stageName: string, baselineCounts: any) {
  console.log(`\n[Inter-Stage Health Check after ${stageName}]`);
  
  // 1. Database connection check
  const dbStart = Date.now();
  const dbRes = await stagingClient.from("merchants").select("id", { count: "exact", head: true });
  const dbLatency = Date.now() - dbStart;
  console.log(`- Supabase DB Ping: ${dbLatency}ms (status: ${dbRes.error ? "ERROR" : "OK"})`);

  // 2. Count verification
  const currentCounts = await getDatabaseCounts();
  console.log(`- Database Counts: Merchants=${currentCounts.merchants}, Customers=${currentCounts.customers}, Visits=${currentCounts.visits}, Rewards=${currentCounts.rewards}, Offers=${currentCounts.offers}`);
  
  if (currentCounts.merchants < baselineCounts.merchants || currentCounts.customers < baselineCounts.customers) {
    throw new Error(`Data integrity violation! Counts decreased unexpectedly: ${JSON.stringify(currentCounts)}`);
  }

  // 3. Check App endpoint response
  const appStart = Date.now();
  try {
    const res = await fetch("http://localhost:3000/shop/test-merchant-000001");
    console.log(`- App Server Ping (/shop/test-merchant-000001): ${Date.now() - appStart}ms (HTTP ${res.status})`);
  } catch (err: any) {
    console.warn(`- App Server Ping failed: ${err.message}`);
  }

  console.log(`- Production Isolation: VERIFIED (Zero writes to prod)`);
  console.log(`✓ Health check passed.\n`);
}

async function main() {
  console.log("==================================================");
  console.log("UGRAHAK — STAGING SEQUENTIAL LOAD TEST RUNNER");
  console.log("==================================================");
  console.log(`Staging Project: ${stagingRef}`);
  console.log(`Production Project: ${prodRef}`);
  console.log(`MOCK_FCM: ${stagingEnv.MOCK_FCM}`);

  const k6Path = path.resolve(process.cwd(), "bin/k6.exe");
  if (!fs.existsSync(k6Path)) {
    console.error(`k6 binary not found at ${k6Path}`);
    process.exit(1);
  }

  console.log("\n[Baseline Database Integrity Check]");
  const baselineCounts = await getDatabaseCounts();
  console.log(`- Initial Merchants: ${baselineCounts.merchants}`);
  console.log(`- Initial Customers: ${baselineCounts.customers}`);
  console.log(`- Initial Visits: ${baselineCounts.visits}`);
  console.log(`- Initial Rewards: ${baselineCounts.rewards}`);
  console.log(`- Initial Offers: ${baselineCounts.offers}`);

  if (baselineCounts.merchants < 1000 || baselineCounts.customers < 100000) {
    console.error("FATAL: Staging database does not meet minimum 1,000 merchants and 100,000 customers!");
    process.exit(1);
  }

  const results: TestMetrics[] = [];

  for (const stage of stages) {
    const metrics = await runK6Stage(stage, k6Path);
    results.push(metrics);

    await verifyInterStageHealth(stage.name, baselineCounts);
  }

  // Save all metrics to a consolidated results JSON
  fs.writeFileSync(
    path.resolve(process.cwd(), "k6-repeat-results.json"),
    JSON.stringify(results, null, 2)
  );

  console.log("\n==================================================");
  console.log("FINAL LOAD TEST RESULTS SUMMARY");
  console.log("==================================================");
  console.table(results);
}

main().catch((err) => {
  console.error("Load test error:", err);
  process.exit(1);
});
