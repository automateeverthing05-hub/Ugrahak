import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RedeemRewardForm } from "@/components/dashboard/RedeemRewardForm";
import { Ticket } from "lucide-react";

export default async function RedeemPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <Ticket className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Redeem Customer Reward
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Validate reference codes presented by customers during checkout.
          </p>
        </div>
      </div>

      <RedeemRewardForm />
    </div>
  );
}

