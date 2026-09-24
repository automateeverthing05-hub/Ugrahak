import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { maskPhone } from "@/lib/utils/referenceCode";
import { Card } from "@/components/ui/Card";
import {
  ArrowLeft,
  Calendar,
  RotateCcw,
  Phone,
} from "lucide-react";
import { CustomerRewardsList } from "@/components/dashboard/CustomerRewardsList";
import type { Customer, Reward, CustomerVisit } from "@/lib/types/database";

interface CustomerDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Fetch Customer ensuring it belongs strictly to this merchant
  const { data: customer, error: custError } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .eq("merchant_id", user.id)
    .maybeSingle<Customer>();

  if (custError || !customer) {
    notFound();
  }

  // 2. Fetch Rewards for this customer and merchant
  const { data: rewards } = await supabase
    .from("rewards")
    .select("*")
    .eq("customer_id", id)
    .eq("merchant_id", user.id)
    .order("created_at", { ascending: false });

  // 3. Fetch Visit History for this customer and merchant
  const { data: visits } = await supabase
    .from("customer_visits")
    .select("*")
    .eq("customer_id", id)
    .eq("merchant_id", user.id)
    .order("visited_at", { ascending: false });

  const typedRewards = (rewards || []) as Reward[];
  const typedVisits = (visits || []) as CustomerVisit[];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <Link
        href="/dashboard/customers"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Customers
      </Link>

      {/* Customer Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xl flex-shrink-0">
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {customer.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
              <span className="flex items-center gap-1 font-mono">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {maskPhone(customer.phone)}
              </span>
              <span className="text-slate-300">&bull;</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Joined {new Date(customer.first_visit_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="text-right">
            <span className="text-[11px] font-medium text-slate-500 uppercase">
              Total Visits
            </span>
            <p className="text-xl font-extrabold text-slate-900">
              {customer.visit_count}
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
            <RotateCcw className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 2 Column Layout: Rewards & Visit Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Col: Customer Rewards */}
        <Card
          title="Issued Rewards"
          description="Loyalty rewards and discount codes issued to this customer."
        >
          <CustomerRewardsList initialRewards={typedRewards} />
        </Card>

        {/* Right Col: Visit History Timeline */}
        <Card
          title="Visit History"
          description="Detailed log of QR scans and in-store check-ins."
        >
          {typedVisits.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No detailed visit entries logged.
            </div>
          ) : (
            <div className="space-y-3">
              {typedVisits.map((visit) => (
                <div
                  key={visit.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        visit.visit_type === "FIRST_VISIT"
                          ? "bg-indigo-600"
                          : "bg-emerald-600"
                      }`}
                    />
                    <div>
                      <span className="font-semibold text-slate-800">
                        {visit.visit_type === "FIRST_VISIT"
                          ? "First-Time QR Check-in"
                          : "Repeat Store Visit"}
                      </span>
                    </div>
                  </div>
                  <span className="text-slate-500 text-[11px] font-mono">
                    {new Date(visit.visited_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
