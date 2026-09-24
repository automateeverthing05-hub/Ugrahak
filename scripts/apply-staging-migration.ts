import fs from "fs";
import path from "path";
import { Client } from "pg";

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

const stagingPoolerUrl = stagingEnv.SUPABASE_TRANSACTION_POOLER_URL || "";
const prodUrl = prodEnv.NEXT_PUBLIC_SUPABASE_URL || "";
const stagingUrl = stagingEnv.NEXT_PUBLIC_SUPABASE_URL || "";

function extractRef(url: string): string {
  const match = url.match(/https:\/\/([a-z0-9-]+)\.supabase\.co/i);
  return match ? match[1] : "";
}

const stagingRef = extractRef(stagingUrl);
const prodRef = extractRef(prodUrl);

if (stagingRef === prodRef) {
  console.error("CRITICAL SAFETY ABORT: Staging and Production project IDs match!");
  process.exit(1);
}

if (!stagingPoolerUrl) {
  console.error("FATAL: SUPABASE_TRANSACTION_POOLER_URL not found in .env.staging.local");
  process.exit(1);
}

async function main() {
  console.log("==================================================");
  console.log("APPLYING STEP 4 SCALE HARDENING MIGRATION (STAGING)");
  console.log("==================================================");
  console.log(`Staging Project Ref: ${stagingRef}`);

  const migrationFile = path.resolve(process.cwd(), "supabase/migrations/20260923030000_scale_hardening.sql");
  const sql = fs.readFileSync(migrationFile, "utf-8");

  const client = new Client({
    connectionString: stagingPoolerUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    console.log("Connected to staging database via Pooler.");

    console.log("Executing SQL migration...");
    await client.query(sql);
    console.log("✓ Migration executed successfully!");

    // Verification queries
    const resCount = await client.query("SELECT COUNT(*) FROM public.merchants WHERE customer_count > 0;");
    console.log(`- Merchants with backfilled customer_count > 0: ${resCount.rows[0].count}`);

    const sample = await client.query("SELECT id, shop_name, customer_count FROM public.merchants LIMIT 3;");
    console.log("- Sample merchant customer counts:", sample.rows);

    const indexes = await client.query(`
      SELECT indexname FROM pg_indexes 
      WHERE tablename = 'merchants' 
        AND indexname IN ('idx_merchants_coords', 'idx_merchants_slug_lower');
    `);
    console.log("- Verified created indexes:", indexes.rows.map(r => r.indexname));

    console.log("\nDATABASE MIGRATION: PASS\n");
  } catch (err: any) {
    console.error("Migration error:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();

