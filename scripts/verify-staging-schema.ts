import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { checkStagingIsolation } from "@/lib/utils/environmentSafety";

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

const REQUIRED_TABLES = [
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

async function verifyStagingSchema() {
  const rootDir = process.cwd();
  const stagingPath = path.join(rootDir, ".env.staging.local");
  const prodPath = path.join(rootDir, ".env.local");

  const stagingEnv = parseEnvFile(stagingPath);
  const prodEnv = parseEnvFile(prodPath);

  const isolation = checkStagingIsolation(stagingEnv, prodEnv);
  if (!isolation.isIsolated) {
    console.error("SAFETY CHECK FAILED: Staging is not isolated from production.");
    process.exit(1);
  }

  const stagingUrl = stagingEnv.NEXT_PUBLIC_SUPABASE_URL;
  const stagingKey = stagingEnv.SUPABASE_SECRET_KEY || stagingEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!stagingUrl || !stagingKey) {
    console.error("Staging credentials missing.");
    process.exit(1);
  }

  const supabase = createClient(stagingUrl, stagingKey, {
    auth: { persistSession: false },
  });

  const missingTables: string[] = [];
  const presentTables: string[] = [];

  for (const table of REQUIRED_TABLES) {
    const { error } = await supabase.from(table).select("id").limit(1);
    if (error && (error.code === "PGRST205" || error.code === "42P01" || error.message?.includes("schema cache") || error.message?.includes("does not exist"))) {
      missingTables.push(table);
    } else {
      presentTables.push(table);
    }
  }

  console.log("==================================================");
  console.log("STAGING DATABASE SCHEMA VERIFICATION");
  console.log("==================================================");
  console.log(`Present Tables (${presentTables.length}/${REQUIRED_TABLES.length}): ${presentTables.join(", ") || "None"}`);
  
  if (missingTables.length > 0) {
    console.log(`Missing Tables (${missingTables.length}): ${missingTables.join(", ")}`);
    console.log("STAGING SCHEMA: FAIL");
  } else {
    console.log("STAGING SCHEMA: PASS");
  }
}

verifyStagingSchema().catch((err) => {
  console.error("Schema verification error:", err.message);
  process.exit(1);
});
