import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { SignupForm } from "@/components/auth/SignupForm";
import { Spinner } from "@/components/ui/Spinner";
import { Footer } from "@/components/layout/Footer";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { QrCode, Gift, Send, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "मुफ्त अकाउंट बनाएं | U-Grahak बिज़नेस",
  description:
    "कुछ आसान जानकारी भरें और अपनी दुकान के लिए QR तैयार करें। U-Grahak के साथ मुफ्त में ग्राहक सूची बनाएं।",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <BrandLogo size="md" />
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-indigo-600 px-3.5 py-2 rounded-xl transition-all"
            >
              पहले से अकाउंट है? लॉग इन करें
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content: 2-Column Responsive Layout */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-14 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
          {/* Left Column (Desktop 6 Cols / Hidden on Mobile): Value Proposition */}
          <div className="hidden lg:block lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
                फ्री प्लान से शुरुआत करें
              </span>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug">
                अपना मुफ्त बिज़नेस अकाउंट बनाएं
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                कुछ आसान जानकारी भरें और अपनी दुकान के लिए QR तैयार करें।
              </p>
            </div>

            {/* 3 Steps */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">1. दुकान का QR कोड बनाएं</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">काउंटर पर लगाने के लिए तैयार QR कोड तुरंत पाएं।</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">2. पहली खरीद पर डिजिटल इनाम</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">ग्राहक स्कैन करके नाम लिखेगा और इनाम पाएगा।</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">3. नए ऑफ़र भेजें</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">ग्राहकों को अपनी दुकान पर बार-बार बुलाएं।</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>₹0/महीना &bull; कोई क्रेडिट कार्ड जरूरी नहीं &bull; सुरक्षित डेटा</span>
            </div>
          </div>

          {/* Right Column (Desktop 6 Cols / Mobile Dominant): Signup Form */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <Suspense fallback={<Spinner size="lg" />}>
              <SignupForm />
            </Suspense>
          </div>
        </div>
      </main>

      {/* Global Footer */}
      <Footer variant="simple" />
    </div>
  );
}
