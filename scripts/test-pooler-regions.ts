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
const parsed = new URL(rawUrl);
const password = decodeURIComponent(parsed.password);

const regions = [
  "aws-0-ap-south-1.pooler.supabase.com",
  "aws-0-ap-southeast-1.pooler.supabase.com",
  "aws-0-us-east-1.pooler.supabase.com",
  "aws-0-eu-central-1.pooler.supabase.com"
];

async function testRegions() {
  for (const host of regions) {
    console.log(`Testing host: ${host}...`);
    const client = new Client({
      host,
      port: 6543,
      user: `postgres.awpjlfglvpwlyodxvvqf`,
      password,
      database: "postgres",
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 4000,
    });
    try {
      await client.connect();
      console.log(`✓ SUCCESS connecting to ${host}!`);
      const res = await client.query("SELECT current_database(), version();");
      console.log("DB Query Result:", res.rows[0]);
      await client.end();
      return host;
    } catch (err: any) {
      console.log(`✗ Failed on ${host}: ${err.message}`);
    }
  }
}

testRegions();

