import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CustomersList, type CustomerWithReward } from "@/components/dashboard/CustomersList";
import { Users } from "lucide-react";
import type { Customer, Reward } from "@/lib/types/database";

export default async function CustomersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch initial batch of customers with rewards and exact count
  const { data: customers, count } = await supabase
    .from("customers")
    .select("*, rewards(*)", { count: "exact" })
    .eq("merchant_id", user.id)
    .order("created_at", { ascending: false })
    .range(0, 49);

  const typedCustomers = (customers || []) as CustomerWithReward[];
  const totalCount = count || typedCustomers.length;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Customer Directory
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified customer records captured from your store QR scans.
            </p>
          </div>
        </div>

        <div className="text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto shadow-xs">
          Total Customers: {totalCount}
        </div>
      </div>

      <CustomersList initialCustomers={typedCustomers} initialTotalCount={totalCount} />
    </div>
  );
}
