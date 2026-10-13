import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LandingPageClient } from "@/components/landing/LandingPageClient";

export const metadata: Metadata = {
  title: "U-Grahak — Local Business. Stronger Customers. | नए ग्राहक जोड़ें, Offers और Rewards से उन्हें दोबारा बुलाएँ",
  description:
    "QR Code से Customers जोड़ें, Digital Rewards दें और नए Products के Offers अपने eligible Customers तक आसानी से पहुँचाएँ — एक ही Dashboard से।",
  openGraph: {
    title: "U-Grahak — Local Business. Stronger Customers.",
    description:
      "नए ग्राहक जोड़ें। Offers और Rewards से Customers को दोबारा आने के लिए प्रेरित करें — एक ही Dashboard से।",
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
