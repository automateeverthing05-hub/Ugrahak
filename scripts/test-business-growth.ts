/**
 * Automated Verification Suite for Ugrahak Business Growth Section
 */

import {
  BUSINESS_GROWTH_SERVICES,
  UGRAHAK_WHATSAPP_NUMBER,
  getWhatsAppUrl,
} from "../src/lib/constants/growth-services";

async function runTests() {
  console.log("=======================================================");
  console.log("UGRAHAK BUSINESS GROWTH SECTION TEST SUITE");
  console.log("=======================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, description: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${description}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${description}`);
      failed++;
    }
  }

  // 1. WhatsApp Number
  assert(
    UGRAHAK_WHATSAPP_NUMBER === "918758422859",
    "1. Centralized WhatsApp number is configured as 918758422859"
  );

  // 2. Total Services Count
  assert(
    BUSINESS_GROWTH_SERVICES.length === 5,
    "2. Exactly 5 business growth services defined in catalog"
  );

  // 3. Service 1: Website Development
  const s1 = BUSINESS_GROWTH_SERVICES.find((s) => s.id === "website-development");
  assert(
    !!s1 &&
      s1.name === "Website Development" &&
      s1.startingPrice === "Starting at ₹2,999" &&
      s1.description === "Get a professional mobile-friendly website for your business." &&
      s1.delivery === "Estimated delivery: 3–5 days" &&
      s1.ctaText === "Get Started on WhatsApp" &&
      s1.whatsappMessage === "Hi Ugrahak, I want to get started with Website Development.",
    "3. Service 1 (Website Development) configuration matches all requirements"
  );
  assert(
    !!s1 && s1.included.length === 8 && s1.included.includes("Call button") && s1.included.includes("WhatsApp button"),
    "4. Service 1 includes 8 items (Call button, WhatsApp button, etc.)"
  );

  // 4. Service 2: Meta Ads & Lead Generation
  const s2 = BUSINESS_GROWTH_SERVICES.find((s) => s.id === "meta-ads");
  assert(
    !!s2 &&
      s2.name === "Meta Ads & Lead Generation" &&
      s2.startingPrice === "Starting at ₹1,999/month" &&
      s2.description === "Reach more local customers through Facebook and Instagram advertising." &&
      s2.note === "Ad budget is separate." &&
      s2.ctaText === "Start Ads on WhatsApp" &&
      s2.whatsappMessage === "Hi Ugrahak, I want to start Meta Ads & Lead Generation for my business.",
    "5. Service 2 (Meta Ads & Lead Generation) configuration matches all requirements"
  );
  assert(
    !!s2 && s2.included.length === 6 && s2.included.includes("Lead tracking"),
    "6. Service 2 includes 6 items with ad budget separate note"
  );

  // 5. Service 3: Social Media Management
  const s3 = BUSINESS_GROWTH_SERVICES.find((s) => s.id === "social-media-management");
  assert(
    !!s3 &&
      s3.name === "Social Media Management" &&
      s3.startingPrice === "Starting at ₹2,999/month" &&
      s3.description === "Keep your business active and professional on social media." &&
      s3.ctaText === "Get Started on WhatsApp" &&
      s3.whatsappMessage === "Hi Ugrahak, I want to get started with Social Media Management.",
    "7. Service 3 (Social Media Management) configuration matches all requirements"
  );
  assert(
    !!s3 && s3.included.length === 6 && s3.included.includes("8 posts/month") && s3.included.includes("4 reels/month"),
    "8. Service 3 includes 8 posts/month and 4 reels/month"
  );

  // 6. Service 4: SEO
  const s4 = BUSINESS_GROWTH_SERVICES.find((s) => s.id === "seo");
  assert(
    !!s4 &&
      s4.name === "SEO" &&
      s4.startingPrice === "Starting at ₹2,499/month" &&
      s4.description === "Improve your local search visibility and help more customers find your business." &&
      s4.ctaText === "Start SEO on WhatsApp" &&
      s4.whatsappMessage === "Hi Ugrahak, I want to start SEO for my business.",
    "9. Service 4 (SEO) configuration matches all requirements"
  );
  assert(
    !!s4 && s4.included.length === 5 && s4.included.includes("Local SEO") && s4.included.includes("On-page optimization"),
    "10. Service 4 includes local SEO and keyword research"
  );

  // 7. Service 5: Google Business Profile Management
  const s5 = BUSINESS_GROWTH_SERVICES.find((s) => s.id === "google-business-profile");
  assert(
    !!s5 &&
      s5.name === "Google Business Profile Management" &&
      s5.startingPrice === "Starting at ₹999/month" &&
      s5.description === "Optimize your Google Business Profile so local customers can find your business more easily." &&
      s5.ctaText === "Manage My Profile on WhatsApp" &&
      s5.whatsappMessage === "Hi Ugrahak, I want help managing my Google Business Profile.",
    "11. Service 5 (Google Business Profile Management) configuration matches all requirements"
  );
  assert(
    !!s5 && s5.included.length === 6 && s5.included.includes("Review-response assistance"),
    "12. Service 5 includes profile optimization and review-response assistance"
  );

  // 8. Test WhatsApp URL Generation
  for (const service of BUSINESS_GROWTH_SERVICES) {
    const url = getWhatsAppUrl(service.whatsappMessage);
    const expectedPrefix = `https://wa.me/918758422859?text=`;
    const isUrlValid = url.startsWith(expectedPrefix) && url.includes(encodeURIComponent(service.whatsappMessage));
    assert(isUrlValid, `13. WhatsApp URL for '${service.name}' generates valid destination & prefilled text`);
  }

  // 9. No Online Checkout / Payment Gateway on Growth Section
  const hasNoCheckout = BUSINESS_GROWTH_SERVICES.every((s) => !("checkoutUrl" in s) && !("razorpayPlanId" in s));
  assert(hasNoCheckout, "14. No online checkout or Razorpay integration in Business Growth section");

  console.log("\n=======================================================");
  console.log(`TOTAL TESTS: ${passed + failed}`);
  console.log(`PASSED:      ${passed}`);
  console.log(`FAILED:      ${failed}`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

