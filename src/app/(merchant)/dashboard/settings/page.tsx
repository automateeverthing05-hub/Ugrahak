import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsView } from "@/components/dashboard/SettingsView";
import type { Merchant } from "@/lib/types/database";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch Merchant data and customer count concurrently
  const [{ data: merchant }, { count: customerCount }] = await Promise.all([
    supabase
      .from("merchants")
      .select("id, shop_name, owner_name, phone, google_maps_url, slug, latitude, longitude, plan, trial_ends_at, subscription_status")
      .eq("id", user.id)
      .maybeSingle<Merchant & { latitude?: number | null; longitude?: number | null; plan?: string; trial_ends_at?: string }>(),
    supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("merchant_id", user.id),
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Store Settings & Configuration
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your business profile, QR standee, Google reviews, nearby radar, and subscription plan.
        </p>
      </div>

      <SettingsView
        merchant={merchant}
        customerCount={customerCount || 0}
      />
    </div>
  );
}

