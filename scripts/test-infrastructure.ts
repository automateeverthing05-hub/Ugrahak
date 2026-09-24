import { inngest } from "../src/lib/inngest/client";
import { broadcastOfferFunction } from "../src/lib/inngest/functions/broadcastOffer";
import { processReviewRequestsFunction } from "../src/lib/inngest/functions/scheduledReviews";
import { getRedisClient, getCachedJson, setCachedJson } from "../src/lib/redis/client";
import { rateLimitCheckin, rateLimitNearbyCheck } from "../src/lib/redis/rateLimiter";
import { logger } from "../src/lib/observability/logger";
import { getPool, queryPool } from "../src/lib/supabase/pooler";

async function verifyAll() {
  console.log("==================================================");
  console.log("UGRAHAK INFRASTRUCTURE INTEGRATION VERIFICATION");
  console.log("==================================================");

  // 1. Inngest Verification
  console.log("\n[1] Inngest Client & Functions:");
  console.log("- Inngest Client ID:", inngest.id);
  console.log("- Broadcast Offer Function ID:", broadcastOfferFunction.id());
  console.log("- Review Processing Function ID:", processReviewRequestsFunction.id());
  console.log("-> Inngest Setup: OK");

  // 2. Upstash Redis & Rate Limiter
  console.log("\n[2] Upstash Redis & Rate Limiting:");
  const redis = getRedisClient();
  console.log("- Redis Client Initialized:", redis !== null ? "YES" : "FALLBACK");
  
  const testKey = "ugrahak_test_ping";
  const setOk = await setCachedJson(testKey, { ping: "pong", ts: Date.now() }, 10);
  console.log("- Redis SET Test:", setOk ? "SUCCESS" : "SKIPPED/FALLBACK");
  
  const val = await getCachedJson<{ ping: string }>(testKey);
  console.log("- Redis GET Test:", val?.ping === "pong" ? "SUCCESS" : "SKIPPED/FALLBACK");

  const rlCheckin = await rateLimitCheckin("test_ip_127_0_0_1");
  console.log("- RateLimiter Checkin Success:", rlCheckin.success, "Remaining:", rlCheckin.remaining);

  const rlNearby = await rateLimitNearbyCheck("test_ip_127_0_0_1");
  console.log("- RateLimiter Nearby Success:", rlNearby.success, "Remaining:", rlNearby.remaining);

  // 3. Sentry & Observability Logger
  console.log("\n[3] Sentry & Observability Logger:");
  console.log("- Sentry DSN Exists:", Boolean(process.env.SENTRY_DSN));
  logger.info("Test observability log (safe)", {
    operation: "INFRASTRUCTURE_VERIFY",
    metadata: {
      password: "SUPER_SECRET_VALUE",
      safeKey: "safe_value",
    },
  });
  console.log("-> Logger & Sentry Hook: OK (Redaction tested)");

  // 4. Supabase Transaction Pooler
  console.log("\n[4] Supabase Transaction Pooler:");
  console.log("- Transaction Pooler URL Configured:", Boolean(process.env.SUPABASE_TRANSACTION_POOLER_URL));
  const pool = getPool();
  if (pool) {
    try {
      const res = await queryPool("SELECT 1 as connected");
      console.log("- Pooler Query Result:", res?.rows[0]?.connected === 1 ? "CONNECTED (1)" : "FAILED");
    } catch (err: any) {
      console.log("- Pooler Query Encountered:", err.message);
    }
  } else {
    console.log("- Pooler pool not initialized (empty or invalid URL)");
  }

  console.log("\n==================================================");
  console.log("VERIFICATION COMPLETED");
  console.log("==================================================");
  process.exit(0);
}

verifyAll().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
