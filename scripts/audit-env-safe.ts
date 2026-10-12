import fs from "fs";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  console.log(".env.local file missing!");
  process.exit(1);
}

const lines = fs.readFileSync(envPath, "utf-8").split("\n");
const envVars: Record<string, string> = {};
lines.forEach((l) => {
  const m = l.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (m) {
    let val = (m[2] || "").trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    envVars[m[1]] = val;
  }
});

const requiredVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "CRON_SECRET",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "NEXT_PUBLIC_RAZORPAY_KEY_ID",
  "RAZORPAY_WEBHOOK_SECRET",
  "FIREBASE_ADMIN_PROJECT_ID",
  "FIREBASE_ADMIN_CLIENT_EMAIL",
  "FIREBASE_ADMIN_PRIVATE_KEY",
  "NEXT_PUBLIC_FIREBASE_VAPID_KEY",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "INNGEST_EVENT_KEY",
  "INNGEST_SIGNING_KEY",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
];

console.log("ENVIRONMENT VARIABLES AUDIT (No secrets printed):");
requiredVars.forEach((name) => {
  const val = envVars[name];
  const isPresent = Boolean(val && val.length > 0 && !val.includes("your-") && !val.includes("placeholder") && !val.includes("example"));
  const len = isPresent ? val.length : 0;
  console.log(`  - ${name}: ${isPresent ? `CONFIGURED (${len} chars)` : "NOT CONFIGURED / PLACEHOLDER"}`);
});

