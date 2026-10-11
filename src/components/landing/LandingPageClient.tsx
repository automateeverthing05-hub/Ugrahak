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
  Menu,
  X,
  TrendingUp,
  MessageSquare,
  Smartphone,
  Eye,
  Camera,
  Layers,
  Store,
  Clock,
  Mail,
  HelpCircle,
  Award,
  Zap,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";

export function LandingPageClient() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Contact Form State
  const [contactName, setContactName] = useState("");
  const [contactBusinessName, setContactBusinessName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [contactTopic, setContactTopic] = useState("QR Code & Scratch Card Setup");
  const [contactMsg, setContactMsg] = useState("");
  const [contactStatus, setContactStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [contactErrorText, setContactErrorText] = useState("");

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

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactName,
          businessName: contactBusinessName,
          contact: contactInfo,
          topic: contactTopic,
          message: contactMsg,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "संदेश भेजने में विफल रहे।");
      }

      setContactStatus("success");
      setContactName("");
      setContactBusinessName("");
      setContactInfo("");
      setContactMsg("");
    } catch (err: unknown) {
      setContactStatus("error");
      setContactErrorText(
        err instanceof Error
          ? err.message
          : "संदेश नहीं भेजा जा सका। कृपया पुनः प्रयास करें या supportugrahak@gmail.com पर संपर्क करें।"
      );
    }
  };

  const navLinks = [
    { label: "Local Business की Problems", href: "#problems" },
    { label: "कैसे काम करता है?", href: "#how-it-works" },
    { label: "Shop Owner कैसे Use करेगा?", href: "#for-shop-owners" },
    { label: "Pricing", href: "#pricing" },
    { label: "Questions & Answers", href: "#faq" },
    { label: "Contact Us", href: "#contact" },
  ];

  const faqs = [
    {
      q: "क्या Customer को ऐप डाउनलोड करना होगा?",
      a: "नहीं, बिल्कुल नहीं। Customer को कोई ऐप इंस्टॉल करने की ज़रूरत नहीं है। वे अपने सामान्य स्मार्टफोन कैमरे से आपकी दुकान का QR Code स्कैन करते हैं और सीधे मोबाइल ब्राउज़र में Scratch Card और Offers देख लेते हैं।",
    },
    {
      q: "क्या शुरुआत करने के लिए पैसे देने होंगे?",
      a: "नहीं। U-Grahak का Free Plan ₹0/महीने से शुरू होता है। इसमें 100 Customers और हर महीने 100 Offer Recipients की सुविधा बिना किसी शुल्क के मिलती है। जब आपकी दुकान और Customer आधार बढ़े, तब आप अपनी सुविधानुसार अपग्रेड कर सकते हैं।",
    },
    {
      q: "क्या मैं मोबाइल से अपना Business Manage कर सकता हूँ?",
      a: "हाँ। U-Grahak का Merchant Dashboard मोबाइल फ्रेंडली है। आप अपने स्मार्टफोन से ही Customer List देख सकते हैं, नए Scratch Card Rewards तय कर सकते हैं और नए Products की Photos अपलोड करके Offers भेज सकते हैं।",
    },
    {
      q: "क्या मेरा Customer Data दूसरी दुकानों को दिखाई देगा?",
      a: "कदापि नहीं। आपका Customer Data पूरी तरह निजी और सुरक्षित है। किसी भी दूसरी दुकान या तीसरे पक्ष को आपके ग्राहकों के नाम, नंबर या विज़िट डेटा का एक्सेस नहीं होता।",
    },
    {
      q: "Scratch Card Offer कैसे काम करता है?",
      a: "दुकानदार अपने Dashboard में Rewards (जैसे 10% डिस्काउंट, फ्री गिफ्ट या कूपन) सेट करता है। जब नया Customer काउंटर पर लगा QR Code स्कैन करके पहली बार चेक-इन करता है, तो उसे स्क्रीन पर एक डिजिटल Scratch Card मिलता है जिसे स्क्रैच करके वह अपना Reward पा सकता है।",
    },
    {
      q: "नए Product के Offers Customers तक कैसे भेजें?",
      a: "जब भी दुकान पर नया Stock या Product आए, आप उसकी Photo अपलोड करें, Offer लिखें और 'Send Offer' पर क्लिक करें। जिन Customers ने चेक-इन के दौरान नोटिफिकेशन की अनुमति दी है, उन्हें सीधे उनके फोन पर अलर्ट प्राप्त होता है। (Free Plan में 100 recipients/माह सीमा लागू है)।",
    },
    {
      q: "Google Reviews Automation कैसे काम करता है?",
      a: "Customer के चेक-इन और Scratch Card पूरा होने के बाद, U-Grahak आपकी दुकान के Google Business Review पेज का सीधा लिंक दिखाता है और उन्हें रिव्यू साझा करने के लिए आमंत्रित करता है। Customer अपनी स्वेच्छा से 1-क्लिक में Google पर रिव्यू दे सकते हैं।",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 selection:bg-indigo-600 selection:text-white font-sans antialiased">
      {/* ------------------------------------------------------------- */}
      {/* PART 5 — HEADER AND NAVIGATION                                */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between">
          {/* Left: Brand Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <BrandLogo size="md" priority={true} />
          </Link>

          {/* Center: Desktop Navigation CTAs (6 Exact Items in Order) */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-7" aria-label="Main Navigation">
            {navLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-[13px] font-semibold text-slate-700 hover:text-indigo-600 transition-colors py-1 scroll-smooth"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Right: Auth CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-700 hover:text-indigo-600 px-3 py-2 transition-colors rounded-xl"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] px-4.5 py-2.5 rounded-xl shadow-sm hover:shadow transition-all"
            >
              <span>Start Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <Link
              href="/signup"
              className="inline-flex items-center gap-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-lg"
            >
              <span>Start Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Toggle navigation menu"
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
                  className="py-2.5 text-sm font-semibold text-slate-800 hover:text-indigo-600 flex items-center justify-between"
                >
                  <span>{item.label}</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </a>
              ))}
            </nav>

            <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={handleNavClick}
                className="w-full py-2.5 text-center text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Login
              </Link>
              <Link
                href="/signup"
                onClick={handleNavClick}
                className="w-full py-3 text-center text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <span>Start Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ------------------------------------------------------------- */}
      {/* PART 6 — HERO SECTION                                         */}
      {/* ------------------------------------------------------------- */}
      <section className="relative pt-10 sm:pt-16 lg:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100/60 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          {/* Left Column: Main Message & Exact Dual CTAs */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            {/* Small Label */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
              <span>SMART TOOL FOR LOCAL BUSINESSES</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-[52px] font-black text-slate-900 tracking-tight leading-[1.18]">
              अब हर नया Customer बनेगा आपका{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                Repeat Customer।
              </span>
            </h1>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
              अपने Customers को जोड़ें, Scratch Card Offers दें और नए Products की Photos व Offers एक क्लिक में भेजकर उन्हें बार-बार अपनी दुकान पर आने के लिए प्रेरित करें।
            </p>

            {/* Two Start Free CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3.5 pt-2">
              {/* CTA 1 */}
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-base shadow-md hover:shadow-indigo-500/25 transition-all active:scale-[0.98]"
              >
                <span>Start Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* CTA 2 */}
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 border-2 border-slate-300 font-extrabold text-base shadow-xs hover:border-indigo-400 transition-all active:scale-[0.98]"
              >
                <span>Start Free — ₹0 से शुरू करें</span>
                <ArrowRight className="w-4 h-4 text-indigo-600" />
              </Link>
            </div>

            {/* Supporting Trust Line */}
            <div className="flex items-center justify-center lg:justify-start gap-2 pt-2 text-xs sm:text-sm font-semibold text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>₹0 से शुरुआत &middot; Customer को ऐप डाउनलोड करने की ज़रूरत नहीं</span>
            </div>

            {/* Target Audience Badges */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-2 text-xs font-semibold text-slate-500">
              <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg">Kirana Stores</span>
              <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg">Clothing Shops</span>
              <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg">Salons</span>
              <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg">Cafés &amp; Restaurants</span>
            </div>
          </div>

          {/* Right Column: Product Showcase Dashboard Preview */}
          <div className="lg:col-span-6 relative">
            {/* Glow backdrop */}
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-3xl blur-2xl -z-10" />

            <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
              {/* Mockup Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-base shadow-sm">
                    U
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 leading-tight">
                      Royal Fashion Store
                    </h2>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Sample Store Profile &middot; Free Plan
                    </p>
                  </div>
                </div>

                <div className="px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-wider">
                  UI Preview Mockup
                </div>
              </div>

              {/* Stat Cards Grid */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Total Customers</span>
                    <Users className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">84</div>
                  <div className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    +18 this week
                  </div>
                </div>

                <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Shop QR Code</span>
                    <QrCode className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-1 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Active on Counter
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Scan for Scratch Card</div>
                </div>
              </div>

              {/* Layered Showcase: Scratch Card & Product Offer */}
              <div className="space-y-3">
                {/* Scratch Card Preview */}
                <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                      <Gift className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-amber-950">Customer Scratch Card Reward</div>
                      <div className="text-[11px] text-amber-800 font-medium">Flat 10% Off On Next Bill</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2.5 py-1 rounded-lg">
                    Auto-Reward
                  </span>
                </div>

                {/* Mobile Notification Preview */}
                <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-md border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="inline-flex items-center gap-1.5 font-bold text-indigo-400">
                      <Smartphone className="w-3.5 h-3.5" />
                      Customer Phone Notification
                    </span>
                    <span>Just Now</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white">आज का खास Offer!</h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      नया Product आ गया है। आज ही दुकान पर आएँ और 15% की छूट पाएँ।
                    </p>
                  </div>
                  <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800">
                    <span>Delivered via U-Grahak</span>
                    <span className="text-emerald-400 font-bold">1-Click Broadcast</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* PART 7 — CTA 1: LOCAL BUSINESS PROBLEMS (ID: problems)       */}
      {/* ------------------------------------------------------------- */}
      <section id="problems" className="scroll-mt-24 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold tracking-wide uppercase">
              Local Business की Problems
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Local Business की 4 बड़ी Problems, अब एक ही Solution।
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Customers से जुड़े रहना, Repeat Visits बढ़ाना और नए Products के Offers पहुँचाना आसान बनाएँ।
            </p>
          </div>

          {/* 4 Premium Problem-Solution Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* Card 1 */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-rose-100 text-rose-800 text-xs font-bold">
                  Problem 1
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  Customers दोबारा नहीं आते
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  नया ग्राहक एक बार सामान खरीदकर चला जाता है और दोबारा आने का कोई ठोस कारण नहीं रहता।
                </p>

                <div className="pt-2 p-4 bg-white border border-indigo-100 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                    <Gift className="w-4 h-4 text-indigo-600" />
                    <span>Solution: Repeat Customer System</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Scratch Card Rewards और Special Offers के ज़रिए Customers को दोबारा खरीदारी के लिए प्रेरित करें।
                  </p>
                </div>
              </div>

              {/* Visual Mockup */}
              <div className="mt-6 p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center font-bold text-indigo-600">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Digital Scratch Card</div>
                    <div className="text-[11px] text-slate-500">Scratch &amp; Win Reward on Bill</div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                  Active
                </span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-rose-100 text-rose-800 text-xs font-bold">
                  Problem 2
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  Google Reviews पाना मुश्किल है
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  ग्राहकों से सीधे रिव्यू मांगने में झिझक होती है और अधिकांश ग्राहक भूल जाते हैं।
                </p>

                <div className="pt-2 p-4 bg-white border border-indigo-100 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                    <Star className="w-4 h-4 text-indigo-600" />
                    <span>Solution: Google Review Invitation Link</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Google Review link के ज़रिए Customers को आसानी से अपना अनुभव साझा करने के लिए आमंत्रित करें।
                  </p>
                </div>
              </div>

              {/* Visual Mockup */}
              <div className="mt-6 p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center font-bold text-amber-600">
                    <Star className="w-5 h-5 fill-amber-500" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Google Review Invitation</div>
                    <div className="text-[11px] text-slate-500">Tap to Rate on Google Maps</div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                  1-Click Link
                </span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-rose-100 text-rose-800 text-xs font-bold">
                  Problem 3
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  नए Products की जानकारी Customers तक नहीं पहुँचती
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  दुकान पर नया माल आने पर ग्राहकों को सूचित करने का कोई तेज़ व सीधा साधन नहीं होता।
                </p>

                <div className="pt-2 p-4 bg-white border border-indigo-100 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                    <Send className="w-4 h-4 text-indigo-600" />
                    <span>Solution: One-Click Product Promotion</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    नए Products की Photos और Offers एक क्लिक में अपने उपलब्ध Customer audience तक पहुँचाएँ।
                  </p>
                </div>
              </div>

              {/* Visual Mockup */}
              <div className="mt-6 p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center font-bold text-violet-600">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">New Product Photo &amp; Offer</div>
                    <div className="text-[11px] text-slate-500">Sent instantly to customer list</div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-md">
                  Broadcast
                </span>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-rose-100 text-rose-800 text-xs font-bold">
                  Problem 4
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  Customer Data और Offers Manage करना मुश्किल है
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  कागज़ की डायरियों या बिखरे फोन नंबरों में ग्राहक डेटा खो जाता है और फॉलो-अप नहीं हो पाता।
                </p>

                <div className="pt-2 p-4 bg-white border border-indigo-100 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>Solution: All-in-One Dashboard</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Customer List और उपलब्ध Offers को एक ही Dashboard से Manage करें।
                  </p>
                </div>
              </div>

              {/* Visual Mockup */}
              <div className="mt-6 p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center font-bold text-emerald-600">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Customer Management</div>
                    <div className="text-[11px] text-slate-500">Search, Track Visits &amp; Redeem</div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                  Unified
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* PART 8 — CTA 2: HOW U-GRAHAK WORKS (ID: how-it-works)         */}
      {/* ------------------------------------------------------------- */}
      <section id="how-it-works" className="scroll-mt-24 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50/80 border-b border-slate-200">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold tracking-wide uppercase">
              कैसे काम करता है?
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              U-Grahak कैसे काम करता है?
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              अपनी दुकान को QR Code, Scratch Card Offers और Customer communication के साथ शुरू करें।
            </p>
          </div>

          {/* 4 Connected Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-sm mb-4">
                  1
                </div>
                <h3 className="text-base font-black text-slate-900 mb-2">
                  Business Profile बनाएँ
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  अपनी जानकारी दर्ज करके U-Grahak पर अपनी Business Profile बनाएँ।
                </p>
              </div>

              {/* Step 1 Visual */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-[11px] space-y-1.5">
                  <div className="font-bold text-slate-800">Shop Profile Form</div>
                  <div className="text-slate-500">Shop Name &middot; Category &middot; Counter QR</div>
                  <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <Check className="w-3.5 h-3.5" /> Ready in 2 Minutes
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-sm mb-4">
                  2
                </div>
                <h3 className="text-base font-black text-slate-900 mb-2">
                  Scratch Card Offers सेट करें
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Scratch Card option में अपनी दुकान के लिए उपलब्ध Offers और Rewards सेट करें।
                </p>
              </div>

              {/* Step 2 Visual */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-[11px] space-y-1.5">
                  <div className="font-bold text-amber-950">Reward Configuration</div>
                  <div className="text-amber-800">10% Off &middot; ₹50 Coupon &middot; Free Treat</div>
                  <div className="flex items-center gap-1 text-amber-900 font-semibold">
                    <Sparkles className="w-3.5 h-3.5" /> Instant Customer Engagement
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-sm mb-4">
                  3
                </div>
                <h3 className="text-base font-black text-slate-900 mb-2">
                  QR Code लगाएँ
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  U-Grahak द्वारा उपलब्ध कराया गया QR Code डाउनलोड या प्रिंट करें और अपनी दुकान के Counter पर लगाएँ। Customer QR Code Scan करके उपलब्ध Offer या Scratch Card तक पहुँच सकेगा।
                </p>
              </div>

              {/* Step 3 Visual */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-200/80 text-[11px] space-y-1.5">
                  <div className="font-bold text-indigo-950">Counter QR Standee</div>
                  <div className="text-indigo-800">Scan via Any Phone Camera</div>
                  <div className="flex items-center gap-1 text-indigo-700 font-semibold">
                    <QrCode className="w-3.5 h-3.5" /> Zero App Download Required
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-sm mb-4">
                  4
                </div>
                <h3 className="text-base font-black text-slate-900 mb-2">
                  Offers भेजें
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  नए Products, Photos और Special Offers Customers तक भेजें, जहाँ यह सुविधा आपके मौजूदा U-Grahak product में उपलब्ध है।
                </p>
              </div>

              {/* Step 4 Visual */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="p-3 bg-violet-50 rounded-2xl border border-violet-200/80 text-[11px] space-y-1.5">
                  <div className="font-bold text-violet-950">Product Campaign</div>
                  <div className="text-violet-800">Image Upload + Notification Text</div>
                  <div className="flex items-center gap-1 text-violet-700 font-semibold">
                    <Send className="w-3.5 h-3.5" /> 1-Click Customer Alert
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contextual CTA */}
          <div className="mt-12 text-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-base shadow-sm hover:shadow transition-all"
            >
              <span>Start Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* PART 9 — CTA 3: HOW SHOP OWNERS USE U-GRAHAK (for-shop-owners) */}
      {/* ------------------------------------------------------------- */}
      <section id="for-shop-owners" className="scroll-mt-24 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-bold tracking-wide uppercase">
              Shop Owner कैसे Use करेगा?
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Shop Owner के लिए U-Grahak Use करना आसान है।
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Profile बनाने से लेकर Scratch Card Offers सेट करने और नए Products का प्रचार करने तक, पूरा Workflow समझें।
            </p>
          </div>

          {/* Detailed Merchant-Focused 4-Step Cards */}
          <div className="space-y-12">
            {/* Step 1: Merchant Profile */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-100 text-indigo-800 text-xs font-bold">
                  Step 1 &middot; Onboarding
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  अपनी Business Profile बनाएँ
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  अपनी दुकान की जानकारी दर्ज करें और U-Grahak पर Profile बनाएँ। अपनी दुकान का नाम, श्रेणी और संपर्क जानकारी सेट करें। तुरंत आपका यूनीक QR Code जनरेट हो जाता है।
                </p>
                <ul className="space-y-2 text-xs font-medium text-slate-700">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    दुकान का नाम और श्रेणी चुनें
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    काउंटर के लिए हाई-रिज़ॉल्यूशन QR Code डाउनलोड करें
                  </li>
                </ul>
              </div>

              {/* Mockup Preview */}
              <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-800">Business Profile Form</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Verified</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500">Business Name</label>
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900">
                      Sharma Kirana &amp; General Store
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500">Category</label>
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900">
                      Grocery / Kirana
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Scratch Card Offers */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold">
                  Step 2 &middot; Reward Configuration
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  Multiple Scratch Card Offers सेट करें
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Scratch Card option में उपलब्ध सुविधाओं के अनुसार अलग-अलग Offers और Rewards सेट करें। जब Customer QR Code Scan करेगा, तो उसे सिस्टम में उपलब्ध Offer या Scratch Card दिखाई देगा।
                </p>
                <ul className="space-y-2 text-xs font-medium text-slate-700">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    छूट या इनाम कूपन आसानी से तय करें
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    Customer के चेक-इन करते ही तुरंत रिवॉर्ड स्क्रीन उपलब्ध
                  </li>
                </ul>
              </div>

              {/* Mockup Preview */}
              <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-800">Scratch Card Manager</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">Active Pool</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                    <div className="font-bold text-amber-950">10% Discount</div>
                    <div className="text-[11px] text-amber-800 mt-1">Min. Bill ₹300</div>
                  </div>
                  <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl">
                    <div className="font-bold text-indigo-950">₹50 Cash Voucher</div>
                    <div className="text-[11px] text-indigo-800 mt-1">Next Visit Reward</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Product Photo & Offer */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold">
                  Step 3 &middot; Product Catalog
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  नए Product की Photo और Offer तैयार करें
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  जब दुकान पर नया Product आए, तो उसकी Photo लें या उपलब्ध Product Image चुनें। उसके साथ Offer की जानकारी तैयार करें।
                </p>
                <ul className="space-y-2 text-xs font-medium text-slate-700">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    सीधे फोन कैमरे से फोटो खींचें या गैलरी से अपलोड करें
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ऑफर टाइटल और डिस्काउंट विवरण जोड़ें
                  </li>
                </ul>
              </div>

              {/* Mockup Preview */}
              <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-800">Create Product Offer</span>
                  <Camera className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center bg-slate-50">
                  <Camera className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                  <span className="text-xs font-semibold text-slate-700 block">Product Photo Uploaded</span>
                  <span className="text-[10px] text-slate-400">PNG, JPG, WEBP Supported</span>
                </div>
              </div>
            </div>

            {/* Step 4: 1-Click Send Offer */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-violet-100 text-violet-800 text-xs font-bold">
                  Step 4 &middot; Customer Outreach
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  एक Click में Offers भेजें
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Offer तैयार होने के बाद उसे एक Click में अपने उपलब्ध Customer audience तक भेजें, जहाँ मौजूदा product functionality इसकी अनुमति देती है।
                </p>
                <ul className="space-y-2 text-xs font-medium text-slate-700">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ऑफर परमिशन वाले ग्राहकों तक सीधा नोटिफिकेशन
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    Free Plan में 100 recipients/माह सीमा उपलब्ध
                  </li>
                </ul>
              </div>

              {/* Mockup Preview */}
              <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-800">Send Offer Broadcast</span>
                  <Send className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
                  <div className="text-xs">
                    <div className="font-bold text-indigo-950">Eligible Recipients</div>
                    <div className="text-[11px] text-indigo-700">84 Customers on your list</div>
                  </div>
                  <button
                    type="button"
                    className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-lg shadow-xs pointer-events-none"
                  >
                    Send Offer &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section CTA */}
          <div className="mt-12 text-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-base shadow-sm hover:shadow transition-all"
            >
              <span>Start Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* PART 10 — CTA 4: PRICING (ID: pricing)                        */}
      {/* ------------------------------------------------------------- */}
      <section id="pricing" className="scroll-mt-24 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50/80 border-b border-slate-200">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold tracking-wide uppercase">
              Pricing
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              मुफ्त में शुरू करें। Business के साथ आगे बढ़ें।
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              पहले U-Grahak इस्तेमाल करें। ज़रूरत बढ़ने पर अपने लिए सही Plan चुनें।
            </p>
          </div>

          {/* 4 Plans Grid: Free, Starter, Growth, Pro */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {/* Plan 1: Free Plan (Highlighted & Prominent) */}
            <div className="bg-white border-2 border-indigo-600 rounded-3xl p-6 sm:p-7 shadow-lg flex flex-col justify-between relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-xs">
                हमेशा फ्री &middot; Zero Cost
              </div>

              <div>
                <div className="flex items-center justify-between pt-1">
                  <h3 className="text-lg font-black text-slate-900">Free Plan</h3>
                  <span className="text-[11px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    ₹0 / महीना
                  </span>
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">₹0</span>
                  <span className="text-xs font-semibold text-slate-500">/ महीना</span>
                </div>

                <p className="text-xs text-indigo-700 font-bold mt-2">
                  100 तक Customers
                </p>

                <ul className="mt-6 space-y-3 text-xs text-slate-700 font-medium">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>100 तक Customers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>हर महीने 100 तक Offer Recipients</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Business QR Code</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Digital Scratch Cards</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Google Review Link</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <Link
                  href="/signup"
                  className="w-full py-3.5 px-4 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                >
                  <span>Start Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Plan 2: Starter Plan */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900">Starter Plan</h3>
                  <span className="text-[11px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                    स्मॉल स्टोर
                  </span>
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">₹999</span>
                  <span className="text-xs font-semibold text-slate-500">/ महीना</span>
                </div>

                <p className="text-xs text-indigo-700 font-bold mt-2">
                  1,500 तक Customers
                </p>

                <ul className="mt-6 space-y-3 text-xs text-slate-600 font-medium">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>1,500 तक Customers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Send Offer (असीमित)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Google Review Requests</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Basic Customer Tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Store QR Code &amp; Scratch Cards</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <Link
                  href="/signup"
                  className="w-full py-3.5 px-4 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                >
                  <span>Start Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Plan 3: Growth Plan */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900">Growth Plan</h3>
                  <span className="text-[11px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                    ग्रोइंग स्टोर
                  </span>
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">₹2,999</span>
                  <span className="text-xs font-semibold text-slate-500">/ महीना</span>
                </div>

                <p className="text-xs text-indigo-700 font-bold mt-2">
                  5,000 तक Customers
                </p>

                <ul className="mt-6 space-y-3 text-xs text-slate-600 font-medium">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>5,000 तक Customers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Send Offer (असीमित)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Nearby Offers (100–200m)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Priority Offer Sending</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Google Review Requests</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <Link
                  href="/signup"
                  className="w-full py-3.5 px-4 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                >
                  <span>Start Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Plan 4: Pro Plan */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900">Pro Plan</h3>
                  <span className="text-[11px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                    लार्ज स्टोर
                  </span>
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">₹6,999</span>
                  <span className="text-xs font-semibold text-slate-500">/ महीना</span>
                </div>

                <p className="text-xs text-indigo-700 font-bold mt-2">
                  10,000 तक Customers
                </p>

                <ul className="mt-6 space-y-3 text-xs text-slate-600 font-medium">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>10,000 तक Customers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Nearby Offers &amp; Insights</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Business Growth Insights</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Multiple Staff Accounts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Priority Support</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <Link
                  href="/signup"
                  className="w-full py-3.5 px-4 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                >
                  <span>Start Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* PART 11 — CTA 5: QUESTIONS & ANSWERS (ID: faq)                */}
      {/* ------------------------------------------------------------- */}
      <section id="faq" className="scroll-mt-24 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold tracking-wide uppercase">
              Questions &amp; Answers
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              U-Grahak के बारे में अक्सर पूछे जाने वाले सवाल
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              दुकानदारों के सामान्य सवालों के सटीक व स्पष्ट जवाब।
            </p>
          </div>

          {/* Accordion FAQ List (7 Exact Questions) */}
          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="border border-slate-200 rounded-2xl overflow-hidden transition-colors bg-slate-50/60"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-2xl transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-indigo-600" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-white animate-in fade-in duration-200">
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
      {/* PART 12 — CTA 6: CONTACT US (ID: contact)                     */}
      {/* ------------------------------------------------------------- */}
      <section id="contact" className="scroll-mt-24 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50/80 border-b border-slate-200">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold tracking-wide uppercase">
              Contact Us
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              हम आपकी मदद के लिए यहाँ हैं।
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              U-Grahak शुरू करने, अपने Business को सेट करने या किसी समस्या के समाधान के लिए हमसे संपर्क करें।
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Official Support Channels & Hours */}
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Official Support Desk
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    अपने तकनीकी सवाल, QR कोड सेटअप या बिलिंग सहायता के लिए संपर्क करें।
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    Verified Support Email
                  </p>
                  <a
                    href="mailto:supportugrahak@gmail.com"
                    className="text-sm font-bold text-indigo-600 font-mono mt-1 break-all hover:underline block"
                  >
                    supportugrahak@gmail.com
                  </a>
                </div>

                <div className="space-y-2 text-xs text-slate-600 pt-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>काम के घंटे: सोमवार से शनिवार, 10:00 AM &ndash; 6:00 PM IST</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <span>जवाब समय: आमतौर पर 24–48 घंटों के अंदर</span>
                  </div>
                </div>
              </div>

              {/* Operating Entity Card */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs text-xs text-slate-600 space-y-2">
                <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Store className="w-4 h-4 text-indigo-600" />
                  <span>U-Grahak Local Retail Platform</span>
                </div>
                <p>
                  स्थानिक भारतीय दुकानदारों के लिए विश्वसनीय और सुरक्षित ग्राहक प्रबंधन सॉफ्टवेयर।
                </p>
              </div>
            </div>

            {/* Right Column: Premium Interactive Contact Form */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
              <h3 className="text-lg font-black text-slate-900 mb-1">
                संदेश भेजें
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                कृपया अपनी जानकारी भरें। हमारी सपोर्ट टीम आपकी दुकान की सहायता के लिए तैयार है।
              </p>

              {contactStatus === "success" ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-emerald-900">
                    संदेश सफलतापूर्वक प्राप्त हुआ!
                  </h4>
                  <p className="text-xs text-emerald-700 max-w-md mx-auto">
                    धन्यवाद। आपकी जानकारी सुरक्षित दर्ज कर ली गई है। हमारी टीम जल्द ही आपसे संपर्क करेगी।
                  </p>
                  <button
                    type="button"
                    onClick={() => setContactStatus("idle")}
                    className="mt-3 text-xs font-bold text-emerald-800 underline hover:text-emerald-900"
                  >
                    नया संदेश भेजें
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  {contactStatus === "error" && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                      {contactErrorText}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
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
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                      />
                    </div>

                    {/* Business Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        दुकान / Business Name
                      </label>
                      <input
                        type="text"
                        value={contactBusinessName}
                        onChange={(e) => setContactBusinessName(e.target.value)}
                        placeholder="उदा. शर्मा किराना स्टोर"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Email or Phone */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Email या मोबाइल नंबर <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={contactInfo}
                        onChange={(e) => setContactInfo(e.target.value)}
                        placeholder="yourname@gmail.com या 9876543210"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                      />
                    </div>

                    {/* Help Topic */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Help Topic
                      </label>
                      <select
                        value={contactTopic}
                        onChange={(e) => setContactTopic(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-slate-800"
                      >
                        <option value="QR Code & Scratch Card Setup">QR Code &amp; Scratch Card Setup</option>
                        <option value="Send Offer & Product Photos">Send Offer &amp; Product Photos</option>
                        <option value="Billing & Plans">Billing &amp; Plans</option>
                        <option value="Google Reviews Setup">Google Reviews Setup</option>
                        <option value="Other Assistance">Other Assistance</option>
                      </select>
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      संदेश (Message) <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={contactMsg}
                      onChange={(e) => setContactMsg(e.target.value)}
                      placeholder="आपकी दुकान के बारे में सवाल या जो मदद चाहिए..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={contactStatus === "loading"}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-sm shadow-xs transition-colors"
                  >
                    <span>{contactStatus === "loading" ? "भेजा जा रहा है..." : "संदेश भेजें →"}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* PART 13 — FINAL CTA AT THE BOTTOM                             */}
      {/* ------------------------------------------------------------- */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-600/20 blur-[100px] rounded-full -z-0 pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>GROW YOUR LOCAL BUSINESS TODAY</span>
          </div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.2]">
            अब अपने Customers को दोबारा बुलाना शुरू करें।
          </h2>

          {/* Supporting Text */}
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
            U-Grahak के साथ Customer Relationships बेहतर बनाएँ, नए Products के Offers पहुँचाएँ और अपने Local Business को आगे बढ़ाने के नए अवसर पाएँ।
          </p>

          {/* Primary CTA */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-base shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98]"
            >
              <span>Start Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Secondary Supporting Line */}
          <p className="text-xs sm:text-sm font-semibold text-slate-400">
            ₹0 से शुरुआत करें।
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* PART 14 — FOOTER                                              */}
      {/* ------------------------------------------------------------- */}
      <footer className="border-t border-slate-200 bg-white text-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-slate-100">
            {/* Brand & Purpose (5 Cols) */}
            <div className="md:col-span-5 space-y-4">
              <Link href="/" className="inline-flex items-center gap-2.5">
                <BrandLogo size="md" />
              </Link>

              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  U-Grahak — Smart Tool for Local Businesses
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-1 max-w-sm">
                  अपने Customers से बेहतर जुड़ें, Offers Manage करें और Repeat Visits को प्रोत्साहित करें।
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Free Plan Available &bull; ₹0/month</span>
              </div>
            </div>

            {/* Product Links (3 Cols) */}
            <div className="md:col-span-3 space-y-3">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Product Links
              </h4>
              <ul className="space-y-2 text-xs font-medium text-slate-600">
                <li>
                  <a href="#problems" className="hover:text-indigo-600 transition-colors">
                    Local Business की Problems
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">
                    कैसे काम करता है?
                  </a>
                </li>
                <li>
                  <a href="#for-shop-owners" className="hover:text-indigo-600 transition-colors">
                    Shop Owner कैसे Use करेगा?
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-indigo-600 transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <Link href="/login" className="hover:text-indigo-600 transition-colors">
                    Login
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal & Support Links (4 Cols) */}
            <div className="md:col-span-4 space-y-3">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Legal &amp; Support
              </h4>
              <ul className="space-y-2 text-xs font-medium text-slate-600">
                <li>
                  <Link
                    href="/privacy-policy"
                    className="hover:text-indigo-600 transition-colors inline-flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>Privacy Policy</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-indigo-600 transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>Terms &amp; Conditions</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/refund-policy"
                    className="hover:text-indigo-600 transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>Refund &amp; Cancellation Policy</span>
                  </Link>
                </li>
                <li>
                  <a
                    href="#contact"
                    className="hover:text-indigo-600 transition-colors inline-flex items-center gap-1.5"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span>Contact Us</span>
                  </a>
                </li>
              </ul>

              <div className="pt-2 text-[11px] text-slate-400 leading-normal flex items-start gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
                <span>Business support available Mon–Sat (10:00 AM – 6:00 PM IST).</span>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Customer Data Is Private &bull; Securely Protected</span>
            </div>

            <p className="text-[11px] text-slate-400">
              &copy; {new Date().getFullYear()} U-Grahak. Built for Local Businesses in India.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
