import React from "react";
import Link from "next/link";
import { Store, ArrowLeft, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center selection:bg-emerald-600 selection:text-white">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
          <Store className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md">
            404 &middot; पेज नहीं मिला
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            यह पेज या दुकान लिंक उपलब्ध नहीं है
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            हो सकता है कि आपने गलत लिंक खोला हो या दुकान का QR कोड अपडेट हो गया हो। कृपया दुकान के काउंटर पर लगे QR कोड को दोबारा स्कैन करें।
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs min-h-[48px]"
          >
            <Home className="w-4 h-4" />
            <span>मुख्य होम पेज</span>
          </Link>

          <Link
            href="/nearby"
            className="inline-flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors min-h-[48px]"
          >
            <Search className="w-4 h-4" />
            <span>आसपास की दुकानें देखें</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
