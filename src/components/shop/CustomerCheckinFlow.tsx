"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ScratchCard } from "@/components/shop/ScratchCard";
import { requestNotificationPermissionAndToken } from "@/lib/firebase/client";
import {
  Gift,
  Sparkles,
  ArrowRight,
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

type FlowStep = "NAME" | "ALLOW_OFFERS" | "GET_REWARD" | "REVEALED";

export const CustomerCheckinFlow: React.FC<CustomerCheckinFlowProps> = ({
  slug,
  shopName,
  googleMapsUrl,
}) => {
  const [step, setStep] = useState<FlowStep>("NAME");
  const [name, setName] = useState("");
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
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
            setStep("REVEALED");
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
   * STEP 2 -> STEP 3: Handle Name Submit ("Continue")
   */
  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Please enter your name.");
      return;
    }

    if (trimmedName.length > 100) {
      setError("Name cannot exceed 100 characters.");
      return;
    }

    setName(trimmedName);

    // If notifications are already granted in browser or unsupported, jump directly to GET_REWARD
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        setPermissionState("granted");
        requestNotificationPermissionAndToken().then((res) => {
          if (res.token) setFcmToken(res.token);
          setStep("GET_REWARD");
        });
        return;
      }
    } else if (typeof window !== "undefined" && !("Notification" in window)) {
      setPermissionState("unsupported");
      setStep("GET_REWARD");
      return;
    }

    setStep("ALLOW_OFFERS");
  };

  /**
   * STEP 3: Handle "Allow Offers" Button Click
   */
  const handleAllowOffers = async () => {
    if (isRequestingPermission) return;
    setIsRequestingPermission(true);
    setPermissionError(null);

    try {
      if (typeof window === "undefined" || !("Notification" in window)) {
        setPermissionState("unsupported");
        setStep("GET_REWARD");
        setIsRequestingPermission(false);
        return;
      }

      const fcmRes = await requestNotificationPermissionAndToken();

      if (fcmRes.status === "granted") {
        setPermissionState("granted");
        if (fcmRes.token) {
          setFcmToken(fcmRes.token);
        }
        setStep("GET_REWARD");
      } else if (fcmRes.status === "denied") {
        setPermissionState("denied");
        setPermissionError(
          "Offers are blocked in your browser settings. Please allow offers for this site to unlock your scratch card."
        );
      } else {
        setPermissionState("default");
        setPermissionError(
          "Permission is required to receive offers and unlock your scratch card."
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
   * STEP 4: Handle "Get My Reward" Button Click
   */
  const handleGetMyReward = async () => {
    if (isSubmitting) return; // Prevent double click / race conditions
    setError(null);
    setIsSubmitting(true);

    try {
      const trimmedName = name.trim();
      if (!trimmedName) {
        setError("Please enter your name.");
        setStep("NAME");
        setIsSubmitting(false);
        return;
      }

      // Check Notification permission gating: Must be granted or unsupported
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission !== "granted"
      ) {
        setPermissionState(Notification.permission === "denied" ? "denied" : "default");
        setStep("ALLOW_OFFERS");
        setIsSubmitting(false);
        return;
      }

      // Perform check-in API call to generate server-side unique ID and create reward
      const checkinResponse = await fetch("/api/shop/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          name: trimmedName,
        }),
      });

      const data = await checkinResponse.json();

      if (!checkinResponse.ok) {
        setError(data.error || "Failed to record your visit. Please try again.");
        setIsSubmitting(false);
        return;
      }

      setCheckinData(data);

      // Register FCM push token if available
      let tokenToRegister = fcmToken;
      if (!tokenToRegister && typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        const tokenRes = await requestNotificationPermissionAndToken();
        if (tokenRes.token) {
          tokenToRegister = tokenRes.token;
          setFcmToken(tokenRes.token);
        }
      }

      if (tokenToRegister && data.customer?.id) {
        await registerPushToken(data.customer.id, tokenToRegister);
      }

      // Unlock scratch card
      setIsScratchCardUnlocked(true);
      setStep("REVEALED");

      try {
        sessionStorage.setItem(storageKey, JSON.stringify(data));
      } catch {}
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
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
              ? "Location permission is required for Offers for Nearby Customers. Please enable location permission in your browser settings."
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
    setFcmToken(null);
    setError(null);
    setPermissionError(null);
    setStep("NAME");
  };

  // =========================================================================
  // VIEW 4: SCRATCH CARD / REVEALED STATE
  // =========================================================================
  if (step === "REVEALED" && checkinData && isScratchCardUnlocked) {
    return (
      <div className="space-y-4">
        {checkinData.reward ? (
          <div className="space-y-4">
            <div className="text-center">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                New Customer Reward Unlocked!
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                Welcome, {checkinData.customer.name}!
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Scratch to reveal your reward and show it at the counter.
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
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm text-center space-y-4">
            <h2 className="text-xl font-bold text-slate-900">
              Welcome, {checkinData.customer.name}!
            </h2>
            <p className="text-xs text-slate-500">
              Thank you for visiting {shopName}.
            </p>
          </div>
        )}

        {/* Status Badge */}
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center flex items-center justify-center gap-2 text-xs font-semibold text-emerald-800 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Offers Are Enabled • You will receive exclusive discounts</span>
        </div>

        {/* Nearby Offers (100–200m) Card */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-center space-y-2.5">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-800">
            <Navigation className="w-4 h-4 text-indigo-600" />
            <span>Offers for Nearby Customers (100–200m)</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Allow location to receive offers when you are near this shop.
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
                : "Check Offers Near Me"}
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

        {/* Google Review Card */}
        {googleMapsUrl && (
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 shadow-sm text-center space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-amber-900 font-bold text-xs">
              <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
              <span>Enjoyed your experience?</span>
            </div>
            <p className="text-[11px] text-amber-800/80">
              Make it easy to support our shop with a Google review!
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
  // VIEW 3: STEP 4 -> "Get My Reward"
  // =========================================================================
  if (step === "GET_REWARD") {
    return (
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
          <Gift className="w-7 h-7" />
        </div>

        <div>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Ready for Your Reward!
          </span>
          <h2 className="text-xl font-extrabold text-slate-900">
            Hi {name}!
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Tap below to claim your exclusive scratch card from {shopName}.
          </p>
        </div>

        {error && <Alert type="error" message={error} className="text-xs text-left" />}

        <div className="pt-2 space-y-2">
          <Button
            size="lg"
            onClick={handleGetMyReward}
            isLoading={isSubmitting}
            className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 shadow-md text-sm min-h-[48px]"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Get My Reward</span>
            <ArrowRight className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep("NAME")}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            Change Name
          </Button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: STEP 3 -> "Allow Offers" (Permission Gating)
  // =========================================================================
  if (step === "ALLOW_OFFERS") {
    return (
      <div className="p-6 rounded-3xl bg-white border border-amber-200 shadow-md text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-7 h-7" />
        </div>

        <div>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Reward Locked
          </span>
          <h2 className="text-xl font-extrabold text-slate-900">
            Allow Offers to Get Your Reward
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
            Allow offers to receive exclusive discounts from {shopName} and unlock your scratch card.
          </p>
        </div>

        {/* Error / Permission Alert */}
        {permissionError && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-left flex items-start gap-2.5 text-xs text-amber-950">
            <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Permission Required to Receive Offers</p>
              <p className="text-[11px] text-amber-900 mt-0.5">{permissionError}</p>
            </div>
          </div>
        )}

        <div className="pt-2 space-y-2">
          <Button
            size="lg"
            onClick={handleAllowOffers}
            isLoading={isRequestingPermission}
            className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 shadow-md text-sm min-h-[48px]"
          >
            <BellRing className="w-4 h-4 text-amber-300" />
            <span>
              {permissionState === "denied"
                ? "Check Permission Again"
                : "Allow Offers to Get Your Reward"}
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
                <li>Change <strong>Offers</strong> / <strong>Notifications</strong> to <strong>Allow</strong>.</li>
                <li>Tap &quot;Check Permission Again&quot; above.</li>
              </ol>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep("NAME")}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            Back
          </Button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: STEP 2 -> NAME ENTRY ("Your Name" -> "Continue")
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
          Enter your name to unlock your scratch card reward.
        </p>
      </div>

      {error && <Alert type="error" message={error} className="mb-4 text-xs" />}

      <form onSubmit={handleNameSubmit} className="space-y-4 text-left">
        <div>
          <Input
            label="Your Name"
            placeholder="e.g. Rahul Sharma"
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <Button
          type="submit"
          className="w-full mt-2 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 text-sm min-h-[48px] shadow-sm"
          size="lg"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </Button>

        <p className="text-[10px] text-center text-slate-400 flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>Quick check-in &bull; Instant scratch card reward</span>
        </p>
      </form>
    </div>
  );
};
