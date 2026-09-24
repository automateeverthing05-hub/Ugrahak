"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ScratchCard } from "@/components/shop/ScratchCard";
import { isValidPhone } from "@/lib/utils/validation";
import { normalizePhone } from "@/lib/utils/referenceCode";
import { requestNotificationPermissionAndToken } from "@/lib/firebase/client";
import {
  Gift,
  RotateCcw,
  Sparkles,
  CheckCircle,
  ArrowRight,
  Bell,
  BellRing,
  Star,
  ExternalLink,
  MapPin,
  CheckCircle2,
  Navigation,
  Compass,
} from "lucide-react";

interface CustomerCheckinFlowProps {
  slug: string;
  shopName: string;
  googleMapsUrl?: string | null;
}

interface CheckinResult {
  isFirstVisit: boolean;
  visitCount: number;
  customer: {
    id: string;
    name: string;
  };
  reward: {
    title: string;
    description?: string | null;
    reference_code: string;
    expires_at?: string | null;
    status: string;
  } | null;
}

interface NearbyOfferResult {
  status?: "ELIGIBLE" | "OUT_OF_RANGE" | "COOLDOWN" | "CONFIG_REQUIRED" | "PLAN_FEATURE_UNAVAILABLE" | "NO_ACTIVE_OFFER" | "ERROR" | string;
  nearby?: boolean;
  notificationSent?: boolean;
  reason?: string;
  distanceMeters?: number;
  message?: string;
  offer?: {
    title: string;
    message: string;
    image_url?: string | null;
  } | null;
}

export const CustomerCheckinFlow: React.FC<CustomerCheckinFlowProps> = ({
  slug,
  shopName,
  googleMapsUrl,
}) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CheckinResult | null>(null);

  // Notification Permission State
  const [notificationStatus, setNotificationStatus] = useState<
    "NOT_REQUESTED" | "REQUESTING" | "GRANTED" | "DENIED" | "UNSUPPORTED"
  >("NOT_REQUESTED");
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Nearby Offers State
  const [isCheckingNearby, setIsCheckingNearby] = useState(false);
  const [nearbyResult, setNearbyResult] = useState<NearbyOfferResult | null>(null);

  const storageKey = `ugrahak_reward_${slug}`;

  // Check browser notification support & saved state on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(storageKey) || sessionStorage.getItem(`apnagrahak_reward_${slug}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.customer) {
          setResult(parsed);
        }
      }

      if (typeof window !== "undefined") {
        if (!("Notification" in window) || !("serviceWorker" in navigator)) {
          setNotificationStatus("UNSUPPORTED");
        } else if (Notification.permission === "granted") {
          setNotificationStatus("GRANTED");
        } else if (Notification.permission === "denied") {
          setNotificationStatus("DENIED");
        }
      }
    } catch {
      // Ignore
    }
  }, [storageKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone || !isValidPhone(cleanPhone)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/shop/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug,
          name: name.trim(),
          phone: cleanPhone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to check in. Please try again.");
        setIsLoading(false);
        return;
      }

      setResult(data);
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(data));
      } catch {
        // Ignore
      }
      setIsLoading(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  const handleEnableNotifications = async () => {
    if (!result?.customer?.id) return;

    setNotificationStatus("REQUESTING");
    setNotificationMsg(null);

    const fcmRes = await requestNotificationPermissionAndToken();

    if (fcmRes.status === "granted" && fcmRes.token) {
      try {
        const regRes = await fetch("/api/shop/notifications/register-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug,
            customer_id: result.customer.id,
            token: fcmRes.token,
            platform: "web",
          }),
        });

        if (regRes.ok) {
          setNotificationStatus("GRANTED");
          setNotificationMsg("Notifications enabled! You will now receive exclusive discounts.");
        } else {
          setNotificationStatus("GRANTED");
        }
      } catch {
        setNotificationStatus("GRANTED");
      }
    } else if (fcmRes.status === "denied") {
      setNotificationStatus("DENIED");
      setNotificationMsg("Notifications blocked in browser settings.");
    } else if (fcmRes.status === "unsupported") {
      setNotificationStatus("UNSUPPORTED");
      setNotificationMsg("Push notifications are not supported on this browser.");
    } else {
      setNotificationStatus("NOT_REQUESTED");
      setNotificationMsg(fcmRes.error || "Could not enable notifications.");
    }
  };

  const handleCheckNearbyOffers = () => {
    if (!result?.customer?.id) return;

    if (!navigator.geolocation) {
      setNearbyResult({
        status: "ERROR",
        message: "Location is not supported on this device/browser.",
      });
      return;
    }

    setIsCheckingNearby(true);
    setNearbyResult(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch("/api/shop/nearby-check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              slug,
              customer_id: result.customer.id,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            }),
          });

          const data = await res.json();
          setNearbyResult(data);
          setIsCheckingNearby(false);
        } catch (err: unknown) {
          setNearbyResult({
            status: "ERROR",
            message: err instanceof Error ? err.message : "Failed to check nearby location.",
          });
          setIsCheckingNearby(false);
        }
      },
      (err) => {
        setNearbyResult({
          status: "ERROR",
          message:
            err.code === 1
              ? "Location permission is required for Nearby Offers. Please enable location permission in your browser settings."
              : `Unable to access location: ${err.message}`,
        });
        setIsCheckingNearby(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleReset = () => {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // Ignore
    }
    setResult(null);
    setNearbyResult(null);
    setName("");
    setPhone("");
    setError(null);
  };

  // If already checked in
  if (result) {
    return (
      <div className="space-y-4">
        {result.isFirstVisit && result.reward ? (
          <div className="space-y-4">
            <div className="text-center">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Welcome Reward Unlocked!
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                Welcome, {result.customer.name}!
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Scratch the card below to reveal your first-visit reward.
              </p>
            </div>

            {/* Interactive Scratch Card */}
            <ScratchCard
              rewardTitle={result.reward.title}
              rewardDescription={result.reward.description}
              referenceCode={result.reward.reference_code}
              shopName={shopName}
              expiresAt={result.reward.expires_at}
            />
          </div>
        ) : (
          /* Repeat visit card */
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div>
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                Visit #{result.visitCount}
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                Welcome back, {result.customer.name}!
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Thank you for being a valued customer at {shopName}.
              </p>
            </div>

            {result.reward ? (
              <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-left">
                <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
                  <Gift className="w-4 h-4" />
                  <span>Active Reward Available</span>
                </div>
                <p className="text-xs text-slate-700 mt-1 font-medium">
                  {result.reward.title}
                </p>
                <div className="mt-2 font-mono text-sm font-bold text-slate-900 bg-white px-3 py-1 rounded border border-amber-200 inline-block">
                  Code: {result.reward.reference_code}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                Keep visiting {shopName} to earn more rewards and special offers!
              </div>
            )}
          </div>
        )}

        {/* Feature 1: Nearby Offers (100–200m) Card */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-center space-y-2.5">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-800">
            <Navigation className="w-4 h-4 text-indigo-600" />
            <span>Nearby Offers (100–200m Zone)</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Allow location to receive offers near you when walking by this store.
          </p>

          <Button
            size="sm"
            onClick={handleCheckNearbyOffers}
            isLoading={isCheckingNearby}
            className="w-full gap-2 text-xs bg-slate-900 hover:bg-slate-800 text-white min-h-[44px]"
          >
            <Compass className="w-4 h-4 text-amber-400" />
            <span>{isCheckingNearby ? "Checking Store Proximity..." : "Check Nearby Store Offers"}</span>
          </Button>

          {nearbyResult && (
            <div className="pt-2 text-left">
              {nearbyResult.status === "ELIGIBLE" && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1.5">
                  <p className="font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>You&apos;re near this shop! 🎉 ({nearbyResult.distanceMeters}m away)</span>
                  </p>
                  {nearbyResult.offer && (
                    <div className="mt-1.5 pt-1.5 border-t border-emerald-200 text-emerald-950">
                      <p className="font-bold text-xs">{nearbyResult.offer.title}</p>
                      <p className="text-[11px] text-emerald-800 mt-0.5">{nearbyResult.offer.message}</p>
                    </div>
                  )}
                </div>
              )}

              {nearbyResult.status === "OUT_OF_RANGE" && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                  <p className="font-semibold">Outside Store Radius</p>
                  <p className="text-[11px] mt-0.5">
                    {nearbyResult.message || "No nearby offer available right now."}
                  </p>
                </div>
              )}

              {nearbyResult.status === "COOLDOWN" && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                  <p className="font-semibold">24-Hour Limit Active</p>
                  <p className="text-[11px] mt-0.5">{nearbyResult.message}</p>
                </div>
              )}

              {(nearbyResult.status === "CONFIG_REQUIRED" ||
                nearbyResult.status === "PLAN_FEATURE_UNAVAILABLE" ||
                nearbyResult.status === "NO_ACTIVE_OFFER" ||
                nearbyResult.status === "ERROR") && (
                <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700">
                  <p className="font-semibold">{nearbyResult.message || "Location check completed."}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Feature 2: Push Notifications Permission Card */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-center space-y-2">
          {notificationStatus === "GRANTED" ? (
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 py-2 px-3 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Store Push Notifications Active</span>
            </div>
          ) : notificationStatus === "DENIED" ? (
            <div className="text-xs text-slate-500">
              Notifications blocked in your browser. Enable notifications in site settings to receive special discounts.
            </div>
          ) : notificationStatus === "UNSUPPORTED" ? null : (
            <div>
              <div className="flex items-center justify-center gap-2 text-slate-800 font-semibold text-xs mb-1">
                <BellRing className="w-4 h-4 text-indigo-600" />
                <span>Get Instant Discounts & Exclusive Offers</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                Allow notifications to receive flash sales and festival rewards from {shopName}.
              </p>
              <Button
                size="sm"
                onClick={handleEnableNotifications}
                isLoading={notificationStatus === "REQUESTING"}
                className="w-full gap-2 text-xs bg-indigo-600 hover:bg-indigo-700"
              >
                <Bell className="w-3.5 h-3.5" />
                Allow Store Notifications
              </Button>
            </div>
          )}

          {notificationMsg && (
            <p className="text-[11px] text-indigo-600 font-medium">
              {notificationMsg}
            </p>
          )}
        </div>

        {/* Feature 3: Google Review Card */}
        {googleMapsUrl && (
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 shadow-sm text-center space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-amber-900 font-bold text-xs">
              <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
              <span>Enjoyed your experience?</span>
            </div>
            <p className="text-[11px] text-amber-800/80">
              Help our local store grow by leaving a quick 5-star Google review!
            </p>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 text-xs font-semibold text-amber-950 bg-amber-200 hover:bg-amber-300 rounded-xl transition-colors shadow-sm"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Leave a Google Review</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        <div className="pt-2 text-center">
          <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs text-slate-400 hover:text-slate-600">
            Check-in Another Person
          </Button>
        </div>
      </div>
    );
  }

  // Initial Enrollment / Check-in Form
  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
      <div className="text-center mb-5">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2 shadow-sm">
          <Gift className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          Claim Your Store Reward
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Enter your name & phone to unlock instant rewards.
        </p>
      </div>

      {error && <Alert type="error" message={error} className="mb-4 text-xs" />}

      <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
        <div>
          <Input
            label="Your Full Name"
            placeholder="e.g. Rahul Sharma"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <Input
            label="Mobile Number"
            type="tel"
            placeholder="e.g. 9876543210"
            required
            maxLength={15}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            helperText="We do not spam. Used only for store rewards."
          />
        </div>

        <Button
          type="submit"
          className="w-full mt-2 gap-2"
          size="lg"
          isLoading={isLoading}
        >
          <span>Unlock My Reward</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
};
