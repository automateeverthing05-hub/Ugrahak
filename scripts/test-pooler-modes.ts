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

async function testModes() {
  const configs = [
    { name: "Transaction Pooler (6543)", port: 6543, user: "postgres.awpjlfglvpwlyodxvvqf" },
    { name: "Session Pooler (5432)", port: 5432, user: "postgres.awpjlfglvpwlyodxvvqf" },
    { name: "Raw Password (6543)", port: 6543, user: "postgres.awpjlfglvpwlyodxvvqf", pass: parsed.password },
  ];

  for (const cfg of configs) {
    console.log(`Testing ${cfg.name}...`);
    const client = new Client({
      host: "aws-0-ap-south-1.pooler.supabase.com",
      port: cfg.port,
      user: cfg.user,
      password: cfg.pass || password,
      database: "postgres",
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });
    try {
      await client.connect();
      console.log(`✓ SUCCESS: ${cfg.name} connected!`);
      const res = await client.query("SELECT current_database();");
      console.log("Database:", res.rows[0]);
      await client.end();
      return;
    } catch (err: any) {
      console.log(`✗ ${cfg.name} failed: ${err.message}`);
    }
  }
}

testModes();

