import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import {
  ArrowLeft,
  Tag,
  Send,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import type { Offer, NotificationLog } from "@/lib/types/database";

interface OfferDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function OfferDetailPage({ params }: OfferDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Fetch Offer strictly verifying merchant ownership
  const { data: offer, error: offerError } = await supabase
    .from("offers")
    .select("*")
    .eq("id", id)
    .eq("merchant_id", user.id)
    .maybeSingle<Offer>();

  if (offerError || !offer) {
    notFound();
  }

  // 2. Fetch Notification Logs for this offer
  const { data: logs } = await supabase
    .from("notification_logs")
    .select("*")
    .eq("offer_id", id)
    .eq("merchant_id", user.id)
    .order("sent_at", { ascending: false });

  const typedLogs = (logs || []) as NotificationLog[];

  const successfulSends = typedLogs.filter((l) => l.status === "SENT").length;
  const failedSends = typedLogs.filter((l) => l.status === "FAILED").length;
  const invalidTokens = typedLogs.filter((l) => l.status === "INVALID_TOKEN").length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/dashboard/offers"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Offers
      </Link>

      {/* Offer Summary Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  offer.status === "ACTIVE"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {offer.status}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ID: {offer.id.slice(0, 8)}...
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">
              {offer.title}
            </h1>
          </div>
        </div>

        <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
          {offer.message}
        </p>

        {offer.start_at && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>
              Schedule: {new Date(offer.start_at).toLocaleDateString()}
              {offer.end_at ? ` to ${new Date(offer.end_at).toLocaleDateString()}` : ""}
            </span>
          </div>
        )}
      </div>

      {/* Broadcast Delivery Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-500">
            Successful Deliveries
          </span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {successfulSends}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Failed Deliveries</span>
          <p className="text-2xl font-bold text-rose-600 mt-1">{failedSends}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-500">
            Invalid / Unregistered Tokens
          </span>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {invalidTokens}
          </p>
        </div>
      </div>

      {/* Delivery Log Table */}
      <Card
        title="Offer Delivery Logs"
        description="Delivery log for each broadcast attempt of this offer."
      >
        {typedLogs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No broadcast runs recorded for this offer yet. Click &ldquo;SEND TO ALL CUSTOMERS&rdquo; on the Offers page to send.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Sent At</th>
                  <th className="px-4 py-3">Token Mask</th>
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {typedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      {log.status === "SENT" && (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3" />
                          Sent
                        </span>
                      )}
                      {log.status === "FAILED" && (
                        <span className="inline-flex items-center gap-1 font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                          <XCircle className="w-3 h-3" />
                          Failed
                        </span>
                      )}
                      {log.status === "INVALID_TOKEN" && (
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          <AlertTriangle className="w-3 h-3" />
                          Unregistered
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {new Date(log.sent_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">
                      {log.token ? `${log.token.slice(0, 10)}...${log.token.slice(-6)}` : "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {log.error_message || "Delivered to device"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

