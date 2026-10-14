"use client";

import React, { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { AlertCircle, RefreshCw, LayoutDashboard, MessageCircle } from "lucide-react";
import { LANDING_CONFIG } from "@/lib/landing/config";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected dashboard exceptions to Sentry safely
    Sentry.captureException(error);
  }, [error]);

  const hasWhatsApp = Boolean(LANDING_CONFIG.WHATSAPP_NUMBER);
  const whatsappUrl = hasWhatsApp
    ? `https://wa.me/${LANDING_CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent("Dashboard में समस्या आ रही है")}`
    : "/contact";

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-2xs">
          <AlertCircle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            डैशबोर्ड लोड नहीं हो पाया
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            आपके डेटा या दुकान सेटिंग्स को कोई नुकसान नहीं हुआ है। कृपया पेज दोबारा लोड करके देखें।
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs min-h-[48px]"
          >
            <RefreshCw className="w-4 h-4" />
            <span>फिर से लोड करें</span>
          </button>

          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors min-h-[48px]"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>डैशबोर्ड होम</span>
          </Link>
        </div>

        <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          {hasWhatsApp ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp सहायता से जुड़ें</span>
            </a>
          ) : (
            <span>
              सहायता के लिए{" "}
              <Link href="/contact" className="text-emerald-700 font-bold hover:underline">
                सपोर्ट पेज पर जाएँ
              </Link>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
