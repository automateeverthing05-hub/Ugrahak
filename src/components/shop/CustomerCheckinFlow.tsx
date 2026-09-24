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
  ArrowRight,
  Bell,
  BellRing,
  Star,
  ExternalLink,
  MapPin,
  CheckCircle2,
  Navigation,
  Compass,
  Lock,
  ShieldAlert,
  HelpCircle,
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
  status?:
    | "ELIGIBLE"
    | "OUT_OF_RANGE"
    | "COOLDOWN"
    | "CONFIG_REQUIRED"
    | "PLAN_FEATURE_UNAVAILABLE"
    | "NO_ACTIVE_OFFER"
    | "ERROR"
    | string;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  // Checkin API response data
  const [checkinData, setCheckinData] = useState<CheckinResult | null>(null);

  // Scratch Card Lock state: ONLY true when notification permission is granted & token registered
  const [isScratchCardUnlocked, setIsScratchCardUnlocked] = useState(false);

  // Notification Permission State: 'default' | 'granted' | 'denied' | 'unsupported'
  const [permissionState, setPermissionState] = useState<
    "default" | "granted" | "denied" | "unsupported"
  >("default");
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Nearby Offers State
  const [isCheckingNearby, setIsCheckingNearby] = useState(false);
  const [nearbyResult, setNearbyResult] = useState<NearbyOfferResult | null>(null);

  const storageKey = `ugrahak_reward_${slug}`;

  // Check initial browser notification permission on mount & restore unlocked state if already granted
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        if (!("Notification" in window) || !("serviceWorker" in navigator)) {
          setPermissionState("unsupported");
        } else if (Notification.permission === "granted") {
          setPermissionState("granted");
        } else if (Notification.permission === "denied") {
          setPermissionState("denied");
        } else {
          setPermissionState("default");
        }
      }

      const saved =
        sessionStorage.getItem(storageKey) ||
        sessionStorage.getItem(`apnagrahak_reward_${slug}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.customer) {
          setCheckinData(parsed);
          // If already granted, unlock scratch card
          if (
            typeof window !== "undefined" &&
            ("Notification" in window ? Notification.permission === "granted" : true)
          ) {
            setIsScratchCardUnlocked(true);
          }
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, [storageKey]);

  /**
   * Helper: Register Push Token with backend
   */
  const registerPushToken = async (customerId: string, token: string) => {
    try {
      await fetch("/api/shop/notifications/register-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          customer_id: customerId,
          token,
          platform: "web",
        }),
      });
    } catch {
      // Graceful background token save failure
    }
  };

  /**
   * Primary Action: "Get Offer & Scratch Card"
   * 1. Validate inputs.
   * 2. Trigger browser notification permission prompt immediately in user gesture.
   * 3. Perform check-in.
   * 4. If permission granted -> register FCM token -> UNLOCK Scratch Card.
   * 5. If permission blocked/dismissed -> KEEP LOCKED & display permission requirement.
   */
  const handleGetOfferAndScratchCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent repeated clicks

    setError(null);
    setPermissionError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Please enter your name.");
      return;
    }

    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone || !isValidPhone(cleanPhone)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Perform Check-in API call to secure customer/reward record
      const checkinResponse = await fetch("/api/shop/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug,
          name: trimmedName,
          phone: cleanPhone,
        }),
      });

      const data = await checkinResponse.json();

      if (!checkinResponse.ok) {
        setError(data.error || "Failed to check in. Please try again.");
        setIsSubmitting(false);
        return;
      }

      setCheckinData(data);

      // 2. Browser Notification Permission Flow
      if (typeof window === "undefined" || !("Notification" in window)) {
        // Unsupported device/environment: unlock directly
        setPermissionState("unsupported");
        setIsScratchCardUnlocked(true);
        try {
          sessionStorage.setItem(storageKey, JSON.stringify(data));
        } catch {}
        setIsSubmitting(false);
        return;
      }

      // Check current permission
      const currentPermission = Notification.permission;

      if (currentPermission === "granted") {
        // Already granted: retrieve token, register, and unlock immediately
        setPermissionState("granted");
        const fcmRes = await requestNotificationPermissionAndToken();
        if (fcmRes.token && data.customer?.id) {
          await registerPushToken(data.customer.id, fcmRes.token);
        }
        setIsScratchCardUnlocked(true);
        try {
          sessionStorage.setItem(storageKey, JSON.stringify(data));
        } catch {}
      } else if (currentPermission === "denied") {
        // Explicitly denied in browser: do NOT unlock Scratch Card
        setPermissionState("denied");
        setIsScratchCardUnlocked(false);
        setPermissionError(
          "Offers are blocked in your browser settings. Please allow offers/notifications for this site to unlock your scratch card."
        );
      } else {
        // Permission is 'default': Trigger native browser permission prompt NOW
        const fcmRes = await requestNotificationPermissionAndToken();

        if (fcmRes.status === "granted") {
          setPermissionState("granted");
          if (fcmRes.token && data.customer?.id) {
            await registerPushToken(data.customer.id, fcmRes.token);
          }
          setIsScratchCardUnlocked(true);
          try {
            sessionStorage.setItem(storageKey, JSON.stringify(data));
          } catch {}
        } else if (fcmRes.status === "denied") {
          setPermissionState("denied");
          setIsScratchCardUnlocked(false);
          setPermissionError(
            "Offer permission was not allowed. You must enable offers to receive discounts and unlock the scratch card."
          );
        } else {
          // Dismissed / default
          setPermissionState("default");
          setIsScratchCardUnlocked(false);
          setPermissionError(
            "Permission is required to receive offers and unlock your scratch card."
          );
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Action on Locked Screen: "Allow Notifications to Unlock" / "Check Again"
   */
  const handleAllowNotificationsToUnlock = async () => {
    if (isRequestingPermission || !checkinData?.customer?.id) return;

    setIsRequestingPermission(true);
    setPermissionError(null);

    try {
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "granted") {
          setPermissionState("granted");
          const fcmRes = await requestNotificationPermissionAndToken();
          if (fcmRes.token) {
            await registerPushToken(checkinData.customer.id, fcmRes.token);
          }
          setIsScratchCardUnlocked(true);
          try {
            sessionStorage.setItem(storageKey, JSON.stringify(checkinData));
          } catch {}
          setIsRequestingPermission(false);
          return;
        }
      }

      // Request permission
      const fcmRes = await requestNotificationPermissionAndToken();

      if (fcmRes.status === "granted") {
        setPermissionState("granted");
        if (fcmRes.token && checkinData.customer?.id) {
          await registerPushToken(checkinData.customer.id, fcmRes.token);
        }
        setIsScratchCardUnlocked(true);
        try {
          sessionStorage.setItem(storageKey, JSON.stringify(checkinData));
        } catch {}
      } else if (fcmRes.status === "denied") {
        setPermissionState("denied");
        setIsScratchCardUnlocked(false);
        setPermissionError(
          "Offers are blocked in your browser. Click the lock icon in your browser address bar to allow notifications/offers, then tap Check Again."
        );
      } else {
        setPermissionState("default");
        setIsScratchCardUnlocked(false);
        setPermissionError(
          "Permission is required to receive this offer and unlock your scratch card."
        );
      }
    } catch (err: unknown) {
      setPermissionError(
        err instanceof Error ? err.message : "Could not complete notification setup."
      );
    } finally {
      setIsRequestingPermission(false);
    }
  };

  /**
   * Action: Nearby Proximity Check (100–200m)
   */
  const handleCheckNearbyOffers = () => {
    if (!checkinData?.customer?.id) return;

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
              customer_id: checkinData.customer.id,
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
            message:
              err instanceof Error
                ? err.message
                : "Failed to check nearby location.",
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

  /**
   * Reset / Check-in another customer
   */
  const handleReset = () => {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {}
    setCheckinData(null);
    setIsScratchCardUnlocked(false);
    setNearbyResult(null);
    setName("");
    setPhone("");
    setError(null);
    setPermissionError(null);
  };

  // =========================================================================
  // VIEW 1: LOCKED STATE (Check-in submitted but Notification Permission NOT Granted)
  // =========================================================================
  if (checkinData && !isScratchCardUnlocked) {
    return (
      <div className="space-y-4">
        {/* Locked Card Teaser */}
        <div className="p-6 rounded-3xl bg-white border border-amber-200 shadow-md text-center space-y-4 relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Scratch Card Locked
            </span>
            <h2 className="text-xl font-extrabold text-slate-900">
              Almost there, {checkinData.customer.name}!
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
              Enable offers to receive store discounts and unlock your exclusive scratch card.
            </p>
          </div>

          {/* Locked Canvas Mockup Preview */}
          <div className="relative w-full max-w-[320px] aspect-[16/9] mx-auto rounded-2xl bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 border-2 border-dashed border-amber-300 flex flex-col items-center justify-center p-4 shadow-inner">
            <Lock className="w-8 h-8 text-slate-500 mb-1 animate-pulse" />
            <span className="text-xs font-bold text-slate-700">
              Offer & Scratch Card Locked
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">
              Enable Offers to Unlock
            </span>
          </div>

          {/* Error / Instruction Alert */}
          {permissionError && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-left flex items-start gap-2.5 text-xs text-amber-950">
              <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Permission Required to Receive Offers</p>
                <p className="text-[11px] text-amber-900 mt-0.5">{permissionError}</p>
              </div>
            </div>
          )}

          {/* Action Button to request permission & unlock */}
          <div className="pt-2 space-y-2">
            <Button
              size="lg"
              onClick={handleAllowNotificationsToUnlock}
              isLoading={isRequestingPermission}
              className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 shadow-md text-sm min-h-[48px]"
            >
              <BellRing className="w-4 h-4 text-amber-300" />
              <span>
                {permissionState === "denied"
                  ? "Check Permission & Unlock"
                  : "Enable Offers to Unlock"}
              </span>
            </Button>

            {permissionState === "denied" && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 text-left space-y-1">
                <p className="font-semibold text-slate-800 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                  <span>How to allow offers in your browser:</span>
                </p>
                <ol className="list-decimal list-inside space-y-0.5 pl-1 text-[10px] text-slate-500">
                  <li>Tap the 🔒 lock icon near the address bar at the top.</li>
                  <li>Tap <strong>Permissions</strong> / <strong>Site settings</strong>.</li>
                  <li>Change <strong>Notifications / Offers</strong> to <strong>Allow</strong>.</li>
                  <li>Tap &quot;Check Permission &amp; Unlock&quot; above.</li>
                </ol>
              </div>
            )}
          </div>
        </div>

        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            Start Over
          </Button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: UNLOCKED STATE (Notification Permission Granted -> Scratch Card Revealed)
  // =========================================================================
  if (checkinData && isScratchCardUnlocked) {
    return (
      <div className="space-y-4">
        {checkinData.isFirstVisit && checkinData.reward ? (
          <div className="space-y-4">
            <div className="text-center">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Welcome Reward Unlocked!
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                Welcome, {checkinData.customer.name}!
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Scratch the card below to reveal your first-visit reward.
              </p>
            </div>

            {/* Interactive Scratch Card */}
            <ScratchCard
              rewardTitle={checkinData.reward.title}
              rewardDescription={checkinData.reward.description}
              referenceCode={checkinData.reward.reference_code}
              shopName={shopName}
              expiresAt={checkinData.reward.expires_at}
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
                Visit #{checkinData.visitCount}
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                Welcome back, {checkinData.customer.name}!
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Thank you for being a valued customer at {shopName}.
              </p>
            </div>

            {checkinData.reward ? (
              <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-left">
                <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
                  <Gift className="w-4 h-4" />
                  <span>Active Reward Available</span>
                </div>
                <p className="text-xs text-slate-700 mt-1 font-medium">
                  {checkinData.reward.title}
                </p>
                <div className="mt-2 font-mono text-sm font-bold text-slate-900 bg-white px-3 py-1 rounded border border-amber-200 inline-block">
                  Code: {checkinData.reward.reference_code}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                Keep visiting {shopName} to earn more rewards and special offers!
              </div>
            )}
          </div>
        )}

        {/* Feature 1: Push Notification Status Badge */}
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center flex items-center justify-center gap-2 text-xs font-semibold text-emerald-800 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Store Offers Active • You will receive exclusive discounts</span>
        </div>

        {/* Feature 2: Nearby Offers (100–200m) Card */}
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
            <span>
              {isCheckingNearby
                ? "Checking Store Proximity..."
                : "Check Nearby Store Offers"}
            </span>
          </Button>

          {nearbyResult && (
            <div className="pt-2 text-left">
              {nearbyResult.status === "ELIGIBLE" && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1.5">
                  <p className="font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>
                      You&apos;re near this shop! 🎉 ({nearbyResult.distanceMeters}m away)
                    </span>
                  </p>
                  {nearbyResult.offer && (
                    <div className="mt-1.5 pt-1.5 border-t border-emerald-200 text-emerald-950">
                      <p className="font-bold text-xs">{nearbyResult.offer.title}</p>
                      <p className="text-[11px] text-emerald-800 mt-0.5">
                        {nearbyResult.offer.message}
                      </p>
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
                  <p className="font-semibold">
                    {nearbyResult.message || "Location check completed."}
                  </p>
                </div>
              )}
            </div>
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
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            Check-in Another Person
          </Button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: INITIAL ENROLLMENT / QR CHECK-IN FORM
  // =========================================================================
  return (
    <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
      <div className="text-center mb-5">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2 shadow-sm">
          <Gift className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          Claim Your Store Reward
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Enter your name &amp; phone to unlock instant rewards.
        </p>
      </div>

      {error && <Alert type="error" message={error} className="mb-4 text-xs" />}

      <form onSubmit={handleGetOfferAndScratchCard} className="space-y-4 text-left">
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
          className="w-full mt-2 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 text-sm min-h-[48px] shadow-sm"
          size="lg"
          isLoading={isSubmitting}
        >
          <span>Get Offer &amp; Scratch Card</span>
          <ArrowRight className="w-4 h-4" />
        </Button>

        <p className="text-[10px] text-center text-slate-400 flex items-center justify-center gap-1">
          <Bell className="w-3 h-3 text-slate-400" />
          <span>Enable offers to receive your reward &amp; scratch card</span>
        </p>
      </form>
    </div>
  );
};
