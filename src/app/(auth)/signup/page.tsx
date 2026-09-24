import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { SignupForm } from "@/components/auth/SignupForm";
import { Spinner } from "@/components/ui/Spinner";
import { Footer } from "@/components/layout/Footer";
import {
  Store,
  QrCode,
  Gift,
  Send,
  Users,
  MapPin,
  Star,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Create Merchant Account | Ugrahak",
  description:
    "Register for a 7-day free trial of Ugrahak. Create your shop QR code and start capturing customer visits in minutes.",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-xs">
              <Store className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg text-slate-900 tracking-tight">
              Ugrahak
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-bold text-slate-700 hover:text-indigo-600 px-3.5 py-2 rounded-xl transition-all"
            >
              Already have an account? Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column (Desktop 6 Cols / Mobile Stacked): Value Proposition */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>7 Days Free Trial &bull; No Card Required</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Turn First-Time Customers Into{" "}
                <span className="text-indigo-600">Repeat Customers</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Capture customers, reward first visits, send offers and bring customers back. Set up your shop in less than 2 minutes.
              </p>
            </div>

            {/* Visual 3-Step Flow */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                How It Works In 3 Simple Steps
              </h3>

              <div className="space-y-3.5">
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-black text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Customer Scans Your QR
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Customer scans your shop QR and shares their name and phone.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-black text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Customer Gets a Reward
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Customer gets your first-visit scratch-card reward.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-black text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Bring Them Back
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Send offers and nearby alerts to bring customers back again.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* What You Get Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-xs font-bold text-slate-800">
                  Instant Shop QR Code
                </span>
              </div>
              <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-xs font-bold text-slate-800">
                  Custom Scratch Cards
                </span>
              </div>
              <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-xs font-bold text-slate-800">
                  Instant Offer Broadcasts
                </span>
              </div>
              <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-xs font-bold text-slate-800">
                  Automated Google Reviews
                </span>
              </div>
            </div>
          </div>

          {/* Right Column (Desktop 6 Cols / Mobile Stacked): Create Merchant Account Form */}
          <div className="lg:col-span-6 w-full">
            <Suspense fallback={<Spinner size="lg" />}>
              <SignupForm />
            </Suspense>
          </div>
        </div>
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}

