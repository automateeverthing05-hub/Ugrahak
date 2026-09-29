export interface GrowthService {
  id: string;
  name: string;
  startingPrice: string;
  description: string;
  included: string[];
  note?: string;
  delivery?: string;
  ctaText: string;
  whatsappMessage: string;
  iconName: "Globe" | "Megaphone" | "Share2" | "Search" | "Store";
}

export const UGRAHAK_WHATSAPP_NUMBER = "918758422859";

/**
 * Builds a direct WhatsApp click-to-chat URL with prefilled message
 */
export function getWhatsAppUrl(prefilledMessage: string): string {
  return `https://wa.me/${UGRAHAK_WHATSAPP_NUMBER}?text=${encodeURIComponent(prefilledMessage)}`;
}

export const BUSINESS_GROWTH_SERVICES: GrowthService[] = [
  {
    id: "website-development",
    name: "Website Development",
    startingPrice: "Starting at ₹2,999",
    description: "Get a professional mobile-friendly website for your business.",
    included: [
      "1-page business website",
      "Business information",
      "Business photos",
      "Call button",
      "WhatsApp button",
      "Google Maps location",
      "Mobile responsive design",
      "Basic SEO",
    ],
    delivery: "Estimated delivery: 3–5 days",
    ctaText: "Get Started on WhatsApp",
    whatsappMessage: "Hi Ugrahak, I want to get started with Website Development.",
    iconName: "Globe",
  },
  {
    id: "meta-ads",
    name: "Meta Ads & Lead Generation",
    startingPrice: "Starting at ₹1,999/month",
    description: "Reach more local customers through Facebook and Instagram advertising.",
    included: [
      "Facebook + Instagram ad setup",
      "1 campaign",
      "Basic audience targeting",
      "Ad setup",
      "Lead tracking",
      "Basic monthly report",
    ],
    note: "Ad budget is separate.",
    ctaText: "Start Ads on WhatsApp",
    whatsappMessage: "Hi Ugrahak, I want to start Meta Ads & Lead Generation for my business.",
    iconName: "Megaphone",
  },
  {
    id: "social-media-management",
    name: "Social Media Management",
    startingPrice: "Starting at ₹2,999/month",
    description: "Keep your business active and professional on social media.",
    included: [
      "Instagram + Facebook management",
      "8 posts/month",
      "4 reels/month",
      "Captions",
      "Basic content planning",
      "Monthly report",
    ],
    ctaText: "Get Started on WhatsApp",
    whatsappMessage: "Hi Ugrahak, I want to get started with Social Media Management.",
    iconName: "Share2",
  },
  {
    id: "seo",
    name: "SEO",
    startingPrice: "Starting at ₹2,499/month",
    description: "Improve your local search visibility and help more customers find your business.",
    included: [
      "Local SEO",
      "Basic website SEO",
      "Keyword research",
      "On-page optimization",
      "Monthly report",
    ],
    ctaText: "Start SEO on WhatsApp",
    whatsappMessage: "Hi Ugrahak, I want to start SEO for my business.",
    iconName: "Search",
  },
  {
    id: "google-business-profile",
    name: "Google Business Profile Management",
    startingPrice: "Starting at ₹999/month",
    description: "Optimize your Google Business Profile so local customers can find your business more easily.",
    included: [
      "Profile optimization",
      "Business information updates",
      "Category and service optimization",
      "Google Posts",
      "Review-response assistance",
      "Monthly report",
    ],
    ctaText: "Manage My Profile on WhatsApp",
    whatsappMessage: "Hi Ugrahak, I want help managing my Google Business Profile.",
    iconName: "Store",
  },
];

