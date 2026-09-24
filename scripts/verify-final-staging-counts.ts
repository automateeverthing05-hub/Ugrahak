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

async function run() {
  console.log("Checking database counts post load-test...");

  const [merchants, customers, visits, rewards, offers, scratch, pushTokens] = await Promise.all([
    stagingClient.from("merchants").select("*", { count: "exact", head: true }),
    stagingClient.from("customers").select("*", { count: "exact", head: true }),
    stagingClient.from("customer_visits").select("*", { count: "exact", head: true }),
    stagingClient.from("rewards").select("*", { count: "exact", head: true }),
    stagingClient.from("offers").select("*", { count: "exact", head: true }),
    stagingClient.from("scratch_card_rewards").select("*", { count: "exact", head: true }),
    stagingClient.from("push_tokens").select("*", { count: "exact", head: true }),
  ]);

  const [pm, pc] = await Promise.all([
    prodClient.from("merchants").select("*", { count: "exact", head: true }),
    prodClient.from("customers").select("*", { count: "exact", head: true }),
  ]);

  console.log("\n==================================================");
  console.log("FINAL STAGING POST-LOAD TEST COUNTS");
  console.log("==================================================");
  console.log(`STAGING MERCHANTS: ${merchants.count}`);
  console.log(`STAGING CUSTOMERS: ${customers.count}`);
  console.log(`STAGING VISITS: ${visits.count}`);
  console.log(`STAGING REWARDS: ${rewards.count}`);
  console.log(`STAGING OFFERS: ${offers.count}`);
  console.log(`STAGING SCRATCH REWARDS: ${scratch.count}`);
  console.log(`STAGING PUSH TOKENS: ${pushTokens.count}`);
  console.log(`\nPRODUCTION MERCHANTS (UNTOUCHED): ${pm.count}`);
  console.log(`PRODUCTION CUSTOMERS (UNTOUCHED): ${pc.count}`);
  process.exit(0);
}

run().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});

