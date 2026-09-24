"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Store, Navigation, MapPin, Sparkles, Tag, ArrowRight, Compass, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Footer } from "@/components/layout/Footer";

interface NearbyShopOffer {
  shop_name: string;
  slug: string;
  distanceMeters: number;
  offer: {
    title: string;
    message: string;
    image_url?: string | null;
  } | null;
}

export default function NearbyOffersPage() {
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offers, setOffers] = useState<NearbyShopOffer[]>([]);
  const [searched, setSearched] = useState(false);

  const handleFindNearby = () => {
    if (!navigator.geolocation) {
      setError("Location is not supported on this device/browser.");
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          // Fetch nearby check
          const res = await fetch("/api/shop/nearby-check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            }),
          });

          const data = await res.json();
          setSearched(true);
          setIsLocating(false);

          if (data.offers) {
            setOffers(data.offers);
          } else if (data.offer) {
            setOffers([
              {
                shop_name: data.shopName || "Nearby Store",
                slug: data.slug || "",
                distanceMeters: data.distanceMeters || 100,
                offer: data.offer,
              },
            ]);
          } else {
            setOffers([]);
          }
        } catch {
          setSearched(true);
          setIsLocating(false);
          setOffers([]);
        }
      },
      (err) => {
        setIsLocating(false);
        setError(
          err.code === 1
            ? "Location permission is required for Nearby Offers. Please enable location permission in your browser settings."
            : `Unable to access location: ${err.message}`
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
              <Store className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="font-bold text-base sm:text-lg text-slate-900 tracking-tight">
              Ugrahak
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-medium text-slate-700 hover:text-indigo-600 px-2 sm:px-3 py-1.5"
            >
              Merchant Login
            </Link>
            <Link
              href="/pricing"
              className="text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors"
            >
              Pricing
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 w-full text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-4">
          <Compass className="w-3.5 h-3.5 text-indigo-600" />
          <span>Local Store Discovery (100–200m Zone)</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Find Exclusive Offers Near You
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mt-2">
          Discover flash discounts and reward deals from local retail stores as you walk by.
        </p>

        {/* Discovery Action Button */}
        <div className="mt-6 flex flex-col items-center">
          <Button
            size="lg"
            onClick={handleFindNearby}
            isLoading={isLocating}
            className="w-full sm:w-auto gap-2 px-6 py-3.5 text-sm sm:text-base font-bold shadow-sm"
          >
            <Navigation className="w-4 h-4 text-amber-300" />
            <span>{isLocating ? "Scanning Nearby Stores..." : "Discover Deals Near Me"}</span>
          </Button>

          {error && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 text-left max-w-md w-full">
              {error}
            </div>
          )}
        </div>

        {/* Results Section */}
        {searched && (
          <div className="mt-10 text-left">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Nearby Store Offers
            </h3>

            {offers.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-xs shadow-sm">
                No active promotional offers found within 200m of your current location. Check back when visiting shopping markets!
              </div>
            ) : (
              <div className="space-y-3">
                {offers.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-indigo-300 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                          <Store className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">
                            {item.shop_name}
                          </h4>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-600" />
                            ~{item.distanceMeters}m away
                          </span>
                        </div>
                      </div>

                      {item.slug && (
                        <Link
                          href={`/shop/${item.slug}`}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 bg-indigo-50 px-2.5 py-1.5 rounded-lg"
                        >
                          <span>Visit Store</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>

                    {item.offer && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <span className="text-xs font-bold text-indigo-700">
                          {item.offer.title}
                        </span>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {item.offer.message}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}

