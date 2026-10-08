import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { Spinner } from "@/components/ui/Spinner";
import { Footer } from "@/components/layout/Footer";
import { BrandLogo } from "@/components/ui/BrandLogo";
import {
  Store,
  QrCode,
  Gift,
  Send,
  Users,
  MapPin,
  Star,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Business Owner Login | U-Grahak",
  description:
    "Log in to your U-Grahak business dashboard to view customer visits, send offers, and manage rewards.",
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
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content: 2-Column Responsive Layout */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column (7 Cols on Desktop): Owner Value Proposition & 3-Step Flow */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            {/* Headline Section */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Free se shuru karein &bull; ₹0/month</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Turn First-Time Customers Into{" "}
                <span className="text-indigo-600">Repeat Customers</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl font-medium">
                QR scan karwayein, reward dein aur offers bhejkar customers ko dobara laayein.
              </p>
            </div>

            {/* Visual 3-Step Flow */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                  Ugrahak Kaise Kaam Karta Hai
                </h3>
                <span className="text-[11px] font-semibold text-slate-400">
                  No Extra Equipment Required
                </span>
              </div>

              <div className="space-y-3.5">
                {/* Step 1 */}
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-black text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Customer Scans Your QR
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Customer aapka shop QR scan karega aur apna naam likhega.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-black text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Customer ko Reward Milega
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Customer ko phone par turant reward milega.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-black text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Offers Bhejkar Dobara Bulayein
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Offers bhejkar customers ko dobara apni shop par bulayein.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefit Cards Grid */}
            <div>
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">
                Aapko Ugrahak Me Kya Milega
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Benefit 1 */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">
                      Aapka Customer Data Secure Hai
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Customer list hamesha private aur secure rehti hai.
                    </p>
                  </div>
                </div>

                {/* Benefit 2 */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">
                      Naye Customer ka Reward
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Pehle visit par aane wale customers ko special reward dein.
                    </p>
                  </div>
                </div>

                {/* Benefit 3 */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">
                      Direct Offers Bhejein
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      1 tap me sabhi customers ko special offer bhejein.
                    </p>
                  </div>
                </div>

                {/* Benefit 4 */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">
                      Nearby Customers Offers
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Jab customer shop ke 100-200m paas ho tab special offer dikhayein.
                    </p>
                  </div>
                </div>

                {/* Benefit 5 */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs flex items-start gap-3 sm:col-span-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                    <Star className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">
                      Google Reviews Badhayein
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Customers se aasani se Google Maps par reviews paayein.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom CTA Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-sm transition-all"
              >
                <span>Free Account Banayein</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right Column (5 Cols on Desktop): Merchant Login Form */}
          <div className="lg:col-span-5 w-full">
            <Suspense fallback={<Spinner size="lg" />}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
