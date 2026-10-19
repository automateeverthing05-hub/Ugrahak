import type { Metadata } from "next";
import Link from "next/link";
import { PLANS } from "@/lib/billing/plans";
import { Check, ArrowRight, ShieldCheck, Sparkles, FileText, RefreshCw } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { formatIndianNumber, formatINR } from "@/lib/utils/formatters";

export const metadata: Metadata = {
  title: "मूल्य और प्लान | U-Grahak बिज़नेस",
  description:
    "स्थानीय दुकानदारों के लिए आसान और पारदर्शी प्लान। फ्री, स्टार्टर, ग्रोथ और प्रो प्लान।",
};

export default function PricingPage() {
  const planList = [PLANS.FREE, PLANS.STARTER, PLANS.GROWTH, PLANS.PRO];

  const planHindiFeatures: Record<string, string[]> = {
    FREE: [
      "100 तक ग्राहक (Stored Customers)",
      "हर महीने 100 तक ऑफ़र प्राप्तकर्ता (Recipients)",
      "दुकान का QR कोड एवं चेक-इन",
      "डिजिटल स्क्रैच कार्ड रिवॉर्ड",
      "Google रिव्यू आमंत्रण लिंक",
      "मूल डैशबोर्ड व ग्राहक सूची",
    ],
    STARTER: [
      "1,500 तक ग्राहक (Stored Customers)",
      "मासिक ऑफ़र कैंपेन (Send Offers)",
      "पात्र ग्राहकों के लिए Google रिव्यू रिमाइंडर",
      "ग्राहक विज़िट हिस्ट्री व ट्रैकिंग",
      "स्क्रैच कार्ड रिवॉर्ड्स",
      "ऑफ़र हिस्ट्री और स्टैंडर्ड सपोर्ट",
    ],
    GROWTH: [
      "5,000 तक ग्राहक (Stored Customers)",
      "मासिक ऑफ़र कैंपेन (Send Offers)",
      "पात्र ग्राहकों के लिए Google रिव्यू रिमाइंडर",
      "रिपीट ग्राहक ट्रैकिंग व विज़िट हिस्ट्री",
      "दुकान के पास आने पर ऑफ़र (Nearby Offers 100–200m)",
      "रिवॉर्ड व ऑफ़र हिस्ट्री",
    ],
    PRO: [
      "10,000 तक ग्राहक (Safe Technical Capacity)",
      "मासिक ऑफ़र कैंपेन (Send Offers)",
      "Google रिव्यू रिमाइंडर",
      "उन्नत रिपीट ग्राहक ट्रैकिंग",
      "बिज़नेस ग्रोथ इनसाइट्स व ऑफ़र एनालिटिक्स",
      "दुकान के पास आने पर ऑफ़र (Nearby Offers)",
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Navigation Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <BrandLogo size="md" />
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-indigo-600 px-3 py-1.5 transition-colors"
            >
              लॉग इन
            </Link>
            <Link
              href="/signup"
              className="text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl transition-colors shadow-xs"
            >
              मुफ्त शुरू करें
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 flex-1 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            स्थानीय कारोबार के लिए पारदर्शी मूल्य
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            शुरुआत मुफ्त में करें, जैसे दुकान बढ़े वैसे अपग्रेड करें
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            QR रिवॉर्ड, विशेष ऑफ़र और ग्राहक सूची के साथ नए ग्राहकों को बार-बार अपनी दुकान पर बुलाएं।
          </p>
        </div>

        {/* Pricing Cards Grid (4 Plans) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {planList.map((plan) => {
            const isPopular = plan.id === "GROWTH";
            const isFree = plan.id === "FREE";
            const features = planHindiFeatures[plan.id] || plan.features;

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-3xl p-6 flex flex-col justify-between transition-all shadow-xs ${
                  isPopular
                    ? "border-2 border-indigo-600 shadow-md relative"
                    : "border border-slate-200"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm">
                    सर्वाधिक लोकप्रिय
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">
                      {isFree ? "फ्री प्लान" : plan.name}
                    </h3>
                    {isFree && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        हमेशा फ्री
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900">
                      {formatINR(plan.priceINR)}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">/ महीना</span>
                  </div>

                  <p className="text-xs text-indigo-600 font-semibold mt-2">
                    {formatIndianNumber(plan.customerLimit)} ग्राहकों तक
                  </p>

                  <ul className="mt-6 space-y-2.5 text-xs text-slate-600">
                    {features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8">
                  <Link
                    href={isFree ? "/signup" : `/signup?plan=${plan.id.toLowerCase()}`}
                    className={`w-full py-3.5 px-4 rounded-2xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors min-h-[46px] ${
                      isPopular
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                        : isFree
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                        : "bg-slate-900 hover:bg-slate-800 text-white"
                    }`}
                  >
                    <span>{isFree ? "मुफ्त शुरू करें" : `${plan.name} चुनें`}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Highlights Section */}
        <div className="mt-12 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left max-w-6xl mx-auto shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">
                मुफ्त से शुरुआत करें &bull; कभी भी अपग्रेड करें
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                तुरंत अपनी दुकान का QR कोड बनाएं, ग्राहकों को डिजिटल इनाम दें और जरूरत के अनुसार प्लान चुनें।
              </p>
            </div>
          </div>

          <Link
            href="/signup"
            className="px-6 py-3.5 bg-indigo-600 text-white rounded-2xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm whitespace-nowrap min-h-[46px] flex items-center justify-center"
          >
            मुफ्त शुरू करें
          </Link>
        </div>

        {/* Policy Links */}
        <div className="mt-8 p-5 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left max-w-6xl mx-auto text-xs text-slate-500">
          <div>
            <span className="font-semibold text-slate-700">बिलिंग नियम:</span> बिना क्रेडिट कार्ड फ्री प्लान से शुरुआत करें। सशुल्क प्लान में मासिक आधार पर सेवाएं मिलती हैं।
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 font-semibold text-indigo-600">
            <Link href="/terms" className="hover:underline inline-flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>नियम और शर्तें</span>
            </Link>
            <span className="text-slate-300">&bull;</span>
            <Link href="/refund-policy" className="hover:underline inline-flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span>रिफंड नीति</span>
            </Link>
            <span className="text-slate-300">&bull;</span>
            <Link href="/privacy-policy" className="hover:underline inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>गोपनीयता नीति</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Global Footer */}
      <Footer variant="simple" />
    </div>
  );
}
