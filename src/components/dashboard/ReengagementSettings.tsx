"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  Heart,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Play,
  Clock,
  Gift,
  History,
  Info,
} from "lucide-react";
import type { Offer } from "@/lib/types/database";

interface ReengagementSettingsProps {
  initialIsEnabled?: boolean;
  initialOfferId?: string | null;
  shopName: string;
}

interface CampaignRecord {
  id: string;
  customer_id: string;
  offer_id: string | null;
  last_qualifying_visit_at: string;
  scheduled_at: string;
  sent_at: string | null;
  status: "PENDING" | "PROCESSING" | "SENT" | "FAILED" | "SKIPPED";
  error_message: string | null;
  created_at: string;
  customer?: {
    name: string;
    phone: string;
  };
  offer?: {
    title: string;
  };
}

export const ReengagementSettings: React.FC<ReengagementSettingsProps> = ({
  initialIsEnabled = false,
  initialOfferId = null,
  shopName,
}) => {
  const [isEnabled, setIsEnabled] = useState(initialIsEnabled);
  const [selectedOfferId, setSelectedOfferId] = useState<string>(initialOfferId || "");
  const [availableOffers, setAvailableOffers] = useState<Offer[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchAutomationsData();
  }, []);

  const fetchAutomationsData = async () => {
    try {
      const res = await fetch("/api/merchant/automations");
      const data = await res.json();
      if (res.ok) {
        setIsEnabled(data.settings?.is_reengagement_enabled ?? false);
        setSelectedOfferId(data.settings?.reengagement_offer_id ?? "");
        setAvailableOffers(data.offers || []);
        setCampaigns(data.campaigns || []);
      }
    } catch {
      // Ignore
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/merchant/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_reengagement_enabled: isEnabled,
          reengagement_offer_id: selectedOfferId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save re-engagement settings.");
      } else {
        setSuccess("Re-engagement settings updated successfully.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestTrigger = async () => {
    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/cron/process-inactive-reengagement");
      const data = await res.json();

      if (res.ok) {
        const scanned = data.scan?.scanned || 0;
        const scheduled = data.scan?.scheduled || 0;
        const sent = data.dispatch?.sent || 0;
        const skipped = data.dispatch?.skipped || 0;
        setSuccess(
          `Scheduler executed: Scanned ${scanned} customers (${scheduled} scheduled, ${sent} sent, ${skipped} skipped).`
        );
        fetchAutomationsData();
      } else {
        setError(data.error || "Error running scheduler.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error executing scheduler.");
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedOffer = availableOffers.find((o) => o.id === selectedOfferId);

  return (
    <div className="space-y-6">
      {/* Main Configuration Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                &ldquo;We Miss You&rdquo; Retention Automation
              </h3>
              <p className="text-xs text-slate-500">
                Automatically invite customers back with a special offer after 30 days of inactivity.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsEnabled(!isEnabled)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isEnabled
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-slate-200 text-slate-600 hover:bg-slate-300"
              }`}
            >
              <span>{isEnabled ? "Automation: ON" : "Automation: OFF"}</span>
            </button>

            {isEnabled && selectedOffer ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Active</span>
              </span>
            ) : isEnabled && !selectedOffer ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Offer Required</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                Paused
              </span>
            )}
          </div>
        </div>

        {error && <Alert type="error" message={error} className="text-xs" />}
        {success && <Alert type="success" message={success} className="text-xs" />}

        {/* How It Works Explainer Box */}
        <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl text-xs text-rose-900 space-y-1.5">
          <p className="font-bold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-rose-600" />
            <span>How 30-Day Re-engagement Works:</span>
          </p>
          <ul className="list-disc list-inside space-y-1 text-rose-800 text-[11px]">
            <li>Identifies customers who have not had a qualifying visit for <strong>30 complete days</strong>.</li>
            <li>Sends a personalized push reminder using your real shop name and selected active offer.</li>
            <li>If the customer returns or visits before delivery, the cycle resets automatically.</li>
            <li>Prevents duplicate sends for the same inactivity period via database-backed cycle tracking.</li>
            <li>Respects customer push permissions and your monthly Send Offer recipient quota.</li>
          </ul>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Select Re-engagement Offer
            </label>
            {availableOffers.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span>
                  No active offers found. Please create an active offer in the <strong>Offers</strong> section before enabling this automation.
                </span>
              </div>
            ) : (
              <select
                value={selectedOfferId}
                onChange={(e) => setSelectedOfferId(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">-- Choose an active offer --</option>
                {availableOffers.map((offer) => (
                  <option key={offer.id} value={offer.id}>
                    {offer.title} {offer.end_at ? `(Expires: ${new Date(offer.end_at).toLocaleDateString()})` : ""}
                  </option>
                ))}
              </select>
            )}
            <p className="text-[11px] text-slate-500 mt-1">
              This offer will be featured in the personalized notification sent to inactive customers.
            </p>
          </div>

          {/* Live Message Preview Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-rose-600" />
                <span>Live Notification Preview:</span>
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Personalized</span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
              <div className="font-bold text-slate-900">
                We Miss You, Rahul! ❤️
              </div>
              <div className="text-slate-600 text-[11px] leading-relaxed">
                {shopName} par aapko aaye hue 30 din ho gaye hain. Wapas aaiye aur apna special offer paaiye:{" "}
                <span className="font-semibold text-rose-600">
                  {selectedOffer ? selectedOffer.title : "[Select an offer above]"}
                </span>{" "}
                (Valid till{" "}
                {selectedOffer?.end_at
                  ? new Date(selectedOffer.end_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })
                  : "Limited Time"}
                ).
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              type="submit"
              size="md"
              isLoading={isSaving}
              className="bg-rose-600 hover:bg-rose-700 text-white min-h-[42px]"
            >
              Save Re-engagement Settings
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestTrigger}
              isLoading={isProcessing}
              className="gap-1.5 text-xs ml-auto min-h-[42px]"
              title="Test 30-day inactivity scan & dispatch"
            >
              <Play className="w-3.5 h-3.5 text-rose-600" />
              <span>Run Inactivity Scan Now</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Campaign Execution History Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-rose-600" />
            <h4 className="text-base font-bold text-slate-900">
              Re-engagement Campaign History
            </h4>
          </div>
          <button
            onClick={fetchAutomationsData}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            title="Refresh history"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {campaigns.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No re-engagement campaigns recorded yet. Customers reaching 30 days of inactivity will appear here with delivery details.
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((camp) => (
              <div
                key={camp.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">
                      {camp.customer?.name || "Customer"}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        camp.status === "SENT"
                          ? "bg-emerald-100 text-emerald-800"
                          : camp.status === "PENDING"
                          ? "bg-blue-100 text-blue-800"
                          : camp.status === "SKIPPED"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {camp.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-1">
                    <span>
                      Offer: <strong>{camp.offer?.title || "Special Offer"}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Last Visit: {new Date(camp.last_qualifying_visit_at).toLocaleDateString()}
                    </span>
                    {camp.sent_at && (
                      <span className="text-emerald-700">
                        &bull; Sent: {new Date(camp.sent_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {camp.error_message && (
                    <p className="text-[11px] text-amber-700 mt-1 font-medium">
                      Note: {camp.error_message}
                    </p>
                  )}
                </div>

                {camp.status === "PENDING" && (
                  <span className="text-[11px] text-blue-600 font-semibold self-end sm:self-auto bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200">
                    Awaiting dispatch
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

