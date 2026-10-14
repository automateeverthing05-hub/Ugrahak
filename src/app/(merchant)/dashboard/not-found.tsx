import React from "react";
import Link from "next/link";
import { LayoutDashboard, ArrowLeft, Store } from "lucide-react";

export default function DashboardNotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto shadow-2xs">
          <Store className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
            404 &middot; डैशबोर्ड सेक्शन अनुपलब्ध
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            यह पेज या रिकॉर्ड नहीं मिला
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            जिस ग्राहक, ऑफ़र या सेटिंग पेज को आप देखना चाहते हैं, वह उपलब्ध नहीं है या हटा दिया गया है।
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <Link
            href="/dashboard"
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs min-h-[48px]"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>डैशबोर्ड होम पर लौटें</span>
          </Link>

          <Link
            href="/dashboard/customers"
            className="inline-flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors min-h-[48px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ग्राहक सूची</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
