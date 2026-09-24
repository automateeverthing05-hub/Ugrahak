import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OffersList } from "@/components/dashboard/OffersList";
import { Send } from "lucide-react";
import type { Offer, NotificationLog } from "@/lib/types/database";

export default async function OffersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch offers, push tokens, and notification logs in parallel
  const [{ data: offers }, { data: pushTokens }, { data: logs }] = await Promise.all([
    supabase
      .from("offers")
      .select("*")
      .eq("merchant_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("push_tokens")
      .select("id")
      .eq("merchant_id", user.id)
      .eq("is_valid", true),
    supabase
      .from("notification_logs")
      .select("offer_id, status")
      .eq("merchant_id", user.id),
  ]);

  const typedOffers = (offers || []) as Offer[];
  const subscriberCount = pushTokens?.length || 0;
  const typedLogs = (logs || []) as NotificationLog[];

  // Compute delivery stats per offer_id
  const statsByOfferId: Record<
    string,
    { totalSent: number; totalFailed: number; invalidCount: number }
  > = {};

  typedLogs.forEach((log) => {
    if (!log.offer_id) return;
    if (!statsByOfferId[log.offer_id]) {
      statsByOfferId[log.offer_id] = { totalSent: 0, totalFailed: 0, invalidCount: 0 };
    }
    if (log.status === "SENT") {
      statsByOfferId[log.offer_id].totalSent += 1;
    } else if (log.status === "INVALID_TOKEN") {
      statsByOfferId[log.offer_id].invalidCount += 1;
    } else {
      statsByOfferId[log.offer_id].totalFailed += 1;
    }
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Send Offer to Customers
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Broadcast special promotional offers and instant push alerts directly to your customer devices.
            </p>
          </div>
        </div>

        <div className="text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto shadow-xs">
          {subscriberCount} Subscriber(s)
        </div>
      </div>

      <OffersList
        initialOffers={typedOffers}
        subscriberCount={subscriberCount}
        initialStats={statsByOfferId}
      />
    </div>
  );
}
