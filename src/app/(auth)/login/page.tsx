import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { Spinner } from "@/components/ui/Spinner";
import { Footer } from "@/components/layout/Footer";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { QrCode, Gift, Send, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "लॉग इन | U-Grahak बिज़नेस",
  description:
    "अपने ग्राहकों और ऑफ़र को संभालने के लिए U-Grahak बिज़नेस में लॉग इन करें।",
};

export default function LoginPage() {
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
              href="/signup"
              className="text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl transition-all shadow-xs"
            >
              मुफ्त शुरू करें
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content: Balanced 2-Column Responsive Layout */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-14 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
          {/* Left Column (Desktop 6 Cols / Hidden or Compact on Mobile): Brand Message & Subtle Preview */}
          <div className="hidden lg:block lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
                दुकानदारों के लिए आसान ग्राहक प्रबंधन
              </span>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug">
                एक बार आए ग्राहक को, बार-बार बुलाइए।
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                ग्राहकों की सूची बनाएं, पहली खरीद पर डिजिटल इनाम दें और नए ऑफ़र भेजकर उन्हें अपनी दुकान पर वापस बुलाएं।
              </p>
            </div>

            {/* Compact 3 Highlights */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">काउंटर QR से ग्राहक जोड़ें</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">ग्राहक बिना किसी ऐप के नाम दर्ज करता है।</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">डिजिटल इनाम दें</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">पहली खरीद पर डिजिटल स्क्रैच कार्ड से इनाम।</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">सीधे ऑफ़र भेजें</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">एक क्लिक में सभी ग्राहकों तक नए ऑफ़र पहुंचाएं।</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>₹0 से शुरुआत &bull; सुरक्षित एवं निजी ग्राहक डेटा</span>
            </div>
          </div>

          {/* Right Column (Desktop 6 Cols / Mobile Dominant): Login Form */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <Suspense fallback={<Spinner size="lg" />}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </main>

      {/* Global Footer */}
      <Footer variant="simple" />
    </div>
  );
}
