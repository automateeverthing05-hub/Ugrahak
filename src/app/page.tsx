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
} from "lucide-react";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Ugrahak | Turn First-Time Customers Into Repeat Customers",
  description:
    "Ugrahak helps local retail stores capture customers, reward first visits with digital scratch cards, and bring them back with Send Offer broadcasts.",
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
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-xs">
              <Store className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg text-slate-900 tracking-tight">
              Ugrahak
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-bold text-slate-700 hover:text-indigo-600 px-3 py-2 rounded-xl transition-colors"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 rounded-xl shadow-xs transition-colors"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center">
        {/* 7 Days Free Trial Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs sm:text-sm font-bold mb-6 shadow-2xs">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>7 Days Free Trial</span>
          <span className="text-slate-300">&bull;</span>
          <span className="text-slate-600 font-medium">No Credit Card Required</span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight max-w-3xl mx-auto leading-tight sm:leading-tight">
          Turn First-Time Customers Into{" "}
          <span className="text-indigo-600">Repeat Customers</span>
        </h1>

        {/* Subheadline */}
        <p className="mt-5 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Capture customers, reward first visits, send offers and bring customers back.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto sm:max-w-none">
          <Link
            href="/signup"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 text-base font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-sm transition-all"
          >
            <span>Create Free Account</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-4 text-base font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-2xl shadow-xs transition-all"
          >
            Login
          </Link>
        </div>

        {/* 3-Step Simple Visual Flow */}
        <div className="mt-16 sm:mt-20">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              How Ugrahak Works in 3 Simple Steps
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Zero hardware needed &bull; Setup in less than 2 minutes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {/* Step 1 */}
            <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs relative">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <QrCode className="w-6 h-6" />
              </div>
              <div className="inline-block px-2.5 py-0.5 rounded-md bg-indigo-100/70 text-indigo-700 font-extrabold text-[11px] mb-2 uppercase tracking-wide">
                Step 1
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Customer Scans Your QR
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                Customer visits your shop, scans your QR code at the counter, and enters their name and phone number.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs relative">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Gift className="w-6 h-6" />
              </div>
              <div className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-100/70 text-emerald-700 font-extrabold text-[11px] mb-2 uppercase tracking-wide">
                Step 2
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Customer Gets a Reward
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                Customer gets an instant first-visit scratch card reward with an exclusive discount code to redeem.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs relative">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Send className="w-6 h-6" />
              </div>
              <div className="inline-block px-2.5 py-0.5 rounded-md bg-blue-100/70 text-blue-700 font-extrabold text-[11px] mb-2 uppercase tracking-wide">
                Step 3
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Bring Them Back
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                Send festival and weekend offers directly to your customer base and drive repeated store visits.
              </p>
            </div>
          </div>
        </div>

        {/* Benefits Bar */}
        <div className="mt-12 p-6 bg-white border border-slate-200 rounded-3xl shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-slate-800">
                100% Private to Your Store
              </span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-slate-800">
                Instant Offer Broadcasts
              </span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-slate-800">
                Auto Google Maps Review Requests
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}

