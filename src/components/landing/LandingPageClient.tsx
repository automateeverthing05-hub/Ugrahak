"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
  Menu,
  X,
  Store,
  Clock,
  Mail,
  HelpCircle,
  RotateCcw,
  Percent,
  MessageCircle,
  Play,
  HeartHandshake,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { LANDING_CONFIG } from "@/lib/landing/config";

export function LandingPageClient() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [demoTab, setDemoTab] = useState<"merchant" | "customer">("merchant");

  // Contact Form State
  const [contactName, setContactName] = useState("");
  const [contactBusinessName, setContactBusinessName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [contactTopic, setContactTopic] = useState("QR Code & Scratch Card Setup");
  const [contactMsg, setContactMsg] = useState("");
  const [contactStatus, setContactStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [contactErrorText, setContactErrorText] = useState("");
  const [contactResponseMsg, setContactResponseMsg] = useState("");

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactStatus("loading");
    setContactErrorText("");

    if (!contactName.trim() || !contactInfo.trim() || !contactMsg.trim()) {
      setContactStatus("error");
      setContactErrorText("कृपया अपना नाम, संपर्क विवरण और संदेश भरें।");
      return;
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactName.trim(),
          businessName: contactBusinessName.trim(),
          contact: contactInfo.trim(),
          topic: contactTopic.trim(),
          message: contactMsg.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "संदेश भेजने में विफल रहे।");
      }

      setContactStatus("success");
      setContactResponseMsg(
        data.message ||
          (LANDING_CONFIG.SUPPORT_EMAIL
            ? `आपकी पूछताछ दर्ज कर ली गई है। हमारी टीम (${LANDING_CONFIG.SUPPORT_EMAIL}) 24–48 घंटों में संपर्क करेगी।`
            : "आपकी पूछताछ दर्ज कर ली गई है। हमारी सहायता टीम 24–48 घंटों में संपर्क करेगी।")
      );
      setContactName("");
      setContactBusinessName("");
      setContactInfo("");
      setContactMsg("");
    } catch (err: unknown) {
      setContactStatus("error");
      setContactErrorText(
        err instanceof Error
          ? err.message
          : (LANDING_CONFIG.SUPPORT_EMAIL
            ? `संदेश नहीं भेजा जा सका। कृपया पुनः प्रयास करें या ${LANDING_CONFIG.SUPPORT_EMAIL} पर संपर्क करें।`
            : "संदेश नहीं भेजा जा सका। कृपया पुनः प्रयास करें।")
      );
    }
  };

  const navLinks = [
    { label: "समस्या-समाधान", href: "#problems" },
    { label: "कैसे काम करता है", href: "#how-it-works" },
    { label: "Demo", href: "#demo" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
    { label: "संपर्क", href: "#contact" },
  ];

  const faqs = [
    {
      q: "क्या ग्राहक को कोई ऐप डाउनलोड करना होगा?",
      a: "नहीं। ग्राहक को कोई ऐप इंस्टॉल नहीं करना पड़ता। वे अपने साधारण फ़ोन कैमरे से काउंटर का QR कोड स्कैन करते हैं और सीधे मोबाइल ब्राउज़र में नाम दर्ज करके Scratch Card रिवॉर्ड पा लेते हैं।",
    },
    {
      q: "क्या शुरुआत करने के लिए पैसे देने होंगे?",
      a: "नहीं। U-Grahak का Free Plan ₹0/महीना में उपलब्ध है। इसमें 100 ग्राहकों की सुरक्षित लिस्ट, दुकान का QR कोड, नए ग्राहक को Scratch Card और मासिक 100 offer recipients शामिल हैं।",
    },
    {
      q: "क्या मैं मोबाइल से अपनी दुकान संभाल सकता हूँ?",
      a: "हाँ। दुकानदार का Dashboard पूरी तरह मोबाइल-फ्रेंडली है। आप अपने फ़ोन से ग्राहक लिस्ट देख सकते हैं, काउंटर पर वाउचर रिडीम कर सकते हैं और नए सामान के offers भेज सकते हैं।",
    },
    {
      q: "क्या मेरा ग्राहक डेटा दूसरी दुकानों को दिखाई देगा?",
      a: "कदापि नहीं। आपका डेटा सिर्फ आपका है। हर दुकान का डेटा पूरी तरह अलग और निजी रहता है; कोई दूसरी दुकान आपकी लिस्ट या विज़िट रिकॉर्ड नहीं देख सकती।",
    },
    {
      q: "Scratch Card Reward कैसे काम करता है?",
      a: "दुकानदार अपने Dashboard में मनपसंद रिवॉर्ड (जैसे 10% छूट या ₹50 डिस्काउंट) तय करता है। ग्राहक QR स्कैन करते ही डिजिटल कार्ड स्क्रैच करके कोड पाता है।",
    },
    {
      q: "Reward बिल पर कैसे Redeem होता है?",
      a: "स्क्रैच करने पर ग्राहक को एक यूनीक कोड (जैसे AG-9842) मिलता है। ग्राहक बिलिंग के समय यह कोड दिखाता है और दुकानदार अपने Dashboard में कोड डालकर तुरंत वेरीफाई कर लेता है।",
    },
    {
      q: "Google Review लिंक कैसे जाता है?",
      a: "चेक-इन के 30 मिनट बाद ग्राहक को आपकी दुकान के Google Maps पेज पर ईमानदार रिव्यू देने का वैकल्पिक लिंक जाता है। Reward के लिए review ज़रूरी नहीं है; review पूरी तरह ईमानदार और स्वैच्छिक होता है।",
    },
    {
      q: "जो ग्राहक 30 दिन तक न आएँ, उन्हें कैसे वापस बुलाएँ?",
      a: "U-Grahak का ऑटोमेशन 30 दिन तक न आने वाले उन ग्राहकों को 'आपकी याद आ रही है' विशेष offer अपने आप भेजता है जिन्होंने अनुमति दी है।",
    },
    {
      q: "नए सामान के Offers ग्राहकों तक कैसे पहुँचते हैं?",
      a: "दुकानदार नए सामान की फोटो और विवरण डालकर एक क्लिक में भेजता है। ऑफ़र केवल उन्हीं ग्राहकों के फ़ोन पर ब्राउज़र अलर्ट (Push Notification) के रूप में पहुँचते हैं जिन्होंने अलर्ट की स्पष्ट अनुमति दी है; जिन्होंने अनुमति ब्लॉक की है, उन्हें अलर्ट नहीं भेजा जा सकता। Android पर यह सीधे ब्राउज़र में काम करता है, जबकि iPhone (iOS) पर वेब अलर्ट पाने के लिए ग्राहक को दुकान के पेज को होम स्क्रीन पर जोड़ना (Add to Home Screen) होता है।",
    },
    {
      q: "Free Plan की सीमा क्या है और Paid Plan में क्या अंतर है?",
      a: "Free Plan में 100 ग्राहक और 100 मासिक offer recipients मिलते हैं। दुकान बढ़ने पर आप Starter (₹499), Growth (₹1,499) या Pro (₹2,999) में अपग्रेड कर सकते हैं।",
    },
  ];

  const hasWhatsApp = Boolean(LANDING_CONFIG.WHATSAPP_NUMBER && LANDING_CONFIG.WHATSAPP_NUMBER.trim());
  const whatsappHref = hasWhatsApp
    ? `https://wa.me/${LANDING_CONFIG.WHATSAPP_NUMBER.trim()}?text=${encodeURIComponent(
        LANDING_CONFIG.WHATSAPP_PREFILLED_MESSAGE
      )}`
    : "";

  const hasSupportEmail = Boolean(LANDING_CONFIG.SUPPORT_EMAIL && LANDING_CONFIG.SUPPORT_EMAIL.trim());

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 selection:bg-emerald-600 selection:text-white font-sans antialiased overflow-x-clip">
      {/* ------------------------------------------------------------- */}
      {/* 1. HEADER & NAVIGATION                                        */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <BrandLogo size="md" priority={true} />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8" aria-label="Main Navigation">
            {navLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-xs font-bold text-slate-700 hover:text-emerald-700 transition-colors py-2"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Desktop Right CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            {hasWhatsApp && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-3.5 py-2.5 rounded-xl transition-colors min-h-[44px]"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>WhatsApp पर बात करें</span>
              </a>
            )}
            <Link
              href="/login"
              className="text-xs font-bold text-slate-700 hover:text-emerald-700 px-3.5 py-2.5 transition-colors rounded-xl min-h-[44px] flex items-center"
            >
              लॉग इन
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] px-5 py-2.5 rounded-xl shadow-xs hover:shadow transition-all min-h-[44px]"
            >
              <span>मुफ़्त में शुरू करें</span>
            </Link>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex items-center gap-2 lg:hidden">
            <Link
              href="/signup"
              className="inline-flex items-center gap-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded-xl min-h-[44px] shadow-xs"
            >
              <span>शुरू करें</span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Navigation Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 shadow-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col space-y-1 divide-y divide-slate-100">
              {navLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  className="py-3 text-sm font-semibold text-slate-800 hover:text-emerald-700 flex items-center justify-between min-h-[48px]"
                >
                  <span>{item.label}</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </a>
              ))}
            </nav>

            <div className="pt-3 border-t border-slate-200 flex flex-col gap-2.5">
              {hasWhatsApp && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleNavClick}
                  className="w-full py-3 px-4 text-center text-sm font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center gap-2 min-h-[48px]"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>WhatsApp पर बात करें</span>
                </a>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={handleNavClick}
                  className="w-full py-3 text-center text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors min-h-[48px] flex items-center justify-center"
                >
                  लॉग इन
                </Link>
                <Link
                  href="/signup"
                  onClick={handleNavClick}
                  className="w-full py-3 text-center text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all min-h-[48px] flex items-center justify-center"
                >
                  मुफ़्त में शुरू करें
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2. HERO SECTION                                               */}
      {/* ------------------------------------------------------------- */}
      <section className="relative pt-10 sm:pt-14 lg:pt-16 pb-14 sm:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-emerald-50/40 via-white to-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left: Main Copy & CTAs */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>दुकानदार / बिज़नेस owner के लिए डिजिटल समाधान</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[46px] xl:text-[50px] font-black text-slate-900 tracking-normal leading-[1.3] sm:leading-[1.25]">
              पहली बार आए ग्राहक को{" "}
              <span className="inline-block sm:block text-emerald-800">
                REPEAT ग्राहक बनाएँ।
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-700 leading-relaxed max-w-xl mx-auto lg:mx-0">
              ग्राहक QR स्कैन करे, Scratch Card जीते, और आप अपने offers सीधे उन ग्राहकों के फ़ोन पर भेजें जिन्होंने अनुमति दी है। ग्राहक को कोई ऐप डाउनलोड नहीं करना।
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3.5 pt-1">
              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-md hover:shadow-emerald-600/25 transition-all active:scale-[0.98] min-h-[52px]"
              >
                <span>मुफ़्त में शुरू करें</span>
                <ArrowRight className="w-5 h-5" />
              </Link>

              <a
                href="#how-it-works"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 font-bold text-base shadow-xs hover:border-slate-300 transition-all active:scale-[0.98] min-h-[52px]"
              >
                <span>देखें कैसे काम करता है</span>
              </a>
            </div>

            {/* Trust line under buttons */}
            <div className="flex items-center justify-center lg:justify-start gap-2 pt-1 text-xs sm:text-sm font-bold text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>₹0 से शुरुआत &middot; 100 ग्राहकों तक हमेशा फ्री &middot; कोई छुपा चार्ज नहीं</span>
            </div>

            {/* Industry heading and chips */}
            <div className="pt-3 space-y-2">
              <p className="text-xs sm:text-sm font-extrabold text-slate-700">
                हर उस दुकान और बिज़नेस के लिए, जिसे दोबारा आने वाले ग्राहक चाहिए
              </p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5 sm:gap-2 text-xs font-bold text-slate-700 max-w-full">
                {LANDING_CONFIG.TARGET_INDUSTRIES.map((industry, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 sm:px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center gap-1.5 whitespace-normal sm:whitespace-nowrap"
                  >
                    {idx === 0 && <Store className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />}
                    {industry}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Hero Composition Visual */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl overflow-hidden border border-slate-200/90 shadow-xl bg-white">
              <div className="relative w-full aspect-[655/330]">
                <Image
                  src="/hero-reference-composition.webp"
                  alt="दुकान के काउंटर पर QR स्टैंडी स्कैन करता ग्राहक और दुकानदार"
                  fill
                  sizes="(max-width: 768px) 100vw, 650px"
                  className="object-cover object-center"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. BEFORE / AFTER BLOCK                                       */}
      {/* ------------------------------------------------------------- */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              QR के बिना और QR के साथ
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              देखें कैसे U-Grahak आपकी दुकान या बिज़नेस को बदलता है।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Left Card: बिना U-Grahak */}
            <div className="bg-rose-50/50 border-2 border-rose-200 rounded-3xl p-6 sm:p-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-rose-100 text-rose-800 text-xs font-black">
                बिना U-Grahak
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                ग्राहक आया, सामान लिया और चला गया
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                दुकान पर रोज़ लोग आते हैं, पर आप उन्हें दोबारा बुला नहीं सकते। कोई लिस्ट नहीं, कोई सीधा संपर्क नहीं।
              </p>
              <div className="p-4 bg-white/80 rounded-2xl border border-rose-100 text-xs text-rose-800 font-medium">
                ✕ नया माल आने पर खबर देने का कोई साधन नहीं<br />
                ✕ कौन सा ग्राहक कब आया, कोई हिसाब नहीं
              </div>
            </div>

            {/* Right Card: U-Grahak के साथ */}
            <div className="bg-emerald-50/60 border-2 border-emerald-300 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black">
                U-Grahak के साथ
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                हर ग्राहक आपकी private लिस्ट में जुड़ा रहता है
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                हर आने वाले ग्राहक का नाम आपकी private लिस्ट में जुड़ जाता है। नया माल आए या ग्राहक 30 दिन न आए, आप एक क्लिक में उन ग्राहकों को offer भेजते हैं जिन्होंने अनुमति दी है।
              </p>
              <div className="p-4 bg-white rounded-2xl border border-emerald-200 text-xs text-emerald-800 font-medium space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>एक क्लिक में नए सामान का offer भेजें</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>30 दिन न आने वाले ग्राहक को अपने आप संदेश</span>
                </div>
              </div>
            </div>
          </div>

          {/* Conditional Numeric Strip (Renders ONLY when genuine metrics provided) */}
          {LANDING_CONFIG.METRIC_STRIP && (
            <div className="mt-8 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs sm:text-sm font-bold text-slate-700">
              {LANDING_CONFIG.METRIC_STRIP.dailyCustomersPlaceholder} &rarr; {LANDING_CONFIG.METRIC_STRIP.monthlyNumbersPlaceholder}
            </div>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. PROBLEMS AND SOLUTIONS (Exactly 5 compact cards)           */}
      {/* ------------------------------------------------------------- */}
      <section id="problems" className="scroll-mt-24 py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-slate-50/80 border-b border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold uppercase">
              समस्या और समाधान
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              दुकानदार की 5 बड़ी समस्याएँ, आसान समाधान
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Card 1 */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-[11px] font-black text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md inline-block">
                  समस्या 1
                </span>
                <h3 className="text-base font-black text-slate-900">ग्राहक दोबारा नहीं आते</h3>
                <p className="text-xs sm:text-sm text-slate-600">नया ग्राहक खरीदारी करके चला जाता है और दोबारा आने का कोई कारण नहीं रहता।</p>
              </div>
              <div className="mt-4 p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                <p className="text-xs font-bold text-emerald-900">
                  समाधान: Scratch Card reward देकर दोबारा आने की वजह दें।
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-[11px] font-black text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md inline-block">
                  समस्या 2
                </span>
                <h3 className="text-base font-black text-slate-900">नए माल की खबर ग्राहक तक नहीं पहुँचती</h3>
                <p className="text-xs sm:text-sm text-slate-600">दुकान पर नया स्टॉक आने पर ग्राहकों को तुरंत बताने का सीधा रास्ता नहीं होता।</p>
              </div>
              <div className="mt-4 p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                <p className="text-xs font-bold text-emerald-900">
                  समाधान: नए Product की photo और offer एक क्लिक में उन ग्राहकों तक पहुँचाएँ जिन्होंने अनुमति दी है।
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-[11px] font-black text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md inline-block">
                  समस्या 3
                </span>
                <h3 className="text-base font-black text-slate-900">ग्राहकों का डेटा डायरी में खो जाता है</h3>
                <p className="text-xs sm:text-sm text-slate-600">कागज़ की डायरियों और पर्चियों में ग्राहकों के नाम खो जाते हैं।</p>
              </div>
              <div className="mt-4 p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                <p className="text-xs font-bold text-emerald-900">
                  समाधान: एक Dashboard में सारी लिस्ट, visits और offers संभालें।
                </p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-[11px] font-black text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md inline-block">
                  समस्या 4
                </span>
                <h3 className="text-base font-black text-slate-900">Google Review माँगने में झिझक होती है</h3>
                <p className="text-xs sm:text-sm text-slate-600">काउंटर पर खड़े ग्राहक से सीधे रिव्यू माँगना असहज लगता है।</p>
              </div>
              <div className="mt-4 p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                <p className="text-xs font-bold text-emerald-900">
                  समाधान: Check-in के 30 मिनट बाद Google Review का सीधा लिंक अपने आप जाता है।
                </p>
              </div>
            </div>

            {/* Card 5 (Full Problem Card for We Miss You) */}
            <div className="bg-white border-2 border-emerald-200 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between md:col-span-2 lg:col-span-1">
              <div className="space-y-2">
                <span className="text-[11px] font-black text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md inline-block">
                  समस्या 5 &middot; विशेष सुविधा
                </span>
                <h3 className="text-base font-black text-slate-900">जो ग्राहक आना बंद कर दें, उन्हें कैसे वापस बुलाएँ?</h3>
                <p className="text-xs sm:text-sm text-slate-600">ग्राहक 1-2 महीने से नहीं आया, पर आपको पता ही नहीं चलता।</p>
              </div>
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <p className="text-xs font-bold text-emerald-900">
                  समाधान: 30 दिन न आने पर &apos;आपकी याद आ रही है&apos; offer अपने आप जाता है।
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. HOW IT WORKS (6 Short Steps in Exact Order)                 */}
      {/* ------------------------------------------------------------- */}
      <section id="how-it-works" className="scroll-mt-24 py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              कैसे काम करता है?
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              सिर्फ 6 आसान स्टेप्स — काउंटर से लेकर repeat बिक्री तक।
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5 items-stretch">
            {/* Step 1 */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center mb-2.5">
                  1
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  ग्राहक काउंटर का QR स्कैन करता है
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  सामान्य फ़ोन कैमरे से (कोई ऐप नहीं)।
                </p>
              </div>
              <div className="mt-3 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                No App Download
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-sky-600 text-white font-black text-xs flex items-center justify-center mb-2.5">
                  2
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  नाम आपकी private लिस्ट में save होता है
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  ग्राहक का नाम सुरक्षित दर्ज हो जाता है।
                </p>
              </div>
              <div className="mt-3 text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-1 rounded-lg">
                Safe Customer List
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center mb-2.5">
                  3
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  ग्राहक को Scratch Card मिलता है
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  कार्ड स्क्रैच करके code बिल पर redeem होता है।
                </p>
              </div>
              <div className="mt-3 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg">
                Scratch &amp; Redeem
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white font-black text-xs flex items-center justify-center mb-2.5">
                  4
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  30 मिनट बाद वैकल्पिक Google Review लिंक जाता है
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  ग्राहक अपने मन से सच्चा रिव्यू दे सकता है।
                </p>
              </div>
              <div className="mt-3 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-1 rounded-lg">
                Honest Google Review
              </div>
            </div>

            {/* Step 5 */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-rose-500 text-white font-black text-xs flex items-center justify-center mb-2.5">
                  5
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Offers + We Miss You
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  नए माल के offers भेजें; 30 दिन न आने वाले को &apos;आपकी याद आ रही है&apos; offer जाता है (जिन्होंने अनुमति दी है)।
                </p>
              </div>
              <div className="mt-3 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded-lg">
                Automatic Re-engagement
              </div>
            </div>

            {/* Step 6 */}
            <div className="bg-emerald-50/70 border-2 border-emerald-300 rounded-3xl p-4 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center mb-2.5">
                  6
                </div>
                <h3 className="text-sm font-bold text-emerald-950 mb-1">
                  ग्राहक दोबारा दुकान पर आता है
                </h3>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  Repeat बिक्री बढ़ती है और ग्राहक वफादार बनता है।
                </p>
              </div>
              <div className="mt-3 text-[11px] font-bold text-emerald-800 bg-white px-2 py-1 rounded-lg border border-emerald-200">
                Repeat Customer!
              </div>
            </div>
          </div>

          {/* Privacy & Compliance Highlight */}
          <div className="mt-10 p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm font-bold text-slate-700">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>आपका डेटा सिर्फ आपका है, दूसरी दुकानें नहीं देख सकतीं।</span>
            </div>
            <div className="text-emerald-700 font-semibold text-xs">
              ग्राहक की अनुमति (consent) के बाद ही offers भेजे जाते हैं।
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 6. DEMO SECTION (Tabs: दुकानदार का Dashboard & ग्राहक की स्क्रीन) */}
      {/* ------------------------------------------------------------- */}
      <section id="demo" className="scroll-mt-24 py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-slate-50/80 border-b border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase">
              लाइव अनुभव
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              देखें U-Grahak कैसे दिखता है
            </h2>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <button
              type="button"
              onClick={() => setDemoTab("merchant")}
              className={`px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all min-h-[48px] ${
                demoTab === "merchant"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              दुकानदार का Dashboard
            </button>
            <button
              type="button"
              onClick={() => setDemoTab("customer")}
              className={`px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all min-h-[48px] ${
                demoTab === "customer"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              ग्राहक की स्क्रीन
            </button>
          </div>

          {/* Tab Content */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs max-w-3xl mx-auto">
            {demoTab === "merchant" ? (
              <div className="space-y-5">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div className="font-black text-slate-900 text-base">
                    दुकानदार का Dashboard
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                    आसान मैनेजमेंट
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                    <span className="text-xs text-slate-500 font-medium block">कुल ग्राहक</span>
                    <span className="text-lg font-black text-slate-900">124</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                    <span className="text-xs text-slate-500 font-medium block">आज के चेक-इन</span>
                    <span className="text-lg font-black text-emerald-700">18</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                    <span className="text-xs text-slate-500 font-medium block">Active Rewards</span>
                    <span className="text-lg font-black text-indigo-700">10% Off</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">Reward Code Redeem करें</div>
                      <div className="text-slate-500 text-[11px]">ग्राहक का कोड जाँचें (उदा. AG-9842)</div>
                    </div>
                    <span className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl font-bold">
                      Verify &amp; Redeem
                    </span>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">नया Offer भेजें</div>
                      <div className="text-slate-500 text-[11px]">अनुमति प्राप्त ग्राहकों को photo + छूट का विवरण</div>
                    </div>
                    <span className="px-3 py-1.5 bg-slate-900 text-white rounded-xl font-bold">
                      Send Offer
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div className="font-black text-slate-900 text-base">
                    ग्राहक की मोबाइल स्क्रीन
                  </div>
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg">
                    बिना किसी ऐप के
                  </span>
                </div>

                <div className="p-5 bg-gradient-to-tr from-amber-50 to-orange-50 border border-amber-200 rounded-2xl text-center space-y-2">
                  <span className="text-xs font-black text-amber-900 uppercase tracking-wider block">
                    🎁 आपका स्क्रैच कार्ड रिवॉर्ड
                  </span>
                  <div className="text-lg font-black text-amber-950">
                    10% Off आपकी खरीदारी पर
                  </div>
                  <div className="inline-block px-4 py-1.5 bg-white border border-amber-300 rounded-xl font-mono font-black text-slate-900 text-sm shadow-xs">
                    AG-9842
                  </div>
                  <p className="text-[11px] text-amber-800">बिलिंग के समय यह कोड काउंटर पर दिखाएँ</p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <div>
                      <div className="font-bold text-slate-900">Google Review (वैकल्पिक)</div>
                      <div className="text-[11px] text-slate-500">Reward के लिए review ज़रूरी नहीं है</div>
                    </div>
                  </div>
                  <span className="font-bold text-slate-600 underline">Review Link &rarr;</span>
                </div>
              </div>
            )}

            {/* Video Demo Slot (Renders ONLY if real embed URL is configured) */}
            {LANDING_CONFIG.DEMO_VIDEO_URL && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900">
                  <iframe
                    src={LANDING_CONFIG.DEMO_VIDEO_URL}
                    title="U-Grahak Video Demo"
                    className="w-full h-full border-0"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 7. TESTIMONIALS (Conditional - Renders ONLY when non-empty)    */}
      {/* ------------------------------------------------------------- */}
      {LANDING_CONFIG.TESTIMONIALS.length > 0 && (
        <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                दुकानदारों का अनुभव
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {LANDING_CONFIG.TESTIMONIALS.map((item, idx) => (
                <div key={idx} className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
                  <p className="text-sm text-slate-700 italic">&ldquo;{item.quote}&rdquo;</p>
                  <div className="text-xs font-bold text-slate-900">
                    {item.ownerName} &middot; <span className="text-slate-500">{item.shopName}, {item.city}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 8. PRICING (4 Plans strictly matching src/lib/billing/plans.ts)*/}
      {/* ------------------------------------------------------------- */}
      <section id="pricing" className="scroll-mt-24 py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase">
              पारदर्शी मूल्य
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              मुफ़्त में शुरू करें। दुकान के साथ आगे बढ़ें।
            </h2>
            <p className="text-sm sm:text-base text-slate-600 font-semibold">
              एक महीने में एक repeat ग्राहक की बिक्री से ही आपके plan का पैसा निकल सकता है।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {/* Free Plan */}
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900">Free</h3>
                  <span className="text-[11px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                    हमेशा फ्री
                  </span>
                </div>

                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">₹0</span>
                  <span className="text-xs font-semibold text-slate-500">/ महीना</span>
                </div>

                <p className="text-xs text-emerald-700 font-bold mt-2">
                  100 ग्राहक की लिस्ट
                </p>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>दुकान का QR और check-in</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>महीने में 100 offer recipients</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>नए ग्राहक को Scratch Card</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Google Review लिंक</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Basic Dashboard</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <Link
                  href={LANDING_CONFIG.PLANS.FREE.ctaHref}
                  className="w-full py-3.5 px-4 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs min-h-[48px]"
                >
                  <span>{LANDING_CONFIG.PLANS.FREE.ctaText}</span>
                </Link>
              </div>
            </div>

            {/* Starter Plan */}
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900">Starter</h3>
                  <span className="text-[11px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                    स्मॉल स्टोर
                  </span>
                </div>

                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">₹499</span>
                  <span className="text-xs font-semibold text-slate-500">/ महीना</span>
                </div>

                <p className="text-xs text-slate-700 font-bold mt-2">
                  1,500 ग्राहक की लिस्ट
                </p>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-start gap-2 font-bold text-slate-900">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Free की सभी सुविधाएँ +</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>मासिक offer campaigns (1,500 ग्राहकों तक)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>ग्राहक विज़िट हिस्ट्री व ट्रैकिंग</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>ऑफ़र हिस्ट्री और स्टैंडर्ड सपोर्ट</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <Link
                  href={LANDING_CONFIG.PLANS.STARTER.ctaHref}
                  className="w-full py-3.5 px-4 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors bg-slate-900 hover:bg-slate-800 text-white shadow-xs min-h-[48px]"
                >
                  <span>{LANDING_CONFIG.PLANS.STARTER.ctaText}</span>
                </Link>
              </div>
            </div>

            {/* Growth Plan (सबसे लोकप्रिय) */}
            <div className="bg-white border-2 border-emerald-600 rounded-3xl p-6 flex flex-col justify-between shadow-md relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-0.5 rounded-full shadow-xs">
                सबसे लोकप्रिय
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900">Growth</h3>
                  <span className="text-[11px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                    ग्रोइंग स्टोर
                  </span>
                </div>

                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">₹1,499</span>
                  <span className="text-xs font-semibold text-slate-500">/ महीना</span>
                </div>

                <p className="text-xs text-emerald-700 font-bold mt-2">
                  5,000 ग्राहक की लिस्ट
                </p>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-start gap-2 font-bold text-slate-900">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Starter की सभी सुविधाएँ +</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>मासिक offer campaigns (5,000 ग्राहकों तक)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span>Nearby Offers (दुकान से 100–200m)</span>
                      <span className="block text-[11px] text-slate-500 mt-0.5">
                        ग्राहक दुकान के पास पहुँचकर दुकान का पेज खोले और लोकेशन की अनुमति दे, तो उसे offer दिखता है।
                      </span>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <Link
                  href={LANDING_CONFIG.PLANS.GROWTH.ctaHref}
                  className="w-full py-3.5 px-4 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs min-h-[48px]"
                >
                  <span>{LANDING_CONFIG.PLANS.GROWTH.ctaText}</span>
                </Link>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900">Pro</h3>
                  <span className="text-[11px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                    बड़ी दुकान
                  </span>
                </div>

                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">₹2,999</span>
                  <span className="text-xs font-semibold text-slate-500">/ महीना</span>
                </div>

                <p className="text-xs text-slate-700 font-bold mt-2">
                  10,000 ग्राहक की लिस्ट
                </p>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-start gap-2 font-bold text-slate-900">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Growth की सभी सुविधाएँ +</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>मासिक offer campaigns (10,000 ग्राहकों तक)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span>Business Growth Insights</span>
                      <span className="block text-[11px] text-slate-500 mt-0.5">
                        &quot;कौन कितनी बार आया, कौन गायब है&quot; रिपोर्ट
                      </span>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>उन्नत Repeat Customer Tracking</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <Link
                  href={LANDING_CONFIG.PLANS.PRO.ctaHref}
                  className="w-full py-3.5 px-4 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors bg-slate-900 hover:bg-slate-800 text-white shadow-xs min-h-[48px]"
                >
                  <span>{LANDING_CONFIG.PLANS.PRO.ctaText}</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Refund policy compliance disclaimer */}
          <div className="mt-8 text-center text-xs text-slate-500">
            कोई छुपा चार्ज नहीं &middot; कभी भी बंद करें (महीने के अंत तक सेवा चालू रहेगी)
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 9. FAQ ACCORDION                                              */}
      {/* ------------------------------------------------------------- */}
      <section id="faq" className="scroll-mt-24 py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-slate-50/80 border-b border-slate-200">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase">
              FAQ
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              अक्सर पूछे जाने वाले सवाल
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors min-h-[48px]"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-emerald-600" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
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
      {/* 10. CONTACT / SUPPORT SECTION                                 */}
      {/* ------------------------------------------------------------- */}
      <section id="contact" className="scroll-mt-24 py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase">
              संपर्क सहायता
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              हम आपकी दुकान की मदद के लिए तैयार हैं
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Direct Channels (Rendered ONLY if user configures them) */}
            <div className="lg:col-span-5 space-y-4">
              {/* WhatsApp Support Card */}
              {hasWhatsApp && (
                <div className="p-6 rounded-3xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-base">
                    <MessageCircle className="w-5 h-5 text-emerald-600" />
                    <span>WhatsApp पर तुरंत बात करें</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    QR कोड, Scratch Card सेटअप या किसी भी सवाल के लिए हमें WhatsApp करें।
                  </p>
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors min-h-[48px]"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp चैट शुरू करें &rarr;</span>
                  </a>
                </div>
              )}

              {/* Email Support Card */}
              {hasSupportEmail && (
                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <Mail className="w-4 h-4 text-emerald-600" />
                    <span>Email Support Desk</span>
                  </div>
                  <a
                    href={`mailto:${LANDING_CONFIG.SUPPORT_EMAIL}`}
                    className="text-xs font-bold text-emerald-700 font-mono block hover:underline"
                  >
                    {LANDING_CONFIG.SUPPORT_EMAIL}
                  </a>
                  <div className="text-[11px] text-slate-500 space-y-1 pt-1">
                    <div>समय: सोमवार से शनिवार, 10:00 AM &ndash; 6:00 PM IST</div>
                    <div>जवाब: 24–48 घंटों के भीतर</div>
                  </div>
                </div>
              )}

              {/* Operating Info */}
              <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
                <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Store className="w-4 h-4 text-emerald-600" />
                  <span>U-Grahak बिज़नेस सहायता</span>
                </div>
                <p>
                  काउंटर QR स्टैंडी डाउनलोड करने, स्क्रैच कार्ड तय करने या बिलिंग से जुड़े किसी भी सवाल के लिए संपर्क फ़ॉर्म भरें।
                </p>
              </div>
            </div>

            {/* Right Column: Validated Contact Form */}
            <div className="lg:col-span-7 bg-slate-50/60 border border-slate-200 rounded-3xl p-6 sm:p-8">
              <h3 className="text-lg font-black text-slate-900 mb-1">संदेश भेजें</h3>
              <p className="text-xs text-slate-500 mb-5">
                अपनी जानकारी भरें, हमारी सहायता टीम आपसे संपर्क करेगी।
              </p>

              {contactStatus === "success" ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                  <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-emerald-900">संदेश प्राप्त हुआ!</h4>
                  <p className="text-xs text-emerald-800">{contactResponseMsg}</p>
                  <button
                    type="button"
                    onClick={() => setContactStatus("idle")}
                    className="mt-2 text-xs font-bold text-emerald-800 underline"
                  >
                    नया संदेश लिखें
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  {contactStatus === "error" && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                      {contactErrorText}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        आपका नाम <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="उदा. राहुल शर्मा"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white min-h-[44px]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        दुकान का नाम
                      </label>
                      <input
                        type="text"
                        value={contactBusinessName}
                        onChange={(e) => setContactBusinessName(e.target.value)}
                        placeholder="उदा. शर्मा किराना"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        मोबाइल या Email <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={contactInfo}
                        onChange={(e) => setContactInfo(e.target.value)}
                        placeholder="संपर्क विवरण (फोन या ईमेल)"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white min-h-[44px]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        सहायता विषय
                      </label>
                      <select
                        value={contactTopic}
                        onChange={(e) => setContactTopic(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-slate-800 min-h-[44px]"
                      >
                        <option value="QR Code & Scratch Card Setup">QR कोड व Scratch Card</option>
                        <option value="Send Offer & Product Photos">Offers भेजना</option>
                        <option value="Billing & Plans">प्लान और बिलिंग</option>
                        <option value="Other Assistance">अन्य सहायता</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      संदेश <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={contactMsg}
                      onChange={(e) => setContactMsg(e.target.value)}
                      placeholder="आपकी दुकान के बारे में सवाल..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={contactStatus === "loading"}
                    className="w-full sm:w-auto px-7 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-sm shadow-xs transition-colors min-h-[48px]"
                  >
                    {contactStatus === "loading" ? "भेजा जा रहा है..." : "संदेश भेजें →"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 11. FINAL HIGH-CONTRAST CTA                                   */}
      {/* ------------------------------------------------------------- */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-5 relative z-10">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-snug">
            अब अपनी दुकान या बिज़नेस के ग्राहकों को दोबारा बुलाना शुरू करें।
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
            100 ग्राहकों तक हमेशा फ्री। बिना ऐप डाउनलोड किए दुकानदार / बिज़नेस owner के लिए आसान डिजिटल ग्राहक प्रबंधन।
          </p>
          <div className="pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base shadow-lg shadow-emerald-600/30 transition-all active:scale-[0.98] min-h-[52px]"
            >
              <span>मुफ़्त में शुरू करें</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 12. FOOTER                                                    */}
      {/* ------------------------------------------------------------- */}
      <footer className="border-t border-slate-200 bg-white text-slate-600 pb-20 sm:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-slate-100">
            {/* Brand & Purpose */}
            <div className="md:col-span-5 space-y-3">
              <Link href="/" className="inline-flex items-center gap-2.5">
                <BrandLogo size="md" />
              </Link>
              <div className="text-sm font-bold text-slate-900">
                हर ग्राहक दोबारा आए।
              </div>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm">
                हर लोकल बिज़नेस और दुकान के लिए आसान QR चेक-इन और रिपीट कस्टमर समाधान।
              </p>
            </div>

            {/* Links */}
            <div className="md:col-span-3 space-y-2">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                सुविधाएँ
              </h4>
              <ul className="space-y-2 text-xs font-semibold text-slate-600">
                <li><a href="#problems" className="hover:text-emerald-700">समस्या-समाधान</a></li>
                <li><a href="#how-it-works" className="hover:text-emerald-700">कैसे काम करता है</a></li>
                <li><a href="#demo" className="hover:text-emerald-700">Demo</a></li>
                <li><a href="#pricing" className="hover:text-emerald-700">Pricing</a></li>
                <li><a href="#faq" className="hover:text-emerald-700">FAQ</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div className="md:col-span-4 space-y-2">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                कानूनी और सहायता
              </h4>
              <ul className="space-y-2 text-xs font-semibold text-slate-600">
                <li><Link href="/privacy-policy" className="hover:text-emerald-700">गोपनीयता नीति (Privacy Policy)</Link></li>
                <li><Link href="/terms" className="hover:text-emerald-700">नियम और शर्तें (Terms)</Link></li>
                <li><Link href="/refund-policy" className="hover:text-emerald-700">रिफंड नीति (Refund Policy)</Link></li>
                <li><Link href="/contact" className="hover:text-emerald-700">संपर्क (Contact)</Link></li>
                <li><Link href="/login" className="hover:text-emerald-700">लॉग इन (Login)</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>डेटा सुरक्षा: आपका डेटा सिर्फ आपका है, दूसरी दुकानें नहीं देख सकतीं।</span>
            </div>
            <p className="text-[11px] text-slate-400">
              &copy; {new Date().getFullYear()} U-Grahak. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* ------------------------------------------------------------- */}
      {/* 13. FLOATING WHATSAPP BUTTON (Rendered ONLY when hasWhatsApp) */}
      {/* ------------------------------------------------------------- */}
      {hasWhatsApp && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-5 right-5 z-40 bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center min-h-[52px] min-w-[52px] active:scale-95"
          aria-label="WhatsApp सहायता"
        >
          <MessageCircle className="w-6 h-6" />
        </a>
      )}
    </div>
  );
}
