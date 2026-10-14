"use client";

import React, { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home, Headphones } from "lucide-react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Send telemetry to Sentry without showing technical stack trace to user
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
          <AlertCircle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            पेज लोड करने में रुकावट आई
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            यह एक अस्थायी तकनीकी समस्या हो सकती है। कृपया नीचे दिए गए बटन से पुनः प्रयास करें।
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs min-h-[48px]"
          >
            <RefreshCw className="w-4 h-4" />
            <span>फिर से कोशिश करें</span>
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors min-h-[48px]"
          >
            <Home className="w-4 h-4" />
            <span>होम पेज</span>
          </Link>
        </div>

        <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <Headphones className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span>
            मदद चाहिए?{" "}
            <Link href="/contact" className="text-emerald-700 font-bold hover:underline">
              सपोर्ट टीम से बात करें
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}

