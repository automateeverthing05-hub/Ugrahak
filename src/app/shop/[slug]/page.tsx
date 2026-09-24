import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { CustomerCheckinFlow } from "@/components/shop/CustomerCheckinFlow";
import { Store, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import type { ShopPublicProfile } from "@/lib/types/database";

export const revalidate = 60; // 60s ISR public caching

interface ShopPageProps {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * Cached public merchant profile retriever
 * Eliminates redundant DB lookups between generateMetadata and ShopPage,
 * and caches storefront headers under high concurrency with 60s ISR.
 */
const getCachedMerchantBySlug = unstable_cache(
  async (slug: string): Promise<ShopPublicProfile | null> => {
    const admin = createAdminClient();
    const { data: merchant } = await admin
      .from("merchants")
      .select("id, shop_name, owner_name, phone, google_maps_url, slug")
      .eq("slug", slug.trim().toLowerCase())
      .maybeSingle<ShopPublicProfile>();

    return merchant ?? null;
  },
  ["merchant-storefront-profile"],
  {
    revalidate: 60,
    tags: ["merchant-profile"],
  }
);

export async function generateMetadata({ params }: ShopPageProps): Promise<Metadata> {
  const { slug } = await params;
  const merchant = await getCachedMerchantBySlug(slug);

  if (!merchant) {
    return {
      title: "Shop Not Found - Ugrahak",
    };
  }

  return {
    title: `${merchant.shop_name} - Customer Rewards`,
    description: `Claim exclusive first-visit rewards and loyalty benefits at ${merchant.shop_name}.`,
  };
}

export default async function ShopPage({ params }: ShopPageProps) {
  const { slug } = await params;

  // Fetch cached merchant public profile
  const merchant = await getCachedMerchantBySlug(slug);

  if (!merchant) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-between p-3 sm:p-6 overflow-x-hidden">
      {/* Header / Brand */}
      <header className="w-full max-w-md flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
            <Store className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-slate-800 tracking-tight">
            Ugrahak
          </span>
        </div>
        <span className="text-[10px] sm:text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
          Store Rewards
        </span>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-md my-auto space-y-3 sm:space-y-4">
        {/* Shop Info Card */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xs p-5 sm:p-6 text-center">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white flex items-center justify-center mx-auto shadow-sm mb-3">
            <Store className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {merchant.shop_name}
          </h1>
          {merchant.owner_name && (
            <p className="text-xs text-slate-500 mt-0.5">
              Managed by {merchant.owner_name}
            </p>
          )}

          {/* Contact & Location */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-3 text-xs text-slate-600">
            <a
              href={`tel:${merchant.phone}`}
              className="inline-flex items-center gap-1 hover:text-indigo-600 transition-colors p-1"
            >
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{merchant.phone}</span>
            </a>

            {merchant.google_maps_url && (
              <a
                href={merchant.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-indigo-600 hover:underline font-medium p-1"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Directions</span>
              </a>
            )}
          </div>
        </div>

        {/* Customer Capture, Scratch Flow, Push Notification & Google Review */}
        <CustomerCheckinFlow
          slug={merchant.slug}
          shopName={merchant.shop_name}
          googleMapsUrl={merchant.google_maps_url}
        />
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md py-4 text-center text-[11px] text-slate-400">
        Powered by Ugrahak &bull; Customer Retention Platform
      </footer>
    </div>
  );
}
