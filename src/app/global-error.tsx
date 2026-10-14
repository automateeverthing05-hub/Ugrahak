"use client";

import React, { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { AlertCircle, RefreshCw, ArrowLeft, Headphones } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report real error with digest to Sentry without exposing to UI
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="hi">
      <body className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4 selection:bg-emerald-600 selection:text-white font-sans antialiased">
        <main className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
            <AlertCircle className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              कुछ अप्रत्याशित समस्या आई
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              पेज लोड करने में रुकावट आई है। चिंता न करें, आपका डेटा सुरक्षित है। कृपया पेज दोबारा लोड करके देखें।
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
              <ArrowLeft className="w-4 h-4" />
              <span>मुख्य पेज पर जाएँ</span>
            </Link>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <Headphones className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span>
              समस्या बनी रहे तो{" "}
              <Link href="/contact" className="text-emerald-700 font-bold hover:underline">
                सहायता टीम से संपर्क करें
              </Link>
            </span>
          </div>
        </main>
      </body>
    </html>
  );
}
