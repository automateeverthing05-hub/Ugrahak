"use client";

import React, { useState } from "react";
import { PLANS, getPlanConfig, isCustomerLimitReached } from "@/lib/billing/plans";
import { formatINR, formatIndianNumber } from "@/lib/utils/formatters";
import { RazorpayCheckout } from "@/components/billing/RazorpayCheckout";
import { Check, CreditCard, ArrowRight, Users, Zap } from "lucide-react";
import type { Merchant } from "@/lib/types/database";
import type { PlanId } from "@/lib/billing/plans";

interface BillingPageClientProps {
  merchant: Merchant;
  merchantEmail: string;
  customerCount: number;
  initialPlan?: PlanId | null;
  initialAutoCheckout?: boolean;
}

export const BillingPageClient: React.FC<BillingPageClientProps> = ({
  merchant,
  merchantEmail,
  customerCount,
  initialPlan = null,
  initialAutoCheckout = false,
}) => {
  const [checkoutPlan, setCheckoutPlan] = useState<PlanId | null>(initialPlan);
  const [showCheckout, setShowCheckout] = useState<boolean>(
    initialAutoCheckout && initialPlan !== null && initialPlan !== "FREE"
  );


  const currentPlan = getPlanConfig(merchant.plan);
  const isUnlimited = currentPlan.customerLimit === "unlimited";
  const numericLimit = isUnlimited ? 0 : (currentPlan.customerLimit as number);
  const usagePct = isUnlimited ? 0 : Math.min(100, Math.round((customerCount / numericLimit) * 100));

  const limitCheck = isCustomerLimitReached(customerCount, merchant.plan);

  const handleSelectPlan = (planId: PlanId) => {
    setCheckoutPlan(planId);
    setShowCheckout(true);
  };

  const handleCheckoutSuccess = () => {
    setShowCheckout(false);
    // Reload to get fresh plan data from server
    window.location.reload();
  };

  if (showCheckout) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm">
          <button
            onClick={() => setShowCheckout(false)}
            className="text-xs text-slate-500 hover:text-slate-800 mb-4 flex items-center gap-1"
          >
            ← Back to Plans
          </button>
          <RazorpayCheckout
            merchantId={merchant.id}
            shopName={merchant.shop_name}
            merchantEmail={merchantEmail}
            initialPlan={checkoutPlan}
            onSuccess={handleCheckoutSuccess}
            onClose={() => setShowCheckout(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Summary */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
              Current Plan: {currentPlan.name}
            </span>
            <p className="text-sm text-slate-500 mt-0.5">
              {currentPlan.priceINR === 0 ? "Free forever" : `${formatINR(currentPlan.priceINR)}/month`}
            </p>
          </div>
        </div>

        {/* Customer Quota */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              Customer Quota
            </span>
            <span className="font-bold text-slate-900">
              {formatIndianNumber(customerCount)} /{" "}
              {isUnlimited ? "Unlimited" : formatIndianNumber(numericLimit)} ({usagePct}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              style={{ width: `${usagePct}%` }}
              className={`h-full rounded-full transition-all ${usagePct >= 90 ? "bg-rose-500" : "bg-indigo-600"}`}
            />
          </div>
          {limitCheck.isReached && (
            <p className="text-xs text-rose-600 font-semibold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              Customer limit reached — upgrade to add more customers.
            </p>
          )}
        </div>
      </div>

      {/* Upgrade Section */}
      <div>
        <h2 className="text-base font-bold text-slate-900 mb-4">
          {merchant.plan === "FREE" ? "Upgrade Your Plan" : "Switch Plan"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(["STARTER", "GROWTH", "PRO"] as PlanId[]).map((planId) => {
            const plan = PLANS[planId];
            const isCurrent = merchant.plan === planId;
            const isPopular = planId === "GROWTH";

            return (
              <div
                key={planId}
                className={`relative bg-white rounded-2xl p-5 border flex flex-col justify-between shadow-xs transition-all ${
                  isPopular
                    ? "border-indigo-500 ring-1 ring-indigo-500"
                    : "border-slate-200"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                    Most Popular
                  </div>
                )}

                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-slate-900">
                      {formatINR(plan.priceINR)}
                    </span>
                    <span className="text-xs text-slate-500">/mo</span>
                  </div>
                  <p className="text-xs text-indigo-600 font-semibold mt-1">
                    {typeof plan.customerLimit === "number"
                      ? `Up to ${formatIndianNumber(plan.customerLimit)} customers`
                      : "Unlimited customers"}
                  </p>

                  <ul className="mt-4 space-y-1.5 text-xs text-slate-600">
                    {plan.features.slice(0, 4).map((feat, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-5">
                  {isCurrent ? (
                    <span className="w-full py-2.5 rounded-xl text-xs font-bold text-center block bg-slate-100 text-slate-500">
                      Current Plan
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSelectPlan(planId)}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold text-center inline-flex items-center justify-center gap-1 transition-colors ${
                        isPopular
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                          : "bg-slate-900 hover:bg-slate-800 text-white"
                      }`}
                    >
                      <span>Choose {plan.name}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Billing Footer */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <span>
          Payments are processed securely via Razorpay. Your data is always preserved when upgrading.
        </span>
        <div className="flex items-center gap-3 font-semibold text-indigo-600">
          <a href="/refund-policy" target="_blank" className="hover:underline">Refund Policy</a>
          <span className="text-slate-300">•</span>
          <a href="/terms" target="_blank" className="hover:underline">Terms</a>
          <span className="text-slate-300">•</span>
          <a href="/contact" target="_blank" className="hover:underline">Support</a>
        </div>
      </div>
    </div>
  );
};

