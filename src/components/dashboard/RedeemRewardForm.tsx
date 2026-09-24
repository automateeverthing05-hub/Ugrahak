"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { maskPhone } from "@/lib/utils/referenceCode";
import { Gift, CheckCircle2, Ticket, Sparkles, User, Calendar, RotateCcw } from "lucide-react";

interface RedemptionResult {
  message: string;
  reward: {
    id: string;
    title: string;
    description: string | null;
    discount_value: string | null;
    reference_code: string;
    redeemed_at: string;
  };
  customer: {
    name: string;
    phone: string;
  } | null;
}

export const RedeemRewardForm: React.FC = () => {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [result, setResult] = useState<RedemptionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setResult(null);

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setError("Please enter the customer's reward reference code.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/merchant/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reference_code: cleanCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to redeem code.");
        setIsLoading(false);
        return;
      }

      setSuccess(data.message || "Reward redeemed successfully!");
      setResult(data);
      setCode("");
      setIsLoading(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setSuccess(null);
    setError(null);
    setCode("");
  };

  return (
    <div className="space-y-6">
      <Card
        title="Redeem Customer Reward"
        description="Enter the unique reference code presented by your customer at billing counter."
      >
        {error && <Alert type="error" message={error} className="mb-4" />}
        {success && <Alert type="success" message={success} className="mb-4" />}

        <form onSubmit={handleRedeem} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <Input
                label="Reward Reference Code"
                placeholder="e.g. AG-7K9M-3P2Q"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="font-mono uppercase tracking-wider text-base"
                helperText="Enter exact code shown on the customer's screen."
              />
            </div>

            <Button
              type="submit"
              size="md"
              isLoading={isLoading}
              className="w-full sm:w-auto h-[42px] px-6"
            >
              Verify & Redeem
            </Button>
          </div>
        </form>
      </Card>

      {/* Successfully Redeemed Certificate / Summary Card */}
      {result && (
        <div className="bg-emerald-50/70 border-2 border-emerald-300 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-950">
                Reward Redeemed Successfully!
              </h3>
              <p className="text-xs text-emerald-800">
                You can now apply the discount / offer to the customer&apos;s bill.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="bg-white p-3.5 rounded-xl border border-emerald-200">
              <span className="text-[11px] text-slate-500 font-medium uppercase">
                Customer
              </span>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">
                {result.customer?.name || "Verified Customer"}
              </p>
              {result.customer?.phone && (
                <p className="text-xs text-slate-500">
                  {maskPhone(result.customer.phone)}
                </p>
              )}
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-emerald-200">
              <span className="text-[11px] text-slate-500 font-medium uppercase">
                Reward Value
              </span>
              <p className="text-sm font-bold text-indigo-700 mt-0.5">
                {result.reward.title}
              </p>
              <p className="text-xs font-mono text-slate-600">
                Code: {result.reward.reference_code}
              </p>
            </div>
          </div>

          <div className="pt-2 text-right">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-1.5 text-xs bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-100"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Redeem Another Reward
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

