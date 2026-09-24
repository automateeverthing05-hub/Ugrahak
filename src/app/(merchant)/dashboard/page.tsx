import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StatCards } from "@/components/dashboard/StatCards";
import { QRCodeDisplay } from "@/components/dashboard/QRCodeDisplay";
import { MerchantProfileForm } from "@/components/dashboard/MerchantProfileForm";
import { Card } from "@/components/ui/Card";
import { maskPhone } from "@/lib/utils/referenceCode";
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

  const { data: merchant } = await supabase
    .from("merchants")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // If merchant profile is not created yet, show onboarding setup
  if (!merchant) {
    return (
      <div className="max-w-2xl mx-auto py-4 sm:py-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 mb-2">
            <Store className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Welcome to Ugrahak</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Let&apos;s set up your store details to generate your customer QR code.
          </p>
        </div>
        <MerchantProfileForm initialMerchant={null} />
      </div>
    );
  }

  const typedMerchant = merchant as Merchant;

  // Query customers, offers, and visits concurrently
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [{ data: customers }, { data: offers }, { data: visits }] = await Promise.all([
    supabase
      .from("customers")
      .select("*")
      .eq("merchant_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("offers")
      .select("id, status")
      .eq("merchant_id", user.id)
      .eq("status", "ACTIVE"),
    supabase
      .from("customer_visits")
      .select("id, visited_at")
      .eq("merchant_id", user.id)
      .gte("visited_at", startOfMonth),
  ]);

  const typedCustomers = (customers || []) as Customer[];
  const typedOffers = (offers || []) as Offer[];
  const typedVisits = (visits || []) as CustomerVisit[];

  const totalCustomers = typedCustomers.length;
  const repeatCustomers = typedCustomers.filter((c) => c.visit_count > 1).length;
  const activeOffersCount = typedOffers.length;
  const thisMonthVisits = typedVisits.length;

  const recentCustomers = typedCustomers.slice(0, 5);

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
        activeOffers={activeOffersCount}
        thisMonthVisits={thisMonthVisits}
      />

      {/* Prominent Action Banner: Send New Offer & View Analytics */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold text-amber-200">
            <span>Core Flow: Customers &rarr; Send Offer &rarr; Return</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
            Bring customers back to your shop
          </h2>
          <p className="text-xs text-indigo-100/90 max-w-md">
            Broadcast an instant push notification with a weekend discount or festival deal to all your enrolled customers.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-shrink-0">
          <Link
            href="/dashboard/offers"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white text-indigo-700 font-extrabold text-xs sm:text-sm hover:bg-indigo-50 transition-colors shadow-sm min-h-[44px]"
          >
            <Send className="w-4 h-4 text-indigo-600" />
            <span>Send New Offer</span>
            <ArrowRight className="w-4 h-4 text-indigo-600" />
          </Link>

          <Link
            href="/dashboard/analytics"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-indigo-800/80 hover:bg-indigo-800 text-white font-bold text-xs transition-colors border border-indigo-500/30 min-h-[44px]"
          >
            <BarChart3 className="w-4 h-4 text-amber-300" />
            <span>View Analytics</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Recent Customers & QR Code Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left 2 Cols: Recent Customer Enrollments */}
        <div className="lg:col-span-2 space-y-4">
          <Card
            title="Recent Customer Enrollments"
            description="Customers who scanned your shop QR code and enrolled for benefits."
          >
            {recentCustomers.length === 0 ? (
              <div className="py-10 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 p-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                  <Users className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800">
                  No customer visits recorded yet
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Place your store QR code at your billing counter. When customers scan it, their visits will appear here.
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
                          <p className="text-xs font-mono text-slate-500">
                            {maskPhone(cust.phone)}
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
                          title="View Customer Details"
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
                    <span>View All {totalCustomers} Customers</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    href="/dashboard/customers"
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 p-1 inline-flex items-center gap-1"
                  >
                    <Ticket className="w-3.5 h-3.5 text-amber-500" />
                    <span>Redeem Code</span>
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
