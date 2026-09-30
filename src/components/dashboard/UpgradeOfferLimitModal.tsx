"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, X, ArrowRight, Layers } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface UpgradeOfferLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  used?: number;
  limit?: number;
  remaining?: number;
}

export const UpgradeOfferLimitModal: React.FC<UpgradeOfferLimitModalProps> = ({
  isOpen,
  onClose,
  used,
  limit = 100,
  remaining,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
    >
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 text-center space-y-5 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner border border-indigo-100">
          <Sparkles className="w-8 h-8 text-indigo-600" />
        </div>

        {/* Title & Message */}
        <div className="space-y-2">
          <h3
            id="upgrade-modal-title"
            className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-snug"
          >
            You&apos;ve reached your 100 customer offer limit
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">
            Upgrade your plan to send offers to more customers.
          </p>
        </div>

        {/* Quota Context Badge (if available) */}
        {typeof used === "number" && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-600 flex items-center justify-around">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Monthly Used</span>
              <span className="font-extrabold text-slate-900 text-sm">{used} / {limit}</span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Remaining</span>
              <span className="font-extrabold text-rose-600 text-sm">{typeof remaining === "number" ? remaining : 0}</span>
            </div>
          </div>
        )}

        {/* Plan comparison highlight */}
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3.5 text-left text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-indigo-900">
            <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Paid Plan Benefits:</span>
          </div>
          <ul className="text-indigo-800 text-[11px] space-y-1 pl-5 list-disc">
            <li><strong>Starter (₹999/mo):</strong> Send offers to up to 1,500 customers</li>
            <li><strong>Growth (₹2,999/mo):</strong> Send offers to up to 5,000 customers + GPS Nearby Offers</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <Link
            href="/pricing"
            onClick={onClose}
            className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 font-bold text-xs sm:text-sm transition-colors min-h-[44px]"
          >
            View Pricing
          </Link>
          <Link
            href="/dashboard/settings"
            onClick={onClose}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm transition-colors shadow-sm min-h-[44px]"
          >
            <span>Upgrade Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

