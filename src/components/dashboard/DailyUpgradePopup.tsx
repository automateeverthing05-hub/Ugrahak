"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { IST_TIMEZONE } from "@/lib/utils/formatters";

interface DailyUpgradePopupProps {
  merchantId: string;
  merchantPlan: string;
  totalCustomers: number;
  /** Server-persisted IST date string (YYYY-MM-DD), null if never shown */
  lastUpgradePopupDate?: string | null;
}

const STORAGE_KEY_PREFIX = "ugrahak_upgrade_popup_";

/**
 * Returns today's IST date string: "YYYY-MM-DD"
 */
function getTodayIST(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: IST_TIMEZONE });
}

/**
 * DailyUpgradePopup
 *
 * Displays a dismissible upgrade prompt when ALL conditions are met:
 * 1. Merchant is on the FREE plan
 * 2. Total customers >= 100
 * 3. Popup has NOT been shown today (IST), checked via localStorage + server date
 * 4. No other session has dismissed it today (cross-tab via localStorage)
 *
 * Closing records the date in localStorage immediately and persists to server
 * so multiple tabs and future logins on the same day won't re-show it.
 */
export const DailyUpgradePopup: React.FC<DailyUpgradePopupProps> = ({
  merchantId,
  merchantPlan,
  totalCustomers,
  lastUpgradePopupDate,
}) => {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const dismissing = useRef(false);

  const storageKey = `${STORAGE_KEY_PREFIX}${merchantId}`;

  const checkEligibility = useCallback(() => {
    // Must be FREE plan
    if (merchantPlan !== "FREE") return false;

    // Must have >= 100 customers
    if (totalCustomers < 100) return false;

    const todayIST = getTodayIST();

    // Check localStorage first (instant, no network)
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored === todayIST) return false;
    } catch {
      // localStorage unavailable (SSR or private mode)
    }

    // Check server-persisted date (cross-device)
    if (lastUpgradePopupDate && lastUpgradePopupDate >= todayIST) {
      // Also sync local storage to avoid future network call
      try {
        localStorage.setItem(storageKey, todayIST);
      } catch { /* noop */ }
      return false;
    }

    return true;
  }, [merchantId, merchantPlan, totalCustomers, lastUpgradePopupDate, storageKey]);

  useEffect(() => {
    // Small delay so the popup appears after the dashboard content renders
    const timer = setTimeout(() => {
      if (checkEligibility()) {
        setIsVisible(true);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [checkEligibility]);

  const dismiss = useCallback(() => {
    if (dismissing.current) return;
    dismissing.current = true;

    setIsVisible(false);

    const todayIST = getTodayIST();

    // 1. Record in localStorage immediately (synchronous)
    try {
      localStorage.setItem(storageKey, todayIST);
    } catch { /* noop */ }

    // 2. Persist to server asynchronously (non-blocking)
    fetch("/api/merchant/popup-dismiss", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }).catch(() => { /* Non-critical */ });
  }, [storageKey]);

  const handleUpgrade = useCallback(() => {
    dismiss();
    router.push("/dashboard/billing");
  }, [dismiss, router]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-popup-title"
    >
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative space-y-5">
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
          aria-label="Close upgrade popup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto border border-indigo-100 shadow-inner">
          <Sparkles className="w-8 h-8 text-indigo-600" />
        </div>

        {/* Content */}
        <div className="text-center space-y-2">
          <h3
            id="upgrade-popup-title"
            className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-snug"
          >
            Ready to Grow Beyond 100 Customers?
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">
            Upgrade your Ugrahak plan to unlock a higher customer limit and the features included in your selected plan.
          </p>
        </div>

        {/* Plan highlights */}
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 text-left space-y-2">
          <p className="text-xs font-bold text-indigo-900">Upgrade Options:</p>
          <ul className="text-[11px] text-indigo-800 space-y-1.5 list-none">
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 font-bold mt-0.5">→</span>
              <span><strong>Starter — ₹499/mo:</strong> Up to 1,500 customers, unlimited Send Offers</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 font-bold mt-0.5">→</span>
              <span><strong>Growth — ₹1,499/mo:</strong> Up to 5,000 customers + Nearby Offers</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 font-bold mt-0.5">→</span>
              <span><strong>Pro — ₹2,999/mo:</strong> Up to 10,000 customers + Advanced Analytics</span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={dismiss}
            className="py-3 px-4 rounded-2xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 font-semibold text-xs sm:text-sm transition-colors min-h-[44px]"
          >
            Maybe Later
          </button>
          <button
            onClick={handleUpgrade}
            className="py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm transition-colors min-h-[44px] inline-flex items-center justify-center gap-1.5"
          >
            <span>Upgrade Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-[10px] text-slate-400 text-center">
          Your existing customers, offers, and data are fully preserved after upgrading.
        </p>
      </div>
    </div>
  );
};

