import fs from "fs";
import path from "path";

// Load .env.local
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

import { createAdminClient } from "../src/lib/supabase/admin";

async function verifyMigrationStatus() {
  console.log("Checking remote Supabase database for migration 20261012010000_customer_retention_automations.sql...");
  const admin = createAdminClient();

  // Test 1: Column inspection on merchants
  const { data: mData, error: mError } = await admin
    .from("merchants")
    .select("id, is_review_request_enabled, is_reengagement_enabled, reengagement_cooldown_days")
    .limit(1);

  if (mError) {
    console.log("MERCHANTS TABLE CHECK: FAILED/PENDING");
    console.log("  Error code:", mError.code);
    console.log("  Error message:", mError.message);
  } else {
    console.log("MERCHANTS TABLE CHECK: SUCCESS (Columns exist)");
    console.log("  Sample row:", mData);
  }

  // Test 2: Table inspection for inactive_customer_campaigns
  const { data: cData, error: cError } = await admin
    .from("inactive_customer_campaigns")
    .select("id")
    .limit(1);

  if (cError) {
    console.log("INACTIVE_CUSTOMER_CAMPAIGNS TABLE CHECK: FAILED/PENDING");
    console.log("  Error code:", cError.code);
    console.log("  Error message:", cError.message);
  } else {
    console.log("INACTIVE_CUSTOMER_CAMPAIGNS TABLE CHECK: SUCCESS (Table exists)");
  }
}

verifyMigrationStatus().catch((err) => {
  console.error("Migration check error:", err);
  process.exit(1);
});

