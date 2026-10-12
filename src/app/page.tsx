import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LandingPageClient } from "@/components/landing/LandingPageClient";

export const metadata: Metadata = {
  title: "U-Grahak — Local Business. Stronger Customers. | अब हर नया Customer बनेगा Repeat Customer",
  description:
    "QR Code से Customers जोड़िए, Scratch Card Rewards दीजिए और eligible Customers तक नए Products के Offers पहुँचाइए — एक आसान Dashboard से।",
  openGraph: {
    title: "U-Grahak — Local Business. Stronger Customers.",
    description:
      "अब हर नया Customer बनेगा Repeat Customer। QR Code से Customers जोड़िए, Scratch Card Rewards दीजिए और Offers पहुँचाइए।",
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
