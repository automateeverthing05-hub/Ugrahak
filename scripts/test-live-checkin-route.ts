import { POST } from "../src/app/api/shop/checkin/route";
import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

// Load .env.local
const envContent = fs.readFileSync(path.resolve(process.cwd(), ".env.local"), "utf-8");
envContent.split("\n").forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = (match[2] || "").trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[match[1]] = val;
  }
});

async function runCheckinTests() {
  console.log("\n=======================================================");
  console.log("TESTING LIVE /api/shop/checkin ROUTE END-TO-END");
  console.log("=======================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}${detail ? ` - ${detail}` : ""}`);
      failed++;
    }
  }

  // Test 1: Check-in with valid slug and new customer name
  console.log("--- 1. Testing Check-in for 'sunil' with 'Aarav Sharma' ---");
  const req1 = new NextRequest("http://localhost:3000/api/shop/checkin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug: "sunil", name: "Aarav Sharma" }),
  });

  const res1 = await POST(req1);
  const data1 = await res1.json();
  console.log("Response 1:", { status: res1.status, data: data1 });

  assert(res1.status === 200, "Scan 1 returns HTTP 200 OK");
  assert(data1.success === true, "Scan 1 has success: true");
  assert(typeof data1.customer?.id === "string" && data1.customer.id.length === 36, "Scan 1 returned valid customer UUID");
  assert(data1.customer.name === "Aarav Sharma", "Scan 1 customer name is stored accurately");
  assert(typeof data1.reward?.reference_code === "string" && data1.reward.reference_code.startsWith("AG-"), "Scan 1 reward reference code generated");
  assert(data1.reward.status === "ACTIVE", "Scan 1 reward is ACTIVE");

  // Test 2: Check-in with SAME customer name again ('Aarav Sharma')
  console.log("\n--- 2. Testing Second Check-in with SAME Name 'Aarav Sharma' ---");
  const req2 = new NextRequest("http://localhost:3000/api/shop/checkin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug: "sunil", name: "Aarav Sharma" }),
  });

  const res2 = await POST(req2);
  const data2 = await res2.json();
  console.log("Response 2:", { status: res2.status, data: data2 });

  assert(res2.status === 200, "Scan 2 (Same Name) returns HTTP 200 OK");
  assert(data2.success === true, "Scan 2 (Same Name) has success: true");
  assert(data2.customer?.id !== data1.customer?.id, "Scan 1 and Scan 2 have DISTINCT server-generated UUIDs");
  assert(data2.reward?.reference_code !== data1.reward?.reference_code, "Scan 1 and Scan 2 have DISTINCT reward reference codes");

  // Test 3: Check-in with Invalid Slug
  console.log("\n--- 3. Testing Check-in with Non-Existent Slug ---");
  const req3 = new NextRequest("http://localhost:3000/api/shop/checkin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug: "non-existent-shop-slug-9999", name: "Test User" }),
  });

  const res3 = await POST(req3);
  const data3 = await res3.json();
  console.log("Response 3:", { status: res3.status, data: data3 });
  assert(res3.status === 404, "Invalid slug returns HTTP 404");
  assert(data3.error?.includes("Shop not found"), "Invalid slug returns clear error message");

  // Test 4: Check-in with Empty Name
  console.log("\n--- 4. Testing Check-in with Empty Name ---");
  const req4 = new NextRequest("http://localhost:3000/api/shop/checkin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug: "sunil", name: "   " }),
  });

  const res4 = await POST(req4);
  const data4 = await res4.json();
  console.log("Response 4:", { status: res4.status, data: data4 });
  assert(res4.status === 400, "Empty name returns HTTP 400");
  assert(data4.error?.includes("Please enter your name"), "Empty name returns validation error");

  // -------------------------------------------------------------
  // Test Summary
  // -------------------------------------------------------------
  console.log("\n=======================================================");
  console.log(`TOTAL TESTS: ${passed + failed}`);
  console.log(`PASSED:      ${passed}`);
  console.log(`FAILED:      ${failed}`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runCheckinTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

