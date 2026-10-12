import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StatCards } from "@/components/dashboard/StatCards";
import { QRCodeDisplay } from "@/components/dashboard/QRCodeDisplay";
import { MerchantProfileForm } from "@/components/dashboard/MerchantProfileForm";
import { Card } from "@/components/ui/Card";
import {
  Store,
  Users,
  Send,
  BarChart3,
  MapPin,
  Phone,
  ArrowRight,
  ChevronRight,
  Ticket,
} from "lucide-react";
import type { Merchant, Customer, Offer, CustomerVisit } from "@/lib/types/database";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Fetch merchant profile, counts, and recent 5 customers concurrently in 1 round-trip
  const [
    { data: merchant },
    { count: totalCustomersCount },
    { count: repeatCustomersCount },
    { count: activeOffersCount },
    { count: thisMonthVisitsCount },
    { data: recentCustomersData },
  ] = await Promise.all([
    supabase
      .from("merchants")
      .select("id, shop_name, owner_name, phone, google_maps_url, slug, plan")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("merchant_id", user.id),
    supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("merchant_id", user.id)
      .gt("visit_count", 1),
    supabase
      .from("offers")
      .select("*", { count: "exact", head: true })
      .eq("merchant_id", user.id)
      .eq("status", "ACTIVE"),
    supabase
      .from("customer_visits")
      .select("*", { count: "exact", head: true })
      .eq("merchant_id", user.id)
      .gte("visited_at", startOfMonth),
    supabase
      .from("customers")
      .select("id, name, phone, visit_count, created_at")
      .eq("merchant_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  // If merchant profile is not created yet, show onboarding setup
  if (!merchant) {
    return (
      <div className="max-w-2xl mx-auto py-4 sm:py-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 mb-2">
            <Store className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Welcome to U-Grahak</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Let&apos;s set up your store details to generate your customer QR code.
          </p>
        </div>
        <MerchantProfileForm initialMerchant={null} />
      </div>
    );
  }

  const typedMerchant = merchant as Merchant;
  const totalCustomers = totalCustomersCount || 0;
  const repeatCustomers = repeatCustomersCount || 0;
  const activeOffers = activeOffersCount || 0;
  const thisMonthVisits = thisMonthVisitsCount || 0;
  const recentCustomers = (recentCustomersData || []) as Customer[];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Welcome, {typedMerchant.owner_name || typedMerchant.shop_name}
          </h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-slate-500 mt-1">
            {typedMerchant.owner_name && (
              <span className="font-semibold text-slate-700">
                {typedMerchant.shop_name}
              </span>
            )}
            {typedMerchant.owner_name && (
              <span className="hidden sm:inline text-slate-300">&bull;</span>
            )}
            <span className="flex items-center gap-1 font-mono">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              {typedMerchant.phone}
            </span>
            {typedMerchant.google_maps_url && (
              <a
                href={typedMerchant.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-indigo-600 hover:underline p-0.5"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Store Location</span>
              </a>
            )}
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="font-mono text-slate-600 truncate max-w-[150px]">
              Slug: {typedMerchant.slug}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/settings"
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-xs min-h-[40px] inline-flex items-center"
          >
            Settings
          </Link>
        </div>
      </div>

      {/* 4 Important Business Metrics */}
      <StatCards
        totalCustomers={totalCustomers}
        repeatCustomers={repeatCustomers}
        activeOffers={activeOffers}
        thisMonthVisits={thisMonthVisits}
      />

      {/* Prominent Action Banner: Send New Offer & View Analytics */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-5 sm:p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-emerald-900/40">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 backdrop-blur-md text-[11px] font-bold text-emerald-300 border border-emerald-400/30">
            <span>Aasan Process: Customers &rarr; Offer Bhejein &rarr; Repeat Visits</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
            Customers ko apni shop par wapas bulayein
          </h2>
          <p className="text-xs text-slate-300 max-w-md">
            Apne sabhi customers ko weekend discount ya festival offer ek click me bhejein.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-shrink-0">
          <Link
            href="/dashboard/offers"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 text-white font-extrabold text-xs sm:text-sm hover:bg-emerald-500 transition-colors shadow-sm min-h-[44px]"
          >
            <Send className="w-4 h-4 text-white" />
            <span>Naya Offer Bhejein</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </Link>

          <Link
            href="/dashboard/analytics"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors border border-slate-700 min-h-[44px]"
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>Insights Dekhein</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Recent Customers & QR Code Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left 2 Cols: Recent Customer Enrollments */}
        <div className="lg:col-span-2 space-y-4">
          <Card
            title="Recent Customers"
            description="Shop QR code scan karne wale customers."
          >
            {recentCustomers.length === 0 ? (
              <div className="py-10 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 p-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                  <Users className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800">
                  Abhi koi customer visit nahi hua
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Apna Shop QR code counter par lagayein. Jab customer scan karenge, unka visit yahan dikhega.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="divide-y divide-slate-100">
                  {recentCustomers.map((cust) => (
                    <div
                      key={cust.id}
                      className="py-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {cust.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {cust.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            Pehli visit: {new Date(cust.first_visit_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-[11px] sm:text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold whitespace-nowrap">
                          {cust.visit_count > 1 ? `${cust.visit_count} visits` : "1st visit"}
                        </span>
                        <Link
                          href={`/dashboard/customers/${cust.id}`}
                          className="text-indigo-600 hover:text-indigo-800 p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center"
                          title="Customer Details Dekhein"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                  <Link
                    href="/dashboard/customers"
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline p-1 inline-flex items-center gap-1"
                  >
                    <span>Sabhi {totalCustomers} Customers Dekhein</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    href="/dashboard/customers"
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 p-1 inline-flex items-center gap-1"
                  >
                    <Ticket className="w-3.5 h-3.5 text-amber-500" />
                    <span>Reward Redeem Karein</span>
                  </Link>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Col: Store QR Code Widget */}
        <div className="lg:col-span-1">
          <QRCodeDisplay
            slug={typedMerchant.slug}
            shopName={typedMerchant.shop_name}
          />
        </div>
      </div>
    </div>
  );
}
