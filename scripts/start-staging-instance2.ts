import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

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

const stagingEnvPath = path.resolve(process.cwd(), ".env.staging.local");
const stagingEnv = parseEnv(stagingEnvPath);
const stagingUrl = stagingEnv.NEXT_PUBLIC_SUPABASE_URL || "";

console.log("==================================================");
console.log("UGRAHAK — STARTING ISOLATED STAGING INSTANCE 2 (PORT 3001)");
console.log("==================================================");

const nextBin = path.resolve(process.cwd(), "node_modules/next/dist/bin/next");
const child = spawn(process.execPath, [nextBin, "start", "-p", "3001"], {
  cwd: process.cwd(),
  stdio: "inherit",
  env: {
    ...process.env,
    ...stagingEnv,
    PORT: "3001",
    APP_ENV: "staging",
    STAGING_SUPABASE_URL: stagingUrl,
    STAGING_SUPABASE_SECRET_KEY: stagingEnv.SUPABASE_SECRET_KEY,
    STAGING_SUPABASE_ANON_KEY: stagingEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NODE_ENV: "production",
  },
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});

