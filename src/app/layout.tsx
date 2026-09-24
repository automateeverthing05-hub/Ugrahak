import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ugrahak - Customer Retention Platform for Local Merchants",
  description:
    "Turn first-time shoppers into repeat loyal customers. Easy QR-based rewards for local businesses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}

