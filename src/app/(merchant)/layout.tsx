import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { Footer } from "@/components/layout/Footer";
import type { Merchant } from "@/lib/types/database";

export default async function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch merchant profile for current user
  const { data: merchant } = await supabase
    .from("merchants")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50">
      <div>
        <DashboardNav merchant={merchant as Merchant | null} userEmail={user.email || ""} />
        {/* pb-24 on mobile ensures bottom floating tab bar doesn't obscure content */}
        <main className="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 lg:pb-8">
          {children}
        </main>
      </div>
      <Footer variant="simple" className="hidden sm:block mt-8" />
    </div>
  );
}
