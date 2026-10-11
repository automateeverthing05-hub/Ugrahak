import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LandingPageClient } from "@/components/landing/LandingPageClient";

export const metadata: Metadata = {
  title: "U-Grahak — एक बार आए ग्राहक को, बार-बार बुलाइए",
  description:
    "छोटे कारोबार के लिए स्मार्ट ग्राहक प्रबंधन। अपने ग्राहकों की सूची बनाएं, पहली खरीद पर इनाम दें और नए ऑफ़र भेजकर उन्हें अपनी दुकान पर वापस बुलाएं।",
  openGraph: {
    title: "U-Grahak — एक बार आए ग्राहक को, बार-बार बुलाइए",
    description:
      "दुकानदार अपने ग्राहकों की सूची बनाए, डिजिटल इनाम दे और वापस बुलाने के लिए ऑफ़र भेजे।",
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
