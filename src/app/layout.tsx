import type { Metadata, Viewport } from "next";
import { Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";

const devanagariFont = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-devanagari",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#4f46e5",
};

export const metadata: Metadata = {
  title: "U-Grahak — एक बार आए ग्राहक को, बार-बार बुलाइए",
  description:
    "छोटे कारोबार के लिए स्मार्ट ग्राहक प्रबंधन। अपने ग्राहकों की सूची बनाएं, पहली खरीद पर इनाम दें और नए ऑफ़र भेजकर उन्हें वापस बुलाएं।",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "U-Grahak",
  },
  openGraph: {
    title: "U-Grahak — एक बार आए ग्राहक को, बार-बार बुलाइए",
    description: "दुकान या बिज़नेस owner अपने ग्राहकों की सूची बनाए, डिजिटल इनाम दे और वापस बुलाने के लिए ऑफ़र भेजे।",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "U-Grahak" }],
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hi" className={devanagariFont.variable}>
      <body className={`${devanagariFont.className} min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-indigo-600 selection:text-white`}>
        {children}
      </body>
    </html>
  );
}

