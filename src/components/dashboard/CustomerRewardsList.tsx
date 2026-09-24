"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { CheckCircle2, Ticket, Sparkles } from "lucide-react";
import type { Reward } from "@/lib/types/database";

interface CustomerRewardsListProps {
  initialRewards: Reward[];
}

export const CustomerRewardsList: React.FC<CustomerRewardsListProps> = ({
  initialRewards,
}) => {
  const router = useRouter();
  const [rewards, setRewards] = useState<Reward[]>(initialRewards);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleRedeem = async (reward: Reward) => {
    if (
      !confirm(
        `Are you sure you want to redeem reward "${reward.title}" (Code: ${reward.reference_code})?`
      )
    ) {
      return;
    }

    setRedeemingId(reward.id);
    setFeedback(null);

    try {
      const res = await fetch("/api/merchant/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference_code: reward.reference_code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFeedback({
          type: "error",
          message: data.error || "Failed to redeem reward.",
        });
      } else {
        setFeedback({
          type: "success",
          message: `Reward "${reward.title}" redeemed successfully!`,
        });
        setRewards(
          rewards.map((r) =>
            r.id === reward.id ? { ...r, status: "REDEEMED" } : r
          )
        );
        router.refresh();
      }
      setRedeemingId(null);
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Error redeeming reward.",
      });
      setRedeemingId(null);
    }
  };

  if (rewards.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-400">
        No rewards recorded for this customer.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {feedback && (
        <Alert
          type={feedback.type}
          message={feedback.message}
          className="text-xs"
        />
      )}

      {rewards.map((reward) => (
        <div
          key={reward.id}
          className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between gap-3 shadow-xs"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                {reward.title}
              </h4>
              {reward.description && (
                <p className="text-xs text-slate-500 mt-0.5">
                  {reward.description}
                </p>
              )}
            </div>
            <div>
              {reward.status === "ACTIVE" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                  Active
                </span>
              )}
              {reward.status === "REDEEMED" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200 text-slate-700">
                  Redeemed
                </span>
              )}
              {reward.status === "EXPIRED" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800">
                  Expired
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200/70 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-800 font-semibold bg-white px-2 py-0.5 rounded border border-slate-200">
                Code: {reward.reference_code}
              </span>
              <span className="text-slate-400 text-[11px]">
                Issued {new Date(reward.issued_at).toLocaleDateString()}
              </span>
            </div>

            {reward.status === "ACTIVE" && (
              <Button
                size="sm"
                onClick={() => handleRedeem(reward)}
                isLoading={redeemingId === reward.id}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 min-h-[36px] self-end sm:self-auto"
              >
                <Ticket className="w-3.5 h-3.5 mr-1" />
                <span>Redeem Reward</span>
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

