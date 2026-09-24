import React from "react";
import Link from "next/link";
import { Store, ShieldCheck, Mail, FileText, RefreshCw, HelpCircle, Sparkles } from "lucide-react";

interface FooterProps {
  className?: string;
  variant?: "full" | "simple";
}

export const Footer: React.FC<FooterProps> = ({ className = "", variant = "full" }) => {
  const currentYear = new Date().getFullYear();

  if (variant === "simple") {
    return (
      <footer className={`border-t border-slate-200 bg-white py-6 px-4 text-center text-xs text-slate-500 ${className}`}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-white font-black text-xs">
              <Store className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-900 tracking-tight">Ugrahak</span>
            <span className="text-slate-300">&bull;</span>
            <span>Local Retail SaaS</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-medium text-slate-600">
            <Link href="/privacy-policy" className="hover:text-indigo-600 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-indigo-600 transition-colors">
              Terms &amp; Conditions
            </Link>
            <Link href="/refund-policy" className="hover:text-indigo-600 transition-colors">
              Refund &amp; Cancellation
            </Link>
            <Link href="/contact" className="hover:text-indigo-600 transition-colors">
              Contact Support
            </Link>
          </div>

          <p className="text-[11px] text-slate-400">
            &copy; {currentYear} Ugrahak. All rights reserved.
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className={`border-t border-slate-200 bg-white text-slate-600 ${className}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-slate-100">
          {/* Brand & Purpose (5 Cols) */}
          <div className="md:col-span-5 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-xs">
                <Store className="w-5 h-5" />
              </div>
              <span className="font-black text-xl text-slate-900 tracking-tight">
                Ugrahak
              </span>
            </Link>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm">
              Turn first-time customers into repeat loyal customers. Built specifically for local retail shops, cafes, salons, and Indian merchants.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>7 Days Free Trial &bull; No Credit Card Required</span>
            </div>
          </div>

          {/* Product Links (3 Cols) */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Product
            </h4>
            <ul className="space-y-2 text-xs font-medium text-slate-600">
              <li>
                <Link href="/" className="hover:text-indigo-600 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-indigo-600 transition-colors">
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link href="/nearby" className="hover:text-indigo-600 transition-colors">
                  Nearby Offers Discovery
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-indigo-600 transition-colors">
                  Create Free Merchant Account
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-indigo-600 transition-colors">
                  Merchant Login
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
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Terms &amp; Conditions</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/refund-policy"
                  className="hover:text-indigo-600 transition-colors inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Refund &amp; Cancellation</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-indigo-600 transition-colors inline-flex items-center gap-1.5"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span>Contact Support</span>
                </Link>
              </li>
            </ul>

            <div className="pt-2 text-[11px] text-slate-400 leading-normal flex items-start gap-1.5">
              <Mail className="w-3.5 h-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
              <span>Merchant support available Mon–Sat (10:00 AM – 6:00 PM IST).</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>100% Isolated Merchant Customer Databases &bull; SSL Secured</span>
          </div>

          <p className="text-[11px] text-slate-400">
            &copy; {currentYear} Ugrahak. Built for Local Businesses in India.
          </p>
        </div>
      </div>
    </footer>
  );
};

