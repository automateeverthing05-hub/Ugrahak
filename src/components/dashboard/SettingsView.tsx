"use client";

import React, { useState } from "react";
import { MerchantProfileForm } from "@/components/dashboard/MerchantProfileForm";
import { QRCodeDisplay } from "@/components/dashboard/QRCodeDisplay";
import { ScratchCardSettings } from "@/components/dashboard/ScratchCardSettings";
import { GoogleReviewsSettings } from "@/components/dashboard/GoogleReviewsSettings";
import { PLANS, getPlanConfig } from "@/lib/billing/plans";
import {
  Store,
  QrCode,
  Star,
  MapPin,
  Gift,
  CreditCard,
  Check,
  Clock,
  ArrowRight,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import type { Merchant } from "@/lib/types/database";

interface SettingsViewProps {
  merchant: (Merchant & { latitude?: number | null; longitude?: number | null; plan?: string; trial_ends_at?: string }) | null;
  customerCount: number;
}

type SettingsTab = "profile" | "qr" | "reviews" | "nearby" | "scratch" | "billing";

export const SettingsView: React.FC<SettingsViewProps> = ({
  merchant,
  customerCount,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  const currentPlan = getPlanConfig(merchant?.plan);
  const usagePct = Math.min(
    Math.round((customerCount / currentPlan.customerLimit) * 100),
    100
  );

  const trialEnds = merchant?.trial_ends_at
    ? new Date(merchant.trial_ends_at)
    : null;
  const daysLeft = trialEnds
    ? Math.max(
        Math.ceil((trialEnds.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        0
      )
    : 7;

  const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: "profile", label: "Shop Profile", icon: Store },
    { id: "qr", label: "Store QR Code", icon: QrCode },
    { id: "reviews", label: "Google Reviews", icon: Star },
    { id: "nearby", label: "Nearby Offers (GPS)", icon: MapPin },
    { id: "scratch", label: "Scratch Card", icon: Gift },
    { id: "billing", label: "Plan & Billing", icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      {/* Settings Navigation Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-xs overflow-x-auto flex gap-1 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap min-h-[42px] ${
                isActive
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Shop Profile */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          <MerchantProfileForm initialMerchant={merchant} />
        </div>
      )}

      {/* Tab 2: Store QR Code */}
      {activeTab === "qr" && (
        <div className="space-y-6">
          {merchant?.slug ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <QRCodeDisplay
                  slug={merchant.slug}
                  shopName={merchant.shop_name}
                />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <h4 className="font-bold text-sm text-slate-900">
                  How to use your QR Code
                </h4>
                <ol className="space-y-3 text-xs text-slate-600 list-decimal list-inside">
                  <li>Download and print your QR code poster.</li>
                  <li>Place the standee or poster at your checkout counter.</li>
                  <li>Ask customers to scan with any camera or scanner app to get instant loyalty rewards.</li>
                </ol>
                <div className="pt-2 border-t border-slate-100">
                  <a
                    href={`/shop/${merchant.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    <span>Preview customer QR page</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
              <p className="text-sm text-slate-600">
                Please complete your shop profile first to generate your QR code.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Google Reviews */}
      {activeTab === "reviews" && (
        <GoogleReviewsSettings
          initialGoogleMapsUrl={merchant?.google_maps_url || null}
          shopName={merchant?.shop_name || "Your Store"}
        />
      )}


      {/* Tab 4: Nearby Offers (GPS) */}
      {activeTab === "nearby" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Nearby Offers (100m – 200m Proximity Radar)
              </h3>
              <p className="text-xs text-slate-500">
                Attract shoppers walking near your store location automatically.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-2">
              <p className="font-semibold">📍 How Nearby Radar Works:</p>
              <p>
                When shoppers open Ugrahak within 200 meters of your coordinates, your store offers are displayed on their screen, driving walk-in foot traffic.
              </p>
            </div>

            {(!merchant?.latitude || !merchant?.longitude) ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
                <p className="font-bold text-amber-800">
                  ⚠️ Please set your shop location before enabling Nearby Offers.
                </p>
                <p className="text-amber-700 leading-relaxed">
                  Nearby proximity detection requires your store&apos;s exact latitude and longitude. Configure your coordinates in your Shop Profile or use your browser&apos;s current GPS position.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                <p className="font-semibold text-emerald-800 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Shop GPS Location Active (100–200m Radius Configured)</span>
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Latitude</span>
                <p className="text-sm font-mono font-bold text-slate-800 mt-1">
                  {merchant?.latitude ? merchant.latitude.toFixed(6) : "Not configured"}
                </p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Longitude</span>
                <p className="text-sm font-mono font-bold text-slate-800 mt-1">
                  {merchant?.longitude ? merchant.longitude.toFixed(6) : "Not configured"}
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={() => setActiveTab("profile")}
                className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors min-h-[44px]"
              >
                Set GPS Coordinates in Profile
              </button>
              <Link
                href="/nearby"
                target="_blank"
                className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors inline-flex items-center gap-1.5 min-h-[44px]"
              >
                <span>View Nearby Discovery Radar</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Scratch Card Settings */}
      {activeTab === "scratch" && (
        <ScratchCardSettings shopName={merchant?.shop_name || "Your Store"} />
      )}


      {/* Tab 6: Plan & Billing */}
      {activeTab === "billing" && (
        <div className="space-y-6">
          {/* Current Plan Overview Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                  Current Plan: {currentPlan.name}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-2">
                  {currentPlan.priceINR === 0
                    ? "Active Free Trial"
                    : `₹${currentPlan.priceINR.toLocaleString()} / month`}
                </h2>
              </div>

              {currentPlan.id === "TRIAL" && (
                <div className="flex items-center gap-2 bg-amber-50 text-amber-900 px-3 py-1.5 rounded-xl border border-amber-200 text-xs font-semibold self-start sm:self-auto">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>{daysLeft} days remaining in trial</span>
                </div>
              )}
            </div>

            {/* Quota Progress Bar */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5 font-medium">
                <span>Customer Quota Usage</span>
                <span className="font-bold text-slate-900">
                  {customerCount.toLocaleString()} / {currentPlan.customerLimit.toLocaleString()} ({usagePct}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div
                  style={{ width: `${usagePct}%` }}
                  className={`h-full rounded-full transition-all ${
                    usagePct >= 90 ? "bg-rose-500" : "bg-indigo-600"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Available Growth Plans */}
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Available Growth Plans
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[PLANS.STARTER, PLANS.GROWTH, PLANS.PRO].map((plan) => {
                const isCurrent = currentPlan.id === plan.id;

                return (
                  <div
                    key={plan.id}
                    className={`bg-white rounded-2xl p-5 border flex flex-col justify-between shadow-xs ${
                      plan.id === "GROWTH"
                        ? "border-indigo-500 ring-1 ring-indigo-500"
                        : "border-slate-200"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900">{plan.name}</h4>
                        {plan.id === "GROWTH" && (
                          <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                            Recommended
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold text-slate-900">
                          ₹{plan.priceINR.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-500">/mo</span>
                      </div>

                      <p className="text-xs text-indigo-600 font-medium mt-1">
                        Up to {plan.customerLimit.toLocaleString()} customers
                      </p>

                      <ul className="mt-4 space-y-2 text-xs text-slate-600">
                        {plan.features.map((feat, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-6">
                      {isCurrent ? (
                        <span className="w-full py-2 rounded-xl text-xs font-bold text-center block bg-slate-100 text-slate-600">
                          Current Active Plan
                        </span>
                      ) : (
                        <Link
                          href="/pricing"
                          className="w-full py-2 px-3 rounded-xl text-xs font-bold text-center inline-flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                        >
                          <span>Upgrade to {plan.name}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Billing Help & Policies */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-600">
              Need billing assistance, invoice copies, or plan adjustments?
            </span>
            <div className="flex items-center gap-3 font-semibold text-indigo-600">
              <Link href="/refund-policy" target="_blank" className="hover:underline">
                Refund Policy
              </Link>
              <span className="text-slate-300">&bull;</span>
              <Link href="/terms" target="_blank" className="hover:underline">
                Terms of Service
              </Link>
              <span className="text-slate-300">&bull;</span>
              <Link href="/contact" target="_blank" className="hover:underline">
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

