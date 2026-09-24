import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

function parseEnv(filePath: string) {
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

const stagingEnv = parseEnv(".env.staging.local");
const stagingClient = createClient(stagingEnv.NEXT_PUBLIC_SUPABASE_URL, stagingEnv.SUPABASE_SECRET_KEY);

const prodEnv = parseEnv(".env.local");
const prodClient = createClient(prodEnv.NEXT_PUBLIC_SUPABASE_URL, prodEnv.SUPABASE_SECRET_KEY);

async function check() {
  const tables = [
    "merchants",
    "customers",
    "customer_visits",
    "rewards",
    "offers",
    "push_tokens",
    "notification_logs",
    "nearby_offer_logs",
    "review_requests",
    "scratch_card_rewards",
  ];

  console.log("=== STAGING TABLE COUNTS ===");
  for (const t of tables) {
    const { count, error } = await stagingClient.from(t).select("*", { count: "exact", head: true });
    console.log(`${t}: ${error ? "ERROR: " + error.message : count}`);
  }

  console.log("\n=== PRODUCTION TABLE COUNTS (VERIFY UNTOUCHED) ===");
  for (const t of ["merchants", "customers", "customer_visits"]) {
    const { count, error } = await prodClient.from(t).select("*", { count: "exact", head: true });
    console.log(`${t}: ${error ? "ERROR: " + error.message : count}`);
  }
}

check();

