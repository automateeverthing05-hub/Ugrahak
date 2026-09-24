import type { Metadata } from "next";
import Link from "next/link";
import { PLANS } from "@/lib/billing/plans";
import { Store, Check, ArrowRight, ShieldCheck, Sparkles, FileText, RefreshCw } from "lucide-react";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Pricing Plans | Ugrahak",
  description:
    "Transparent pricing for local retail merchants. 7-Day Free Trial, Starter, Growth, and Pro plans for store loyalty rewards and customer retention.",
};

export default function PricingPage() {
  const planList = [PLANS.TRIAL, PLANS.STARTER, PLANS.GROWTH, PLANS.PRO];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Navigation Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-xs">
              <Store className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg text-slate-900 tracking-tight">
              Ugrahak
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-indigo-600 px-3 py-1.5 transition-colors"
            >
              Merchant Sign In
            </Link>
            <Link
              href="/signup"
              className="text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl transition-colors shadow-xs"
            >
              Start 7-Day Free Trial
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 flex-1 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Transparent Local Merchant Pricing
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Simple Plans Built for Retail Store Growth
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            Turn every walk-in shopper into a repeat loyal customer with QR rewards, push notifications, and nearby offers.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {planList.map((plan) => {
            const isPopular = plan.id === "GROWTH";

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
                    Most Popular
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900">
                      {plan.priceINR === 0 ? "Free" : `₹${plan.priceINR.toLocaleString()}`}
                    </span>
                    {plan.priceINR > 0 && (
                      <span className="text-xs text-slate-500 font-medium">/ month</span>
                    )}
                  </div>

                  <p className="text-xs text-indigo-600 font-semibold mt-2">
                    {plan.customerLimit.toLocaleString()} Customers Included
                  </p>

                  <ul className="mt-6 space-y-3 text-xs text-slate-600">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8">
                  <Link
                    href="/signup"
                    className={`w-full py-3 px-4 rounded-2xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors ${
                      isPopular
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                    }`}
                  >
                    <span>{plan.id === "TRIAL" ? "Start Free Trial" : `Choose ${plan.name}`}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Guarantee section */}
        <div className="mt-14 bg-indigo-50/70 border border-indigo-200 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">
                100% Risk-Free 7-Day Free Trial
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                No credit card required to start. Print your store QR code and start retaining customers immediately.
              </p>
            </div>
          </div>

          <Link
            href="/signup"
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm whitespace-nowrap"
          >
            Get Started Now
          </Link>
        </div>

        {/* Explicit Legal Links for Pricing & Subscriptions */}
        <div className="mt-10 p-5 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Billing Terms &amp; Policies:</span> All plans include automatic recurring billing unless cancelled.
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs font-semibold text-indigo-600">
            <Link href="/terms" className="hover:underline inline-flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Terms &amp; Conditions</span>
            </Link>
            <span className="text-slate-300">&bull;</span>
            <Link href="/refund-policy" className="hover:underline inline-flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span>Refund &amp; Cancellation Policy</span>
            </Link>
            <span className="text-slate-300">&bull;</span>
            <Link href="/privacy-policy" className="hover:underline inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>Privacy Policy</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}

