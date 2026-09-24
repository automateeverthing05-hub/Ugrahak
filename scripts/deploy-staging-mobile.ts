import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import localtunnel from "localtunnel";

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

const stagingUrl = stagingEnv.NEXT_PUBLIC_SUPABASE_URL || "";
const prodUrl = prodEnv.NEXT_PUBLIC_SUPABASE_URL || "";

function extractRef(url: string): string {
  const match = url.match(/https:\/\/([a-z0-9-]+)\.supabase\.co/i);
  return match ? match[1] : "";
}

const stagingRef = extractRef(stagingUrl);
const prodRef = extractRef(prodUrl);

if (!stagingRef || !stagingEnv.SUPABASE_SECRET_KEY) {
  console.error("FATAL: Staging credentials incomplete!");
  process.exit(1);
}

if (stagingRef === prodRef) {
  console.error("CRITICAL SAFETY ABORT: Staging and Production project IDs match!");
  process.exit(1);
}

async function start() {
  console.log("==================================================");
  console.log("UGRAHAK — STARTING ISOLATED STAGING SERVER");
  console.log("==================================================");
  console.log(`Supabase Staging Target: ${stagingRef}`);
  console.log(`Mock FCM: ${stagingEnv.MOCK_FCM}`);

  const nextBin = path.resolve(process.cwd(), "node_modules/next/dist/bin/next");
  const server = spawn(process.execPath, [nextBin, "start", "-p", "3000"], {
    cwd: process.cwd(),
    stdio: "inherit",
    env: {
      ...process.env,
      ...stagingEnv,
      PORT: "3000",
      APP_ENV: "staging",
      STAGING_SUPABASE_URL: stagingUrl,
      STAGING_SUPABASE_SECRET_KEY: stagingEnv.SUPABASE_SECRET_KEY,
      STAGING_SUPABASE_ANON_KEY: stagingEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NODE_ENV: "production",
    },
  });

  // Wait 4 seconds for Next.js to bind
  await new Promise((resolve) => setTimeout(resolve, 4000));

  console.log("\n==================================================");
  console.log("OPENING SECURE PUBLIC MOBILE TUNNEL");
  console.log("==================================================");

  try {
    const tunnel = await localtunnel({ port: 3000 });
    const publicUrl = tunnel.url;

    // Fetch public IP for Localtunnel bypass prompt if needed
    let tunnelPassword = "";
    try {
      const ipRes = await fetch("https://loca.lt/mytunnelpassword");
      tunnelPassword = await ipRes.text();
    } catch {
      tunnelPassword = "Check https://loca.lt/mytunnelpassword";
    }

    console.log("\n==================================================");
    console.log(">>> PUBLIC TEST URL FOR MOBILE DEVICE <<<");
    console.log(`PUBLIC URL: ${publicUrl}`);
    console.log(`LOCALTUNNEL PASSWORD (IF PROMPTED): ${tunnelPassword.trim()}`);
    console.log("==================================================\n");

    // Perform Automated Health Check
    console.log("Performing public health check against deployed URL...");
    const testEndpoints = [
      "/",
      "/pricing",
      "/terms",
      "/privacy-policy",
      "/refund-policy",
      "/login",
      "/signup",
      "/robots.txt",
      "/sitemap.xml",
      "/shop/test-merchant-000001",
    ];

    for (const ep of testEndpoints) {
      try {
        const res = await fetch(`http://localhost:3000${ep}`);
        console.log(`[HEALTH CHECK] ${ep} -> Status ${res.status} ${res.statusText}`);
      } catch (err: unknown) {
        console.error(`[HEALTH CHECK FAILED] ${ep} -> ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    console.log("\n==================================================");
    console.log("PUBLIC MOBILE SERVER READY & RUNNING");
    console.log("==================================================");

    tunnel.on("close", () => {
      console.log("Tunnel closed.");
    });
  } catch (err) {
    console.error("Failed to establish public tunnel:", err);
  }
}

start();

