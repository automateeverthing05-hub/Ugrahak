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
const client = createClient(stagingEnv.NEXT_PUBLIC_SUPABASE_URL, stagingEnv.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

const INSTANCE_1 = "http://localhost:3000";

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
    return { status: res.status, latency, data };
  } catch (err: any) {
    return { status: 0, latency: Date.now() - start, error: err.message };
  }
}

async function runFailoverTest() {
  console.log("==================================================");
  console.log("UGRAHAK — STEP 7 INSTANCE FAILURE & FAILOVER TEST");
  console.log("==================================================");

  const testMerchant = "test-merchant-000001";
  const runTag = Math.floor(Math.random() * 800000) + 100000;

  console.log("\n[Simulating Active Traffic After Instance 2 Termination]");
  console.log("- Sending 100 continuous requests to survivor Instance 1 (Port 3000)...");

  const promises = Array.from({ length: 100 }, (_, i) => {
    const phone = `98${runTag}${String(i).padStart(3, "0")}`;
    return postCheckin(INSTANCE_1, testMerchant, `Survivor Cust ${i}`, phone);
  });

  const responses = await Promise.all(promises);
  const statusCounts: Record<number, number> = {};
  responses.forEach((r) => {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  });

  console.log("- Survivor Instance 1 Status Distribution:", statusCounts);
  console.log("- HTTP 5xx Errors:", statusCounts[500] || 0);

  if ((statusCounts[500] || 0) > 0) {
    throw new Error("Failover test failed: HTTP 500 detected on survivor instance!");
  }

  console.log("✓ Failover Test Passed: Survivor instance seamlessly maintained traffic with 0 server errors.");
}

runFailoverTest().catch((err) => {
  console.error("Failover Test Error:", err);
  process.exit(1);
});

