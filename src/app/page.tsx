import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Store,
  QrCode,
  Gift,
  Send,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Star,
  Users,
  Compass,
  Zap,
  HelpCircle,
  Smartphone,
  ChevronDown,
  ChevronRight,
  Building2,
  Coffee,
  Scissors,
  Utensils,
  Cake,
  Dumbbell,
  ShoppingBag,
  Bell,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { BrandLogo } from "@/components/ui/BrandLogo";

export const metadata: Metadata = {
  title: "U-Grahak — Turn First-Time Customers Into Repeat Customers",
  description:
    "U-Grahak helps local businesses capture customers, reward first visits, send offers, and bring customers back.",
  openGraph: {
    title: "U-Grahak — Turn First-Time Customers Into Repeat Customers",
    description:
      "Capture new customers, reward their first visit, and bring them back with offers and notifications — all from one simple platform.",
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-600 selection:text-white">
      {/* ------------------------------------------------------------- */}
      {/* NAVIGATION BAR                                                */}
      {/* ------------------------------------------------------------- */}
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <BrandLogo size="md" showTagline={true} priority={true} />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">
              How It Works
            </a>
            <a href="#features" className="hover:text-indigo-600 transition-colors">
              Features
            </a>
            <a href="#dashboard" className="hover:text-indigo-600 transition-colors">
              Product
            </a>
            <Link href="/pricing" className="hover:text-indigo-600 transition-colors">
              Pricing
            </Link>
            <a href="#faq" className="hover:text-indigo-600 transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-bold text-slate-700 hover:text-indigo-600 px-3 py-2 rounded-xl transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-xs hover:shadow-sm transition-all"
            >
              Start Free
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full">
        {/* ------------------------------------------------------------- */}
        {/* 1. HERO SECTION                                               */}
        {/* ------------------------------------------------------------- */}
        <section className="relative overflow-hidden pt-10 sm:pt-16 pb-12 sm:pb-20 border-b border-slate-200/60 bg-gradient-to-b from-white via-slate-50/60 to-slate-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
              {/* Left Column: Value Proposition & CTAs (7 Cols) */}
              <div className="lg:col-span-7 space-y-6 text-left">
                {/* Trust Microcopy Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold tracking-tight shadow-2xs">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span>Free Plan &bull; ₹0/month &bull; No Card Required</span>
                </div>

                {/* Primary Headline */}
                <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-black text-slate-900 tracking-tight leading-[1.12]">
                  Turn First-Time Customers Into{" "}
                  <span className="text-indigo-600 underline decoration-indigo-200 decoration-wavy decoration-2">
                    Repeat Customers
                  </span>
                </h1>

                {/* Subheadline */}
                <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-xl">
                  Capture new customers, reward their first visit, and bring them back with offers and notifications — all from one simple platform.
                </p>

                {/* CTAs */}
                <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm sm:text-base font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-[0.99]"
                  >
                    <span>Start Free — No Card Required</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <a
                    href="#how-it-works"
                    className="inline-flex items-center justify-center gap-1.5 px-5 py-3.5 text-sm sm:text-base font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-2xl shadow-2xs transition-colors"
                  >
                    <span>See How It Works</span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </a>
                </div>

                {/* Trust Points */}
                <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    Customers never need an app
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    No customer password or login
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    Setup ready in 2 minutes
                  </span>
                </div>
              </div>

              {/* Right Column: Polished Product Visual Representation (5 Cols) */}
              <div className="lg:col-span-5 relative">
                <div className="relative mx-auto max-w-md w-full">
                  {/* Outer Frame Mockup */}
                  <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xl overflow-hidden p-5 sm:p-6 space-y-4">
                    {/* Mockup Header: Merchant Storefront Profile */}
                    <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                          <Store className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-extrabold text-slate-900">
                            Your Business Dashboard
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Free Plan &bull; Store QR Active
                          </div>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Live
                      </span>
                    </div>

                    {/* Visual Segment 1: Quick Metric Pill */}
                    <div className="grid grid-cols-2 gap-2.5 text-left">
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                          Customers Saved
                        </div>
                        <div className="text-lg font-black text-slate-900 mt-0.5">
                          Direct List
                        </div>
                        <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-0.5">
                          <TrendingUp className="w-3 h-3" />
                          Own your audience
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                        <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wide">
                          Repeat Visits
                        </div>
                        <div className="text-lg font-black text-indigo-950 mt-0.5">
                          Active Rewards
                        </div>
                        <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">
                          Digital scratch cards
                        </div>
                      </div>
                    </div>

                    {/* Visual Segment 2: Customer Experience Simulation (QR + Scratch Card Preview) */}
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50/80 via-white to-amber-50/30 border border-amber-200/80 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-amber-900 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          Customer Scratch Card Experience
                        </span>
                        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider bg-amber-100/70 px-2 py-0.5 rounded-md">
                          1st Visit
                        </span>
                      </div>

                      {/* Mock scratch card preview */}
                      <div className="p-3 rounded-xl bg-white border border-amber-200 shadow-2xs flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            Flat 10% Off On Your Purchase
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Show code at billing &bull; Instant reward
                          </p>
                        </div>
                        <div className="px-2.5 py-1 rounded-lg bg-amber-500 text-white font-mono text-[11px] font-black tracking-wider">
                          UG-REWARD
                        </div>
                      </div>
                    </div>

                    {/* Visual Segment 3: 1-Click Offer Dispatch Button Preview */}
                    <div className="p-3 rounded-2xl bg-slate-900 text-white flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center text-white flex-shrink-0">
                          <Send className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-bold text-white leading-tight">
                            Send Direct Offer
                          </div>
                          <div className="text-[10px] text-slate-300">
                            Push alerts to returning customers
                          </div>
                        </div>
                      </div>
                      <div className="px-2.5 py-1 rounded-lg bg-indigo-600 text-[10px] font-extrabold tracking-wide text-white uppercase whitespace-nowrap">
                        1-Click Send
                      </div>
                    </div>
                  </div>

                  {/* Decorative Background Accent Glow */}
                  <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-[32px] -z-10 blur-xl" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 2. TRUST / AUDIENCE STRIP                                     */}
        {/* ------------------------------------------------------------- */}
        <section className="py-6 border-b border-slate-200/70 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 text-center">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                Built for local businesses:
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-bold text-slate-700">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200">
                  <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
                  Shops
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200">
                  <Coffee className="w-3.5 h-3.5 text-amber-600" />
                  Cafes
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200">
                  <Scissors className="w-3.5 h-3.5 text-purple-600" />
                  Salons
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200">
                  <Utensils className="w-3.5 h-3.5 text-rose-600" />
                  Restaurants
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200">
                  <Cake className="w-3.5 h-3.5 text-pink-600" />
                  Bakeries
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200">
                  <Dumbbell className="w-3.5 h-3.5 text-emerald-600" />
                  Gyms
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200">
                  <Building2 className="w-3.5 h-3.5 text-slate-600" />
                  Local Businesses
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 3. PROBLEM SECTION                                            */}
        {/* ------------------------------------------------------------- */}
        <section className="py-14 sm:py-20 bg-slate-50 border-b border-slate-200/70">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
            <div className="max-w-2xl mx-auto space-y-3 mb-12">
              <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                The Retail Challenge
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Your customers already visited. The problem is getting them to come back.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                Every week hundreds of people walk into your store. But without a simple retention system, most of them walk away forever.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 text-left">
              <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
                  01
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  First-Time Customers Rarely Return
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Walk-in shoppers buy once and forget about your store because there is no incentive or reminder to visit again.
                </p>
              </div>

              <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
                  02
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Customer Info Is Hard to Organize
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Pen-and-paper registers and notebooks are messy, easy to lose, and unusable for sending targeted store updates.
                </p>
              </div>

              <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
                  03
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Sending Offers Manually Takes Too Long
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Broadcasting individual WhatsApp messages or paying for expensive SMS packages is slow, costly, and tedious.
                </p>
              </div>

              <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
                  04
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Limited Ways to Encourage Repeat Visits
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Local stores have had no lightweight digital tools to reward returning customers without requiring heavy apps.
                </p>
              </div>

              <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-2 sm:col-span-2 lg:col-span-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
                  05
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Getting Consistent Google Reviews Is Difficult
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Happy customers leave your counter with a smile, but almost none remember to look up your business profile and leave a review once they get home.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 4. HOW UGRAHAK WORKS                                          */}
        {/* ------------------------------------------------------------- */}
        <section id="how-it-works" className="py-16 sm:py-24 bg-white border-b border-slate-200/70">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
              <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                Simple 3-Step Flow
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Turn a first visit into a repeat customer in 3 simple steps
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                Everything works directly in the mobile browser. No complex hardware. No terminal installation.
              </p>
            </div>

            {/* 3-Step Visual Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {/* Step 1 */}
              <div className="p-6 bg-slate-50 border border-slate-200/90 rounded-3xl relative flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                      <QrCode className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-extrabold text-indigo-700 bg-indigo-100/80 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                      Step 1
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">
                    Customer Scans Your QR
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                    Customer scans your shop QR and enters their name. No mobile app download, no password, and no login required.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/60 text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  Takes less than 10 seconds
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-6 bg-slate-50 border border-slate-200/90 rounded-3xl relative flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                      <Gift className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                      Step 2
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">
                    Customer Gets a Reward
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                    Give new customers a scratch-card reward and create a reason to come back. Instant discount code displayed on screen.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/60 text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  Digital scratch card excitement
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-6 bg-slate-50 border border-slate-200/90 rounded-3xl relative flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                      <Send className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-extrabold text-blue-800 bg-blue-100/80 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                      Step 3
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">
                    Bring Them Back
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                    Send relevant offers and notifications to encourage repeat visits. Reach returning shoppers on weekends and festivals.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/60 text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  Direct customer re-engagement
                </div>
              </div>
            </div>

            {/* Zero-Friction Visual Flow Indicator */}
            <div className="mt-10 p-4 sm:p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 text-center">
              <div className="text-xs sm:text-sm font-extrabold text-indigo-950 mb-1">
                Zero Friction for Your Customers:
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-bold text-indigo-800">
                <span className="px-2.5 py-1 bg-white rounded-lg border border-indigo-200 shadow-2xs">
                  1. Scan QR
                </span>
                <span className="text-indigo-400">&rarr;</span>
                <span className="px-2.5 py-1 bg-white rounded-lg border border-indigo-200 shadow-2xs">
                  2. Enter Name
                </span>
                <span className="text-indigo-400">&rarr;</span>
                <span className="px-2.5 py-1 bg-white rounded-lg border border-indigo-200 shadow-2xs">
                  3. Allow Notifications
                </span>
                <span className="text-indigo-400">&rarr;</span>
                <span className="px-2.5 py-1 bg-white rounded-lg border border-indigo-200 shadow-2xs text-emerald-700">
                  4. Get Scratch Reward
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Customers don&apos;t need to create an account, remember passwords, or download apps.
              </p>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 5. PRODUCT VALUE SECTION (Existing Features Only)             */}
        {/* ------------------------------------------------------------- */}
        <section id="features" className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200/70">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
              <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                Complete Toolset
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Everything you need to turn new customers into repeat customers
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                Every feature is built specifically for local retail and store owners to drive repeat revenue.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1: Instant Shop QR */}
              <div className="p-6 bg-white border border-slate-200/90 rounded-3xl shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Instant Shop QR
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Create a QR for your business and start capturing new customers. Download high-resolution print-ready standees for your billing desk.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-bold text-indigo-600 flex items-center gap-1">
                  <span>Available on all plans including Free</span>
                </div>
              </div>

              {/* Feature 2: First-Visit Rewards */}
              <div className="p-6 bg-white border border-slate-200/90 rounded-3xl shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <Gift className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    First-Visit Rewards
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Give new customers a reason to remember your business and come back. Interactive digital scratch cards make claiming rewards memorable.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  <span>Custom discount titles &amp; values</span>
                </div>
              </div>

              {/* Feature 3: Customer Offers */}
              <div className="p-6 bg-white border border-slate-200/90 rounded-3xl shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Send className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Customer Offers
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Send offers to customers and encourage repeat visits. Create weekend specials or seasonal promotions and notify customers in 1 click.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-bold text-blue-600 flex items-center gap-1">
                  <span>Direct browser push alerts</span>
                </div>
              </div>

              {/* Feature 4: Nearby Offers */}
              <div className="p-6 bg-white border border-slate-200/90 rounded-3xl shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <Compass className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Nearby Offers
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Reach eligible customers when they are near your business. Deliver location-aware offers when shoppers are within 100–200 meters.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-bold text-purple-600 flex items-center gap-1">
                  <span>Smart distance detection</span>
                </div>
              </div>

              {/* Feature 5: Google Reviews */}
              <div className="p-6 bg-white border border-slate-200/90 rounded-3xl shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Star className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Google Reviews
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Make it easier for happy customers to leave a Google review. Connect your Google Maps profile to prompt genuine ratings from satisfied shoppers.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-bold text-amber-600 flex items-center gap-1">
                  <span>Google Maps link integration</span>
                </div>
              </div>

              {/* Feature 6: Customer Growth */}
              <div className="p-6 bg-white border border-slate-200/90 rounded-3xl shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Customer Growth
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Build and manage your customer base from one dashboard. Track total customer visits, repeat visit frequency, and active campaigns cleanly.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-bold text-teal-600 flex items-center gap-1">
                  <span>Private multi-tenant database</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 6. PRODUCT VISUAL / DASHBOARD SECTION                         */}
        {/* ------------------------------------------------------------- */}
        <section id="dashboard" className="py-16 sm:py-24 bg-white border-b border-slate-200/70">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
              <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                Merchant Experience
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Everything in one simple dashboard
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                Designed to be effortlessly managed on your smartphone or counter tablet while attending to customers.
              </p>
            </div>

            {/* Dashboard Mockup Grid Container */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-800 space-y-8">
              {/* Header simulation */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-xs text-white">
                      U
                    </div>
                    <span className="text-sm font-bold text-slate-200">
                      Merchant Portal
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Store Live
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Store QR Standee: Ready for Counter &bull; Push Notification Server: Active
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">
                    Manage from Phone:
                  </span>
                  <span className="text-xs font-bold text-white bg-slate-800 px-3 py-1 rounded-xl border border-slate-700">
                    100% Mobile Ready
                  </span>
                </div>
              </div>

              {/* 4 Dashboard Metric Tiles */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Total Customers
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-white">
                    Direct Directory
                  </div>
                  <p className="text-[10px] text-slate-400">Enrolled via QR check-in</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Repeat Visits
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-emerald-400">
                    Tracked Frequency
                  </div>
                  <p className="text-[10px] text-slate-400">Returning loyal buyers</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Active Offers
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-indigo-400">
                    Instant Broadcast
                  </div>
                  <p className="text-[10px] text-slate-400">Sent to customer screens</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Google Reviews
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-amber-400">
                    Automated
                  </div>
                  <p className="text-[10px] text-slate-400">Post-visit review link</p>
                </div>
              </div>

              {/* 2-Column Visual Detail in Mockup */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2">
                {/* Visual Module 1: Offer Creator */}
                <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5" />
                      Offer Broadcast Interface
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">1-Tap Delivery</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-700/80 space-y-1.5">
                    <div className="text-xs font-bold text-white">
                      &quot;Weekend Special: 15% Off On All Orders Above ₹499&quot;
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Delivered straight to the notification bar of all enrolled customers.
                    </div>
                  </div>
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3 h-3" />
                    Zero per-SMS costs &bull; Native web push alerts
                  </div>
                </div>

                {/* Visual Module 2: Store QR Code Management */}
                <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5" />
                      Shop QR Standee Generator
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Counter Stand</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">
                        Unique Store QR Code
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Download high-resolution image for printing
                      </div>
                    </div>
                    <div className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold">
                      Download
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Print once &bull; Works seamlessly forever
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 7. SIMPLE SETUP SECTION                                       */}
        {/* ------------------------------------------------------------- */}
        <section className="py-16 sm:py-20 bg-slate-50 border-b border-slate-200/70">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
              <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                Effortless Onboarding
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Get your shop ready in minutes
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                No complex training, no IT setup, and no tech experience needed.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-2">
                <span className="text-2xl font-black text-indigo-600">01</span>
                <h3 className="text-sm font-bold text-slate-900">
                  Create your free account
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sign up in 30 seconds with your store name and phone number.
                </p>
              </div>

              <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-2">
                <span className="text-2xl font-black text-indigo-600">02</span>
                <h3 className="text-sm font-bold text-slate-900">
                  Set up your offer
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Choose a welcome reward like &quot;10% Off&quot; to greet new visitors.
                </p>
              </div>

              <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-2">
                <span className="text-2xl font-black text-indigo-600">03</span>
                <h3 className="text-sm font-bold text-slate-900">
                  Get your shop QR
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Print your ready-made QR standee and place it by the cash register.
                </p>
              </div>

              <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-2">
                <span className="text-2xl font-black text-indigo-600">04</span>
                <h3 className="text-sm font-bold text-slate-900">
                  Start capturing customers
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Watch your customer list grow and send offers whenever you want.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 8. CUSTOMER FRICTION REMOVER                                  */}
        {/* ------------------------------------------------------------- */}
        <section className="py-14 sm:py-20 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-xs font-bold border border-white/10">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Zero Customer Resistance</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Customers don&apos;t need another app.
            </h2>

            <p className="text-base sm:text-lg text-indigo-200/90 max-w-2xl mx-auto leading-relaxed font-normal">
              Customers can simply scan your QR, enter their name, choose whether to allow notifications, and receive their reward.
            </p>

            <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-2xl mx-auto">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-1">
                <div className="text-xs font-bold text-emerald-400">No App Store Downloads</div>
                <p className="text-[11px] text-slate-300">Opens instantly in Safari or Chrome.</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-1">
                <div className="text-xs font-bold text-emerald-400">No Passwords to Remember</div>
                <p className="text-[11px] text-slate-300">Customers enter only their name.</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-1">
                <div className="text-xs font-bold text-emerald-400">Instant Reward Reveal</div>
                <p className="text-[11px] text-slate-300">Fun digital scratch card on their screen.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 9. PRICING / FREE PLAN TEASER                                 */}
        {/* ------------------------------------------------------------- */}
        <section className="py-16 sm:py-24 bg-white border-b border-slate-200/70">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
              <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                Transparent Pricing
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Start free. Upgrade when you grow.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                Everything you need to get started is completely free with no credit card required.
              </p>
            </div>

            {/* Featured Free Plan Card */}
            <div className="max-w-xl mx-auto bg-slate-50 border-2 border-indigo-600 rounded-3xl p-6 sm:p-8 shadow-sm relative space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider">
                    Permanent Free Plan
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 mt-0.5">Free</h3>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-slate-900">₹0</div>
                  <div className="text-[11px] text-slate-500 font-semibold">/ month &bull; forever</div>
                </div>
              </div>

              <div className="text-xs font-bold text-slate-700 bg-white p-3 rounded-xl border border-slate-200">
                Includes all essentials to launch your customer retention system:
              </div>

              <ul className="space-y-3 text-xs sm:text-sm text-slate-600">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Maximum 100 customers in your directory</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Maximum 100 Send Offer customer recipients per month</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Store QR code standee generator</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Digital scratch cards with custom reward values</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Google Review requests integration</span>
                </li>
              </ul>

              <div className="pt-2 space-y-2.5">
                <Link
                  href="/signup"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-sm transition-all"
                >
                  <span>Start Free — No Card Required</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <p className="text-[11px] text-slate-400 text-center">
                  No credit card required. Upgrade to Starter (₹999), Growth (₹2,999), or Pro (₹6,999) only when you need more capacity.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200 text-center">
                <Link
                  href="/pricing"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1"
                >
                  <span>View all 4 transparent pricing plans &amp; features</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 10. SOCIAL PROOF (Category-Based Trust Messaging)             */}
        {/* ------------------------------------------------------------- */}
        <section className="py-14 sm:py-20 bg-slate-50 border-b border-slate-200/70">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-8">
            <div className="max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                Industry-Wide Purpose
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Built for businesses that want more repeat customers.
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Every neighborhood business model has regular visitors who could become weekly regulars.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
              <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-1.5">
                <div className="flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-amber-600" />
                  <h4 className="text-xs font-bold text-slate-900">For Cafes &amp; Bakeries</h4>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Turn morning coffee lovers and occasional snackers into daily regulars with first-visit discounts and weekday treats.
                </p>
              </div>

              <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-1.5">
                <div className="flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-purple-600" />
                  <h4 className="text-xs font-bold text-slate-900">For Salons &amp; Grooming</h4>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Remind clients when it is time for their next haircut or grooming service with weekend appointment incentives.
                </p>
              </div>

              <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-1.5">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold text-slate-900">For Retail &amp; Apparel</h4>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Reward walk-in shoppers with an instant scratch card and invite them back when new stock or festival discounts arrive.
                </p>
              </div>

              <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-1.5">
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-rose-600" />
                  <h4 className="text-xs font-bold text-slate-900">For Restaurants &amp; Eateries</h4>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Keep tables full on slow Tuesday and Wednesday nights by broadcasting mid-week special discounts directly to diners.
                </p>
              </div>

              <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-1.5">
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-slate-900">For Fitness Centers &amp; Gyms</h4>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Welcome trial members with personalized membership offers and encourage consistent renewal attendance.
                </p>
              </div>

              <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-1.5">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-600" />
                  <h4 className="text-xs font-bold text-slate-900">For Local Services</h4>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Build a dedicated customer database that belongs 100% to your store, with complete merchant privacy and zero leakage.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 11. FAQ SECTION                                               */}
        {/* ------------------------------------------------------------- */}
        <section id="faq" className="py-16 sm:py-24 bg-white border-b border-slate-200/70">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
              <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                Got Questions?
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Frequently Asked Questions
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                Everything you need to know about setting up U-Grahak for your business.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Do customers need to create an account?
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  No. Customers can scan your QR, enter their name, choose whether to allow notifications, and receive their reward. They never have to download an app, create an account, or enter a password.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Is U-Grahak really free?
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Yes! The Free plan gives you up to 100 customers, 100 monthly offer recipients, shop QR standees, scratch card rewards, and Google Review requests at ₹0/month. You only upgrade if your customer volume outgrows the free tier.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Do I need a credit card to start?
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  No credit card or payment details are required to sign up. You can create your merchant account, download your QR code, and begin capturing customers immediately.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Who is U-Grahak for?
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  U-Grahak is built for local shops, cafes, salons, restaurants, bakeries, gyms, and other neighborhood retail businesses that want more repeat customers.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Can I manage my business from my phone?
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Yes. The entire U-Grahak merchant portal is 100% mobile responsive. You can check visits, view recent customers, and dispatch new offers directly from any smartphone browser.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Can other shops see my customer data?
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Never. U-Grahak enforces strict merchant isolation under Row Level Security. Your customer list belongs entirely to your business and is never shared, marketed to, or exposed to any other merchant.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 12. FINAL CTA SECTION                                         */}
        {/* ------------------------------------------------------------- */}
        <section className="py-16 sm:py-24 bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 text-white text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-amber-200 text-xs font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch Your Repeat Customer Retention System Today</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight max-w-2xl mx-auto">
              Ready to turn more first-time customers into repeat customers?
            </h2>

            <p className="text-sm sm:text-base text-indigo-100/90 max-w-xl mx-auto leading-relaxed font-normal">
              Start your free U-Grahak account and set up your customer retention system today.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto sm:max-w-none">
              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-extrabold text-indigo-900 bg-white hover:bg-indigo-50 rounded-2xl shadow-md transition-all active:scale-[0.99]"
              >
                <span>Start Free — No Card Required</span>
                <ArrowRight className="w-4 h-4 text-indigo-700" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-indigo-800/80 hover:bg-indigo-800 border border-indigo-400/30 rounded-2xl transition-all"
              >
                Already have an account? Log in
              </Link>
            </div>

            <p className="text-xs text-indigo-200/80 pt-1">
              Free Plan &bull; ₹0/month &bull; No hardware or credit card needed &bull; Setup in 2 minutes
            </p>
          </div>
        </section>
      </main>

      {/* ------------------------------------------------------------- */}
      {/* 13. GLOBAL FOOTER                                             */}
      {/* ------------------------------------------------------------- */}
      <Footer />
    </div>
  );
}
