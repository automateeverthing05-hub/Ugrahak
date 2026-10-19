import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BillingPageClient } from "@/components/billing/BillingPageClient";
import type { Merchant } from "@/lib/types/database";
import type { Metadata } from "next";

import type { PlanId } from "@/lib/billing/plans";

export const metadata: Metadata = {
  title: "Plan & Billing | U-Grahak Dashboard",
  robots: { index: false, follow: false },
};

interface BillingPageProps {
  searchParams?: Promise<{
    plan?: string;
    checkout?: string;
  }>;
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const requestedPlan = resolvedParams.plan?.toUpperCase();
  const validPlans: PlanId[] = ["STARTER", "GROWTH", "PRO"];
  const initialPlan = requestedPlan && validPlans.includes(requestedPlan as PlanId)
    ? (requestedPlan as PlanId)
    : null;
  const initialAutoCheckout = resolvedParams.checkout === "true";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: merchant }, { count: customerCount }] = await Promise.all([
    supabase
      .from("merchants")
      .select("id, shop_name, owner_name, phone, plan, subscription_status, subscription_started_at")
      .eq("id", user.id)
      .maybeSingle<Merchant>(),
    supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("merchant_id", user.id),
  ]);

  if (!merchant) {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Plan &amp; Billing
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your subscription. Upgrade anytime — your data is always preserved.
        </p>
      </div>

      <BillingPageClient
        merchant={merchant}
        merchantEmail={user.email || ""}
        customerCount={customerCount || 0}
        initialPlan={initialPlan}
        initialAutoCheckout={initialAutoCheckout}
      />
    </div>
  );
}

