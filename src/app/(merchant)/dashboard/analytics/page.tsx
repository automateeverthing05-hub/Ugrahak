import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AnalyticsDashboard } from "@/components/dashboard/AnalyticsDashboard";
import { BarChart3 } from "lucide-react";
import type { Customer, CustomerVisit, Reward, Offer, NotificationLog } from "@/lib/types/database";

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Query required metrics columns strictly for this merchant
  const [
    { data: customers },
    { data: visits },
    { data: rewards },
    { data: offers },
    { data: notificationLogs },
  ] = await Promise.all([
    supabase
      .from("customers")
      .select("id, first_visit_at, visit_count")
      .eq("merchant_id", user.id),
    supabase
      .from("customer_visits")
      .select("id, visited_at, visit_type")
      .eq("merchant_id", user.id),
    supabase
      .from("rewards")
      .select("id, issued_at, status")
      .eq("merchant_id", user.id),
    supabase
      .from("offers")
      .select("id, status")
      .eq("merchant_id", user.id),
    supabase
      .from("notification_logs")
      .select("id, sent_at, status")
      .eq("merchant_id", user.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <BarChart3 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Store Performance & Growth Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real customer footfall, repeat visit rates, and promotion conversion metrics.
          </p>
        </div>
      </div>

      <AnalyticsDashboard
        customers={(customers || []) as Customer[]}
        visits={(visits || []) as CustomerVisit[]}
        rewards={(rewards || []) as Reward[]}
        offers={(offers || []) as Offer[]}
        notificationLogs={(notificationLogs || []) as NotificationLog[]}
      />
    </div>
  );
}

