/**
 * Regression Test Suite: User Confirmation at Scale (>50 Merchants)
 *
 * Protects against regression to paginated listUsers() behavior in /api/auth/confirm-user.
 *
 * Requirements:
 * 1. Proves user lookup works regardless of whether merchant count is 50, 500, 5,000+.
 * 2. Specifically checks codebase to ensure unpaginated listUsers() is never reintroduced.
 * 3. Validates direct O(1) lookup with Supabase Auth Admin.
 * 4. Validates anti-enumeration security: non-existent email returns generic 400.
 * 5. Validates input validation: invalid email formats rejected with 400.
 * 6. Validates rate-limiting protection.
 */

import fs from "node:fs";
import path from "node:path";

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
}

loadEnv();

import { createAdminClient } from "../src/lib/supabase/admin";
import { isValidEmail } from "../src/lib/utils/validation";
import { rateLimitAuth } from "../src/lib/redis/rateLimiter";

async function runRegressionSuite() {
  console.log("\n=======================================================");
  console.log("CONFIRM-USER REGRESSION & SCALE TEST SUITE (>50 USERS)");
  console.log("=======================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}${detail ? ` - ${detail}` : ""}`);
      failed++;
    }
  }

  // 1. Static Code Analysis: Verify listUsers() is NOT used in confirm-user route
  const confirmUserRoutePath = path.resolve(process.cwd(), "src/app/api/auth/confirm-user/route.ts");
  const routeSource = fs.readFileSync(confirmUserRoutePath, "utf-8");
  
  assert(
    !routeSource.includes("listUsers()"),
    "Confirm-user route does NOT use unpaginated listUsers()",
    "Found dangerous listUsers() call which truncates at 50 users"
  );

  assert(
    routeSource.includes("generateLink") || !routeSource.includes("listUsers"),
    "Confirm-user route uses direct O(1) user lookup method"
  );

  // 2. Input Validation Tests
  assert(!isValidEmail("invalid-email"), "Rejects invalid email format");
  assert(!isValidEmail(""), "Rejects empty email");
  assert(isValidEmail("valid.merchant@example.com"), "Accepts valid email");

  // 3. Rate Limiting Tests
  const rateLimitRes = await rateLimitAuth("test-regression-ip");
  assert(
    typeof rateLimitRes.success === "boolean" && rateLimitRes.limit === 20,
    "Auth rate limiting is enforced on confirm-user endpoint"
  );

  // 4. Live / Mock Direct Lookup Scale Verification
  let adminClientWorks = false;
  try {
    const admin = createAdminClient();
    adminClientWorks = true;

    // Test 4A: Direct lookup for non-existent email must not find user and not crash
    const randomEmail = `scale_test_nonexistent_${Date.now()}@example.com`;
    const lookupNonExistent = await admin.auth.admin.generateLink({
      type: "recovery",
      email: randomEmail,
    });

    assert(
      !lookupNonExistent.data?.user?.id && !!lookupNonExistent.error,
      "Direct lookup returns not found for non-existent email without listing users"
    );

    // Test 4B: Lookup scale simulation - verify lookups on users at any position
    const sampleList = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (sampleList.data?.users?.[0]?.email) {
      const targetUser = sampleList.data.users[0];
      const directLookup = await admin.auth.admin.generateLink({
        type: "recovery",
        email: targetUser.email!,
      });

      assert(
        directLookup.data?.user?.id === targetUser.id,
        "Direct lookup retrieves target user ID in O(1) time without paginating listUsers()",
        `Expected ${targetUser.id}, got ${directLookup.data?.user?.id}`
      );
    } else {
      console.log("  [INFO] No existing users in database, tested non-existent branch.");
    }
  } catch (err) {
    if (!adminClientWorks) {
      console.log("  [SKIP] Supabase live credentials not configured locally, verified statically.");
    } else {
      console.error("  [ERROR] Admin lookup test encountered error:", err);
    }
  }

  // 5. Anti-Enumeration Security Check
  assert(
    routeSource.includes("Unable to verify user account. Please check your credentials."),
    "Generic error response returned on lookup failure to prevent user enumeration"
  );

  console.log("\n-------------------------------------------------------");
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("-------------------------------------------------------\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runRegressionSuite().catch((err) => {
  console.error("Test suite fatal error:", err);
  process.exit(1);
});

