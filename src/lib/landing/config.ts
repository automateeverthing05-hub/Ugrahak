/**
 * U-Grahak Landing Page Configuration & Source of Truth Constants
 * 
 * NOTE FOR USER:
 * 1. SUPPORT_EMAIL: Change to your custom domain email once configured in DNS.
 * 2. WHATSAPP_NUMBER: Your Indian WhatsApp Business number with country code (e.g. 919876543210).
 *    When left empty (""), all WhatsApp buttons and cards are completely hidden.
 * 3. TESTIMONIALS: Populate with genuine shopkeeper quotes, shop names, and cities. Renders ONLY when non-empty.
 * 4. DEMO_VIDEO_URL: Paste your YouTube / Hindi walkthrough video embed URL. Renders ONLY when non-empty.
 * 5. METRIC_STRIP: Populate with verified metrics only. Renders ONLY when non-empty.
 */

import { UGRAHAK_WHATSAPP_NUMBER } from "@/lib/constants/growth-services";

export const LANDING_CONFIG = {
  // Contact & Channels
  SUPPORT_EMAIL: "supportugrahak@gmail.com",
  FALLBACK_SUPPORT_EMAIL: "",
  WHATSAPP_NUMBER: UGRAHAK_WHATSAPP_NUMBER,
  WHATSAPP_PREFILLED_MESSAGE: "U-Grahak के बारे में जानना है",

  // Delivery Channel (Derived from codebase: Firebase Cloud Messaging Web Push)
  OFFER_CHANNEL_HINDI: "फ़ोन स्क्रीन पर डिजिटल अलर्ट",
  OFFER_CHANNEL_FULL_HINDI: "फ़ोन ब्राउज़र अलर्ट (बिना ऐप डाउनलोड)",

  // Plan Limits (Strictly synchronized with src/lib/billing/plans.ts)
  PLANS: {
    FREE: {
      name: "Free",
      priceINR: 0,
      customerLimit: 100,
      monthlyRecipientLimit: 100,
      ctaText: "Start Free ->",
      ctaHref: "/signup",
    },
    STARTER: {
      name: "Starter",
      priceINR: 499,
      customerLimit: 1500,
      monthlyRecipientLimit: 1500,
      ctaText: "Start Starter ->",
      ctaHref: "/signup?plan=starter",
    },
    GROWTH: {
      name: "Growth",
      priceINR: 1499,
      customerLimit: 5000,
      monthlyRecipientLimit: 5000,
      ctaText: "Start Growth ->",
      ctaHref: "/signup?plan=growth",
    },
    PRO: {
      name: "Pro",
      priceINR: 2999,
      customerLimit: 10000,
      monthlyRecipientLimit: 10000,
      ctaText: "Start Pro ->",
      ctaHref: "/signup?plan=pro",
    },
  },

  // Social Proof Placeholders (Render ONLY when array contains verified items)
  TESTIMONIALS: [] as Array<{
    quote: string;
    ownerName: string;
    shopName: string;
    city: string;
  }>,

  // Demo Video Embed URL (Render ONLY when non-empty)
  DEMO_VIDEO_URL: "",

  // Optional Verified Numeric Strip (Render ONLY when non-empty)
  METRIC_STRIP: null as {
    dailyCustomersPlaceholder?: string;
    monthlyNumbersPlaceholder?: string;
  } | null,
};
