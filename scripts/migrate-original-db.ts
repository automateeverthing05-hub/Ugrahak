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

const prodEnv = parseEnv(path.resolve(process.cwd(), ".env.local"));
const rawUrl = prodEnv.SUPABASE_TRANSACTION_POOLER_URL || prodEnv.DATABASE_URL;

const migrations = [
  "20260923000000_scratch_card_rewards.sql",
  "20260923020000_scale_indexes.sql",
  "20260923030000_scale_hardening.sql",
  "20260923040000_write_hardening.sql"
];

async function run() {
  console.log("==================================================");
  console.log("APPLYING COMPLETE MIGRATIONS TO ORIGINAL DATABASE");
  console.log("Target Ref: awpjlfglvpwlyodxvvqf");
  console.log("==================================================");

  const parsed = new URL(rawUrl);
  const password = decodeURIComponent(parsed.password);

  const client = new Client({
    host: "aws-0-ap-south-1.pooler.supabase.com",
    port: 6543,
    user: "postgres.awpjlfglvpwlyodxvvqf",
    password: password,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    console.log("Connected to Original database via PostgreSQL client.\n");

    for (const file of migrations) {
      const filePath = path.resolve(process.cwd(), "supabase/migrations", file);
      if (!fs.existsSync(filePath)) {
        console.warn(`Skipping missing migration: ${file}`);
        continue;
      }
      console.log(`Executing migration: ${file}...`);
      const sql = fs.readFileSync(filePath, "utf-8");
      await client.query(sql);
      console.log(`✓ Migration ${file} applied successfully.`);
    }

    console.log("\nAll migrations applied successfully to the ORIGINAL database!");
  } catch (err: any) {
    console.error("Migration Error:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
