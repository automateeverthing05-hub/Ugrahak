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

const prodEnv = parseEnv(path.resolve(process.cwd(), ".env.local"));
const prodUrl = prodEnv.NEXT_PUBLIC_SUPABASE_URL || "";

function extractRef(url: string): string {
  const match = url.match(/https:\/\/([a-z0-9-]+)\.supabase\.co/i);
  return match ? match[1] : "";
}

const prodRef = extractRef(prodUrl);

if (!prodRef || !prodEnv.SUPABASE_SECRET_KEY) {
  console.error("FATAL: Original production credentials incomplete!");
  process.exit(1);
}

// Global error handlers to ensure process resilience
process.on("uncaughtException", (err) => {
  console.warn("[TUNNEL WARNING]", err.message);
});

process.on("unhandledRejection", (err) => {
  console.warn("[TUNNEL WARNING]", err);
});

let currentTunnel: localtunnel.Tunnel | null = null;

async function setupTunnel(retryCount = 0) {
  try {
    if (currentTunnel) {
      try {
        currentTunnel.close();
      } catch {}
      currentTunnel = null;
    }

    const tunnel = await localtunnel({ port: 3000 });
    currentTunnel = tunnel;

    let tunnelPassword = "";
    try {
      const ipRes = await fetch("https://loca.lt/mytunnelpassword");
      tunnelPassword = await ipRes.text();
    } catch {
      tunnelPassword = "Check https://loca.lt/mytunnelpassword";
    }

    console.log("\n==================================================");
    console.log(">>> LIVE PUBLIC TEST URL (ORIGINAL SUPABASE) <<<");
    console.log(`PUBLIC URL: ${tunnel.url}`);
    console.log(`LOCALTUNNEL PASSWORD (IF PROMPTED): ${tunnelPassword.trim()}`);
    console.log("==================================================\n");

    tunnel.on("error", (err) => {
      console.warn("Tunnel socket notice:", err.message);
      setTimeout(() => setupTunnel(retryCount + 1), 3000);
    });

    tunnel.on("close", () => {
      console.log("Tunnel disconnected. Reconnecting in 3s...");
      setTimeout(() => setupTunnel(retryCount + 1), 3000);
    });
  } catch (err: any) {
    console.warn("Failed to open tunnel, retrying in 5s...", err.message);
    setTimeout(() => setupTunnel(retryCount + 1), 5000);
  }
}

async function start() {
  console.log("==================================================");
  console.log("UGRAHAK — STARTING ON ORIGINAL DATABASE");
  console.log(`Active Supabase Project: ${prodRef}`);
  console.log("==================================================");

  const nextBin = path.resolve(process.cwd(), "node_modules/next/dist/bin/next");
  const server = spawn(process.execPath, [nextBin, "start", "-p", "3000"], {
    cwd: process.cwd(),
    stdio: "inherit",
    env: {
      ...process.env,
      ...prodEnv,
      PORT: "3000",
      NODE_ENV: "production",
    },
  });

  server.on("exit", (code) => {
    console.log(`Next.js server exited with code ${code}`);
    process.exit(code ?? 0);
  });

  // Wait 4 seconds for Next.js to bind
  await new Promise((resolve) => setTimeout(resolve, 4000));

  await setupTunnel();

  // Run initial health check
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
  console.log("UGRAHAK SERVER & RESILIENT TUNNEL RUNNING");
  console.log("==================================================");
}

start();
