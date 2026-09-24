import fs from "fs";
import { Pool } from "pg";

const env: Record<string, string> = {};
fs.readFileSync(".env.staging.local", "utf-8")
  .split("\n")
  .forEach((l) => {
    const i = l.indexOf("=");
    if (i > 0 && !l.startsWith("#")) {
      env[l.slice(0, i).trim()] = l.slice(i + 1).trim();
    }
  });

async function main() {
  if (!env.SUPABASE_TRANSACTION_POOLER_URL) {
    console.log("No pooler URL configured in .env.staging.local");
    return;
  }
  const pool = new Pool({
    connectionString: env.SUPABASE_TRANSACTION_POOLER_URL,
    connectionTimeoutMillis: 4000,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const res = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    console.log("POOLER STATUS: PASS");
    console.log("Public tables in PostgreSQL:", res.rows.map((r) => r.table_name));
  } catch (err: any) {
    console.log("POOLER STATUS: FAIL");
    console.log("Pooler connection error:", err.message);
  } finally {
    await pool.end();
  }
}

main();
