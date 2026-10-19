"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PLANS, getPlanConfig } from "@/lib/billing/plans";
import { formatINR } from "@/lib/utils/formatters";
import { ArrowRight, Check, Sparkles, Shield, X } from "lucide-react";
import type { PlanId } from "@/lib/billing/plans";

// Razorpay type stub (loaded via CDN script tag)
declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: Record<string, unknown>) => void) => void;
    };
  }
}

interface RazorpayCheckoutProps {
  merchantId: string;
  shopName: string;
  merchantEmail?: string;
  /** Currently selected plan — if null, shows plan selection UI */
  initialPlan?: PlanId | null;
  onSuccess?: (plan: PlanId) => void;
  onClose?: () => void;
}

type CheckoutStep = "select" | "processing" | "success" | "error";

function ensureRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window.Razorpay !== "undefined") {
      resolve();
      return;
    }
    const existing = document.getElementById("razorpay-checkout-js");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay script")));
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay Checkout script"));
    document.head.appendChild(script);
  });
}

const PAID_PLANS: PlanId[] = ["STARTER", "GROWTH", "PRO"];

export const RazorpayCheckout: React.FC<RazorpayCheckoutProps> = ({
  merchantId,
  shopName,
  merchantEmail,
  initialPlan,
  onSuccess,
  onClose,
}) => {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(initialPlan || null);
  const [step, setStep] = useState<CheckoutStep>("select");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activatedPlan, setActivatedPlan] = useState<PlanId | null>(null);

  const startCheckout = useCallback(async (planId: PlanId) => {
    setStep("processing");
    setErrorMessage(null);

    try {
      // 1. Load Razorpay Checkout script from CDN
      await ensureRazorpayScript();

      // 2. Create order on server (validates price server-side)
      const orderRes = await fetch("/api/billing/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });

      const orderData = await orderRes.json() as {
        orderId?: string;
        amount?: number;
        currency?: string;
        keyId?: string;
        planName?: string;
        amountINR?: number;
        error?: string;
      };

      if (!orderRes.ok || !orderData.orderId) {
        throw new Error(orderData.error || "Failed to create payment order. Please try again.");
      }

      // 3. Open Razorpay Checkout modal
      const rzpOptions: Record<string, unknown> = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "U-Grahak",
        description: `${orderData.planName} Plan — ₹${orderData.amountINR}/month`,
        order_id: orderData.orderId,
        prefill: {
          name: shopName,
          email: merchantEmail || "",
        },
        theme: { color: "#4f46e5" },
        modal: { escape: false },
        handler: async (response: Record<string, unknown>) => {
          // 4. Verify payment on server
          try {
            const verifyRes = await fetch("/api/billing/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                plan: planId,
              }),
            });

            const verifyData = await verifyRes.json() as {
              success?: boolean;
              plan?: PlanId;
              planName?: string;
              error?: string;
            };

            if (verifyData.success) {
              setActivatedPlan(verifyData.plan || planId);
              setStep("success");
              onSuccess?.(verifyData.plan || planId);
            } else {
              setErrorMessage(verifyData.error || "Payment verification failed. Contact support.");
              setStep("error");
            }
          } catch {
            setErrorMessage("Network error during verification. Contact support if amount was deducted.");
            setStep("error");
          }
        },
      };

      const rzp = new window.Razorpay(rzpOptions);
      rzp.on("payment.failed", () => {
        setErrorMessage("Payment was not completed. No amount was charged.");
        setStep("error");
      });
      rzp.open();
      // Reset step back to select so user can retry if they close the modal
      setStep("select");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Checkout failed. Please try again.");
      setStep("error");
    }
  }, [shopName, merchantEmail, onSuccess]);

  if (step === "success" && activatedPlan) {
    const plan = getPlanConfig(activatedPlan);
    return (
      <div className="text-center space-y-4 py-6">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto border border-emerald-200">
          <Check className="w-8 h-8 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-xl font-extrabold text-slate-900">Subscription Activated!</h3>
          <p className="text-sm text-slate-600 mt-1">
            Your <strong>{plan.name}</strong> plan is now active. You can add up to{" "}
            <strong>{typeof plan.customerLimit === "number" ? plan.customerLimit.toLocaleString("en-IN") : "unlimited"} customers</strong>.
          </p>
        </div>
        <button
          onClick={() => { onClose?.(); router.refresh(); }}
          className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="text-center space-y-4 py-6">
        <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto border border-rose-200">
          <X className="w-8 h-8 text-rose-600" />
        </div>
        <div>
          <h3 className="text-xl font-extrabold text-slate-900">Payment Unsuccessful</h3>
          <p className="text-sm text-rose-600 mt-1">{errorMessage}</p>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => { setStep("select"); setErrorMessage(null); }}
            className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-2">
          <Sparkles className="w-6 h-6 text-indigo-600" />
        </div>
        <h3 className="text-lg font-extrabold text-slate-900">Upgrade Your Plan</h3>
        <p className="text-xs text-slate-500">Select a plan and pay securely via Razorpay</p>
      </div>

      {/* Plan Selection */}
      <div className="grid grid-cols-1 gap-3">
        {PAID_PLANS.map((planId) => {
          const plan = PLANS[planId];
          const isSelected = selectedPlan === planId;
          return (
            <button
              key={planId}
              onClick={() => setSelectedPlan(planId)}
              className={`text-left p-4 rounded-2xl border-2 transition-all ${
                isSelected
                  ? "border-indigo-600 bg-indigo-50/80"
                  : "border-slate-200 bg-white hover:border-indigo-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 text-sm">{plan.name}</span>
                  {planId === "GROWTH" && (
                    <span className="ml-2 text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                      Popular
                    </span>
                  )}
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {typeof plan.customerLimit === "number"
                      ? `Up to ${plan.customerLimit.toLocaleString("en-IN")} customers`
                      : "Unlimited customers"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-extrabold text-slate-900">{formatINR(plan.priceINR)}</span>
                  <span className="text-xs text-slate-500">/mo</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Security badge */}
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
        <Shield className="w-3.5 h-3.5 text-emerald-600" />
        <span>256-bit encrypted payments via Razorpay</span>
      </div>

      {/* CTA */}
      <button
        disabled={!selectedPlan || step === "processing"}
        onClick={() => selectedPlan && startCheckout(selectedPlan)}
        className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-colors min-h-[48px] inline-flex items-center justify-center gap-2 ${
          selectedPlan
            ? "bg-indigo-600 hover:bg-indigo-700 text-white"
            : "bg-slate-100 text-slate-400 cursor-not-allowed"
        }`}
      >
        {step === "processing" ? (
          <span>Opening Checkout…</span>
        ) : (
          <>
            <span>
              {selectedPlan ? `Pay ${formatINR(PLANS[selectedPlan].priceINR)}/month` : "Select a Plan"}
            </span>
            {selectedPlan && <ArrowRight className="w-4 h-4" />}
          </>
        )}
      </button>

      <p className="text-[10px] text-slate-400 text-center">
        Your existing customers, offers, rewards, and QR codes are preserved. Cancel any time.
      </p>
    </div>
  );
};

