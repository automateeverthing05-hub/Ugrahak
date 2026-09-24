import fs from "fs";
import path from "path";
import { checkStagingIsolation, extractSupabaseProjectRef } from "@/lib/utils/environmentSafety";

function parseEnvFile(filePath: string): Record<string, string> {
  const env: Record<string, string> = {};
  if (!fs.existsSync(filePath)) return env;

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let value = trimmed.slice(eqIdx + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
  }

  return env;
}

async function verifyStaging() {
  const rootDir = process.cwd();
  const stagingPath = path.join(rootDir, ".env.staging.local");
  const prodPath = path.join(rootDir, ".env.local");

  const stagingEnv = parseEnvFile(stagingPath);
  const prodEnv = parseEnvFile(prodPath);

  const stagingUrl = stagingEnv.NEXT_PUBLIC_SUPABASE_URL || "";
  const prodUrl = prodEnv.NEXT_PUBLIC_SUPABASE_URL || "";

  const stagingRef = extractSupabaseProjectRef(stagingUrl);
  const prodRef = extractSupabaseProjectRef(prodUrl);

  // Critical Safety Guard: Abort if staging and production are identical
  if (stagingRef && prodRef && stagingRef === prodRef) {
    console.error("\n[CRITICAL SAFETY ABORT] Staging Supabase Project is IDENTICAL to Production!");
    console.error("Execution terminated to protect production data.\n");
    console.log("STAGING ENVIRONMENT: FAIL");
    console.log("PRODUCTION ISOLATION: FAIL");
    console.log("MOCK FCM: " + (stagingEnv.MOCK_FCM === "true" ? "PASS" : "FAIL"));
    console.log("POOLER: FAIL");
    process.exit(1);
  }

  const check = checkStagingIsolation(stagingEnv, prodEnv);

  let isReachable = false;
  if (check.isConfigured && stagingUrl) {
    try {
      const pingRes = await fetch(`${stagingUrl}/rest/v1/`, {
        headers: {
          apikey: stagingEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY || stagingEnv.SUPABASE_SECRET_KEY || "",
        },
      });
      isReachable = pingRes.status < 500;
    } catch {
      isReachable = false;
    }
  }

  const stagingStatus = check.isConfigured ? (isReachable ? "PASS" : "FAIL (Unreachable)") : "FAIL (Credentials not yet pasted)";
  const isolationStatus = check.isIsolated ? "PASS" : (stagingUrl ? "FAIL" : "PENDING STAGING URL");
  const mockFcmStatus = check.isMockFcm ? "PASS" : "FAIL";
  const poolerStatus = check.isPoolerConfigured ? "PASS" : "PENDING STAGING POOLER URL";

  console.log(`STAGING ENVIRONMENT: ${stagingStatus}`);
  console.log(`PRODUCTION ISOLATION: ${isolationStatus}`);
  console.log(`MOCK FCM: ${mockFcmStatus}`);
  console.log(`POOLER: ${poolerStatus}`);

  if (check.reasons.length > 0) {
    console.log("\nDetails / Blockers:");
    check.reasons.forEach((r: string) => console.log(`- ${r}`));
  }
}

verifyStaging().catch((err) => {
  console.error("Verification script error:", err.message);
  process.exit(1);
});
