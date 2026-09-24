"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import {
  Star,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Clock,
  History,
  RotateCcw,
  Sparkles,
  Play,
} from "lucide-react";
import { isValidGoogleMapsUrl } from "@/lib/utils/validation";
import type { ReviewRequestWithCustomer } from "@/lib/reviews/reviewScheduler";

interface GoogleReviewsSettingsProps {
  initialGoogleMapsUrl: string | null;
  shopName: string;
}

export const GoogleReviewsSettings: React.FC<GoogleReviewsSettingsProps> = ({
  initialGoogleMapsUrl,
  shopName,
}) => {
  const [googleMapsUrl, setGoogleMapsUrl] = useState(initialGoogleMapsUrl || "");
  const [requests, setRequests] = useState<ReviewRequestWithCustomer[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchReviewRequests();
  }, []);

  const fetchReviewRequests = async () => {
    try {
      const res = await fetch("/api/merchant/review-requests");
      const data = await res.json();
      if (res.ok && data.requests) {
        setRequests(data.requests);
      }
    } catch {
      // Ignore
    }
  };

  const handleSaveUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanUrl = googleMapsUrl.trim();

    if (cleanUrl && !isValidGoogleMapsUrl(cleanUrl)) {
      setError("Please enter a valid Google Maps review URL (e.g. https://maps.app.goo.gl/... or https://g.page/r/...).");
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch("/api/merchant/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          google_maps_url: cleanUrl || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update review URL.");
      } else {
        setSuccess("Google Review link saved. Customers will automatically receive a review request 30 minutes after their first visit.");
      }
      setIsSaving(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
      setIsSaving(false);
    }
  };

  const handleTestTrigger = async () => {
    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/cron/process-review-requests");
      const data = await res.json();

      if (res.ok) {
        setSuccess(
          `Scheduler executed: ${data.summary?.processed || 0} processed (${data.summary?.sent || 0} sent, ${data.summary?.skipped || 0} skipped, ${data.summary?.failed || 0} failed).`
        );
        fetchReviewRequests();
      } else {
        setError(data.error || "Scheduler trigger error.");
      }
      setIsProcessing(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error triggering scheduler.");
      setIsProcessing(false);
    }
  };

  const isConfigured = Boolean(googleMapsUrl && googleMapsUrl.trim().startsWith("http"));

  return (
    <div className="space-y-6">
      {/* Main Configuration Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Automatic Google Review Requests
              </h3>
              <p className="text-xs text-slate-500">
                Automatically asks new customers for a 5-star Google review exactly 30 minutes after their first visit.
              </p>
            </div>
          </div>

          <div>
            {isConfigured ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Review Link Configured</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Link Not Configured</span>
              </span>
            )}
          </div>
        </div>

        {error && <Alert type="error" message={error} className="text-xs" />}
        {success && <Alert type="success" message={success} className="text-xs" />}

        {/* Explainer Box */}
        <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1.5">
          <p className="font-bold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>How Automatic Google Reviews Work:</span>
          </p>
          <ul className="list-disc list-inside space-y-1 text-amber-800 text-[11px]">
            <li>When a new customer completes their 1st QR scan, a review request is scheduled for <strong>+30 minutes</strong>.</li>
            <li>After 30 minutes, an automatic review reminder arrives: <em>&ldquo;How was your experience? ⭐&rdquo;</em></li>
            <li>Tapping the message opens your Google Maps review page directly (no app login or extra steps).</li>
            <li>Repeat visits do <strong>not</strong> trigger duplicate review requests.</li>
          </ul>
        </div>

        <form onSubmit={handleSaveUrl} className="space-y-4">
          <div>
            <Input
              label="Google Review Link"
              placeholder="https://maps.app.goo.gl/... or https://g.page/r/..."
              value={googleMapsUrl}
              onChange={(e) => setGoogleMapsUrl(e.target.value)}
              helperText="Customers will receive this link automatically after their first visit."
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button
              type="submit"
              size="md"
              isLoading={isSaving}
              className="bg-indigo-600 hover:bg-indigo-700 min-h-[42px]"
            >
              Save Google Review Link
            </Button>

            {isConfigured && (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors inline-flex items-center gap-1.5 min-h-[42px]"
              >
                <span>Test Google Link</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestTrigger}
              isLoading={isProcessing}
              className="gap-1.5 text-xs ml-auto min-h-[42px]"
              title="Test server-side review request scheduler now"
            >
              <Play className="w-3.5 h-3.5 text-indigo-600" />
              <span>Run Scheduler Now</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Review Request History Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            <h4 className="text-base font-bold text-slate-900">
              Review Request History & Status
            </h4>
          </div>
          <button
            onClick={fetchReviewRequests}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            title="Refresh list"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {requests.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No review requests recorded yet. When a new customer completes their first visit, a request will appear here with its 30-minute schedule.
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">
                      {req.customer?.name || "New Customer"}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        req.status === "SENT"
                          ? "bg-emerald-100 text-emerald-800"
                          : req.status === "PENDING"
                          ? "bg-blue-100 text-blue-800"
                          : req.status === "SKIPPED"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Scheduled: {new Date(req.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} (
                      {new Date(req.scheduled_at).toLocaleDateString()})
                    </span>
                    {req.sent_at && (
                      <span className="text-emerald-700">
                        &bull; Sent: {new Date(req.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>

                  {req.error_message && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">
                      Note: {req.error_message}
                    </p>
                  )}
                </div>

                {req.status === "PENDING" && (
                  <span className="text-[11px] text-blue-600 font-semibold self-end sm:self-auto bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200">
                    Awaiting 30-min window
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

