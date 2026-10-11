"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  QrCode,
  Gift,
  Send,
  Star,
  Users,
  ChevronDown,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Footer } from "@/components/layout/Footer";

export function LandingPageClient() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const faqs = [
    {
      q: "क्या ग्राहक को ऐप डाउनलोड करना होगा?",
      a: "नहीं। ग्राहक अपने मोबाइल ब्राउज़र से QR स्कैन करके आगे बढ़ सकता है।",
    },
    {
      q: "क्या शुरुआत करने के लिए पैसे देने होंगे?",
      a: "नहीं। फ्री प्लान ₹0 प्रति माह से शुरू होता है। इसकी तय सीमाएं लागू रहेंगी।",
    },
    {
      q: "क्या मैं मोबाइल से दुकान संभाल सकता हूं?",
      a: "हां। आप मोबाइल ब्राउज़र से उपलब्ध डैशबोर्ड सुविधाओं का इस्तेमाल कर सकते हैं।",
    },
    {
      q: "क्या मेरा ग्राहक डेटा दूसरी दुकानों को दिखाई देगा?",
      a: "नहीं। हर दुकानदार का डेटा पूरी तरह अलग और सुरक्षित रहता है। आपकी ग्राहक सूची सिर्फ आपके खाते में ही सुरक्षित रहती है।",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-600 selection:text-white">
      {/* ------------------------------------------------------------- */}
      {/* SECTION 1: HEADER                                             */}
      {/* ------------------------------------------------------------- */}
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <BrandLogo size="md" priority={true} />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center gap-5 sm:gap-6">
            <Link
              href="/pricing"
              className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
            >
              मूल्य
            </Link>
            <Link
              href="/login"
              className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-indigo-600 px-2 py-1.5 transition-colors"
            >
              लॉग इन
            </Link>
            <Link
              href="/signup"
              className="text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl shadow-xs transition-all"
            >
              मुफ्त शुरू करें
            </Link>
          </div>

          {/* Mobile Navigation */}
          <div className="flex sm:hidden items-center gap-2">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-700 px-2.5 py-1.5"
            >
              लॉग इन
            </Link>
            <Link
              href="/signup"
              className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg shadow-xs"
            >
              मुफ्त शुरू करें
            </Link>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 2: HERO                                               */}
      {/* ------------------------------------------------------------- */}
      <section className="pt-8 sm:pt-14 pb-12 sm:pb-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-5 text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
              <span>छोटे कारोबार के लिए स्मार्ट ग्राहक प्रबंधन</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.2]">
              एक बार आए ग्राहक को, बार-बार बुलाइए।
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
              अपने ग्राहकों की सूची बनाएं, पहली खरीद पर इनाम दें और नए ऑफ़र भेजकर उन्हें अपनी दुकान पर वापस बुलाएं।
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm sm:text-base shadow-sm hover:shadow transition-all"
              >
                <span>मुफ्त शुरू करें</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#how-it-works"
                className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-white text-slate-700 font-semibold text-sm transition-all"
              >
                कैसे काम करता है?
              </a>
            </div>

            <p className="text-xs text-slate-500 font-medium pt-1">
              ₹0 से शुरुआत &bull; ग्राहक के लिए कोई ऐप नहीं
            </p>
          </div>

          {/* Right Product Preview Visual */}
          <div className="lg:col-span-5 max-w-md mx-auto w-full">
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                    UG
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">U-Grahak बिज़नेस</p>
                    <p className="text-[10px] text-slate-400">दुकान डैशबोर्ड झलक</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  सक्रिय
                </span>
              </div>

              {/* QR Code & Scratch Card Composition */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center space-y-1.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <p className="text-[11px] font-bold text-slate-800">काउंटर QR कोड</p>
                  <p className="text-[9px] text-slate-500">स्कैन करके ग्राहक जुड़ेगा</p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center space-y-1.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                    <Gift className="w-5 h-5" />
                  </div>
                  <p className="text-[11px] font-bold text-slate-800">डिजिटल इनाम</p>
                  <p className="text-[9px] text-slate-500">स्क्रैच कार्ड से छूट</p>
                </div>
              </div>

              {/* Offer Broadcast Notification Preview */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-bold text-indigo-600 flex items-center gap-1">
                    <Send className="w-3 h-3" />
                    ऑफ़र नोटिफिकेशन
                  </span>
                  <span>सीधे मोबाइल पर</span>
                </div>
                <p className="text-xs font-bold text-slate-900">नया सामान आया है &bull; 20% छूट</p>
                <p className="text-[11px] text-slate-600 leading-snug">
                  नमस्ते [ग्राहक का नाम], आज ही दुकान पर आइए और विशेष छूट पाइए।
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 3: CORE VALUE PROPOSITION                             */}
      {/* ------------------------------------------------------------- */}
      <section className="py-12 sm:py-16 bg-white border-y border-slate-200/80 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-8 sm:space-y-10">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              ग्राहक जोड़ें। इनाम दें। वापस बुलाएं।
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Feature 1 */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">QR से ग्राहक जोड़ें</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                दुकान पर QR लगाएं और ग्राहकों की सूची बनाएं।
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Gift className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">पहली खरीद पर इनाम</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                नए ग्राहकों को डिजिटल स्क्रैच कार्ड से इनाम दें।
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">सीधे ऑफ़र भेजें</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                नए सामान, छूट और खास ऑफ़र की जानकारी भेजें।
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Star className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Google रिव्यू</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                खुश ग्राहकों को Google पर रिव्यू देने का आसान लिंक दें।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 4: HOW IT WORKS                                       */}
      {/* ------------------------------------------------------------- */}
      <section id="how-it-works" className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-8 sm:space-y-10">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              शुरू करना बेहद आसान है
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Step 1 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center mx-auto">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900">QR लगाएं</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                अपनी दुकान का QR काउंटर पर रखें।
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center mx-auto">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900">इनाम दिलाएं</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                ग्राहक QR स्कैन करके अपना नाम दर्ज करे और इनाम पाए।
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center mx-auto">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900">ऑफ़र भेजें</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                नोटिफिकेशन की अनुमति देने वाले ग्राहकों तक ऑफ़र पहुंचाएं।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 5: PRODUCT PREVIEW                                    */}
      {/* ------------------------------------------------------------- */}
      <section className="py-12 sm:py-16 bg-white border-y border-slate-200/80 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              आपकी दुकान, आपका ग्राहक डेटा
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              ग्राहकों और ऑफ़र को एक ही डैशबोर्ड से संभालें।
            </p>
          </div>

          {/* Clean realistic merchant dashboard preview */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4">
                <span className="text-[11px] text-slate-500 font-medium">कुल ग्राहक</span>
                <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">100+</p>
                <span className="text-[10px] text-emerald-600 font-semibold">सुरक्षित सूची</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4">
                <span className="text-[11px] text-slate-500 font-medium">सक्रिय ऑफ़र</span>
                <p className="text-xl sm:text-2xl font-bold text-indigo-600 mt-1">1 क्लिक</p>
                <span className="text-[10px] text-slate-400">सीधे ग्राहक तक</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4">
                <span className="text-[11px] text-slate-500 font-medium">काउंटर QR</span>
                <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">तैयार</p>
                <span className="text-[10px] text-slate-400">प्रिंट करें</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4">
                <span className="text-[11px] text-slate-500 font-medium">ग्राहक गतिविधि</span>
                <p className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1">लाइव</p>
                <span className="text-[10px] text-slate-400">हर विज़िट दर्ज</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>दुकानदार अपने मोबाइल या कंप्यूटर से सीधे ग्राहकों की सूची और ऑफ़र संभाल सकते हैं।</span>
              </div>
              <Link
                href="/signup"
                className="text-indigo-600 hover:text-indigo-700 font-bold underline whitespace-nowrap"
              >
                डैशबोर्ड शुरू करें &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 6: PRICING                                            */}
      {/* ------------------------------------------------------------- */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-xl mx-auto space-y-6 text-center">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              शुरुआत मुफ्त में करें
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              पहले इस्तेमाल करें। जरूरत बढ़े तो प्लान बदलें।
            </p>
          </div>

          {/* Single Free Plan Card */}
          <div className="bg-white border-2 border-indigo-600/30 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 text-left relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs mb-2">
                  फ्री प्लान
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  ₹0 <span className="text-sm font-normal text-slate-500">/ महीना</span>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                कोई शुल्क नहीं
              </span>
            </div>

            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 font-medium">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>100 तक ग्राहक</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>हर महीने 100 तक ऑफ़र प्राप्तकर्ता</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>दुकान का QR कोड</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>डिजिटल स्क्रैच कार्ड</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Google रिव्यू लिंक</span>
              </li>
            </ul>

            <div className="pt-2 space-y-3">
              <Link
                href="/signup"
                className="w-full inline-flex items-center justify-center py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xs transition-colors"
              >
                मुफ्त अकाउंट बनाएं
              </Link>
              <div className="text-center">
                <Link
                  href="/pricing"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline"
                >
                  सभी प्लान देखें
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 7: WHO IT IS FOR                                      */}
      {/* ------------------------------------------------------------- */}
      <section className="py-8 bg-slate-100/60 border-y border-slate-200/60 px-4 sm:px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs sm:text-sm font-semibold text-slate-700">
            किराना दुकान, कपड़ों की दुकान, कैफे, सैलून, रेस्टोरेंट और अन्य स्थानीय कारोबार के लिए।
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 8: FAQ                                                */}
      {/* ------------------------------------------------------------- */}
      <section id="faq" className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              अक्सर पूछे जाने वाले सवाल
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${
                        isOpen ? "rotate-180 text-indigo-600" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 9: FINAL CTA                                          */}
      {/* ------------------------------------------------------------- */}
      <section className="py-12 sm:py-16 bg-white border-t border-slate-200 px-4 sm:px-6 text-center">
        <div className="max-w-xl mx-auto space-y-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            अपने ग्राहकों को दोबारा बुलाना शुरू करें।
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            आज ही अपना मुफ्त अकाउंट बनाएं।
          </p>
          <div className="pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm sm:text-base shadow-sm transition-all"
            >
              मुफ्त शुरू करें
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 10: FOOTER                                            */}
      {/* ------------------------------------------------------------- */}
      <Footer variant="simple" />
    </div>
  );
}

