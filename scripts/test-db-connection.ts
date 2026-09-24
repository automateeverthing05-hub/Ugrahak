import fs from "node:fs";
import { Pool } from "pg";

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
console.log("Pooler URL exists:", !!stagingEnv.SUPABASE_TRANSACTION_POOLER_URL);
console.log("Direct DB URL exists:", !!stagingEnv.DATABASE_URL);

async function testConn() {
  const url = stagingEnv.DATABASE_URL || stagingEnv.SUPABASE_TRANSACTION_POOLER_URL;
  if (!url) {
    console.log("No PostgreSQL URL found");
    return;
  }
  const pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  try {
    const res = await pool.query("SELECT NOW() as current_time");
    console.log("Postgres Query Success:", res.rows[0]);
  } catch (err: any) {
    console.log("Postgres Connection Error:", err.message);
  } finally {
    await pool.end();
  }
}

testConn();

