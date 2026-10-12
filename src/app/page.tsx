import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LandingPageClient } from "@/components/landing/LandingPageClient";

export const metadata: Metadata = {
  title: "U-Grahak — एक बार आया Customer, दोबारा आने की वजह पाए",
  description:
    "अपनी दुकान पर QR Code लगाएँ, Scratch Card Rewards दें और नए Products के Offers अपने eligible Customers तक पहुँचाएँ — एक आसान Dashboard से।",
  openGraph: {
    title: "U-Grahak — Smart Customer Retention for Local Businesses",
    description:
      "दुकान पर QR Code लगाएँ, Scratch Card Rewards दें और नए Products के Offers Customers तक पहुँचाएँ।",
    type: "website",
    url: "https://ugrahak.com",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "U-Grahak" }],
  },
};

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return <LandingPageClient />;
}
