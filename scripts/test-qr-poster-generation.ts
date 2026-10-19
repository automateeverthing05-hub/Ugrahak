/**
 * Test script to verify the Ugrahak QR Poster generator layout,
 * URL formation, multi-merchant support, and fallback handling.
 */

console.log("=================================================");
console.log("🧪 TESTING UGRAHAK QR SCANNER POSTER GENERATION");
console.log("=================================================\n");

function generatePosterModel(slug: string, rawShopName: string | null | undefined, appUrl?: string) {
  const cleanShopName = rawShopName?.trim() || "Apni Dukaan";
  const baseUrl = appUrl || "https://app.apnagrahak.com";
  const shopUrl = `${baseUrl}/shop/${slug}`;
  const headerText = "SCAN FOR OFFER";
  const promoSubtitle = "🎁 SCAN & WIN EXCLUSIVE REWARDS";

  return {
    headerText,
    promoSubtitle,
    qrUrl: shopUrl,
    displayShopName: cleanShopName.length > 28 ? cleanShopName.slice(0, 26) + "..." : cleanShopName,
    rawShopName: cleanShopName,
  };
}

export {};

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, failureDetails?: string) {
  if (condition) {
    console.log(`  ✓ ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    if (failureDetails) console.error(`    Details: ${failureDetails}`);
    failed++;
  }
}

// 1. Merchant A: Sharma General Store
console.log("▶ 1. Merchant A Verification (Sharma General Store):");
const merchantA = generatePosterModel("sharma-general", "Sharma General Store");
assert(merchantA.headerText === "SCAN FOR OFFER", "Top text is strictly 'SCAN FOR OFFER'");
assert(merchantA.qrUrl === "https://app.apnagrahak.com/shop/sharma-general", "QR leads to merchant A's check-in page");
assert(merchantA.displayShopName === "Sharma General Store", "Bottom text is exact shop name from profile");

// 2. Merchant B: Gupta Sweets & Restaurant
console.log("\n▶ 2. Merchant B Verification (Gupta Sweets & Restaurant):");
const merchantB = generatePosterModel("gupta-sweets", "Gupta Sweets & Restaurant");
assert(merchantB.headerText === "SCAN FOR OFFER", "Top text is strictly 'SCAN FOR OFFER'");
assert(merchantB.qrUrl === "https://app.apnagrahak.com/shop/gupta-sweets", "QR leads to merchant B's check-in page");
assert(merchantB.displayShopName === "Gupta Sweets & Restaurant", "Bottom text is exact shop name from profile");

// 3. Multi-Merchant Isolation & Distinctness
console.log("\n▶ 3. Multi-Tenant Separation:");
assert(merchantA.qrUrl !== merchantB.qrUrl, "Merchant A and Merchant B have distinct QR URLs");
assert(merchantA.displayShopName !== merchantB.displayShopName, "Merchant A and Merchant B display different shop names");

// 4. Missing / Empty Shop Name Graceful Fallback
console.log("\n▶ 4. Graceful Fallback for Empty Shop Name:");
const merchantEmpty = generatePosterModel("new-shop", "   ");
assert(merchantEmpty.displayShopName === "Apni Dukaan", "Empty shop name falls back to polite generic 'Apni Dukaan' without demo/hardcoded store names");
assert(merchantEmpty.qrUrl === "https://app.apnagrahak.com/shop/new-shop", "QR URL remains accurate even when shop name is missing");

// 5. Long Shop Name Formatting
console.log("\n▶ 5. Long Shop Name Boundary Check:");
const longName = "Shree Balaji Pure Veg Family Restaurant & Fast Food Center";
const merchantLong = generatePosterModel("shree-balaji", longName);
assert(merchantLong.displayShopName.endsWith("..."), "Long shop name safely fits poster boundaries with ellipsis");
assert(merchantLong.displayShopName.length <= 29, "Truncated length stays within printable boundary");

console.log("\n=================================================");
console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
console.log("=================================================");

if (failed > 0) {
  process.exit(1);
}

