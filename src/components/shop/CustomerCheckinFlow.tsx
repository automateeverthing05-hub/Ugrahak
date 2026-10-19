"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ScratchCard } from "@/components/shop/ScratchCard";
import {
  requestNotificationPermissionAndToken,
  isPushNotificationSupported,
  requestNativePermission,
} from "@/lib/firebase/client";
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

type FlowStep = "NAME" | "ALLOW_OFFERS" | "REVEALED";

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

  // Checkin API response data
  const [checkinData, setCheckinData] = useState<CheckinResult | null>(null);

  // Scratch Card Lock state: ONLY true when notification permission is granted & token registered (or unsupported)
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
        if (!isPushNotificationSupported()) {
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
          // If already granted or unsupported, unlock scratch card
          if (
            typeof window !== "undefined" &&
            (isPushNotificationSupported() ? Notification.permission === "granted" : true)
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
   * Background task: Resolve FCM token & register with backend without blocking UI.
   * Accepts resolved permission to ensure we register even if browser updated permission asynchronously.
   */
  const handleBackgroundTokenRegistration = async (customerId: string, resolvedPermission?: NotificationPermission) => {
    try {
      if (typeof window === "undefined" || !isPushNotificationSupported()) {
        setPermissionState("unsupported");
        return;
      }

      const activePermission = resolvedPermission || Notification.permission;
      if (activePermission === "granted") {
        setPermissionState("granted");
        const tokenRes = await requestNotificationPermissionAndToken("granted");
        if (tokenRes.token) {
          setFcmToken(tokenRes.token);
          await registerPushToken(customerId, tokenRes.token);
        }
      } else if (activePermission === "denied") {
        setPermissionState("denied");
      } else {
        setPermissionState("default");
      }
    } catch {
      // Non-blocking background error
    }
  };

  /**
   * DIRECT USER CLICK HANDLER: "Offers Enable Karein"
   * 1. Synchronously requests native browser notification permission on user gesture
   * 2. Parallelizes customer check-in API request
   * 3. Instantly reveals scratch card reward upon check-in response (never blocked!)
   * 4. Asynchronously obtains and registers FCM token if permission is granted
   */
  const handleCheckinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setPermissionError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Please enter your name.");
      return;
    }

    if (trimmedName.length > 100) {
      setError("Name cannot exceed 100 characters.");
      return;
    }

    // 1. Synchronously initiate native browser permission prompt on this direct user gesture
    // NEVER put any async/await before this call.
    let permissionPromise: Promise<NotificationPermission> | null = null;
    if (typeof window !== "undefined" && isPushNotificationSupported() && Notification.permission === "default") {
      try {
        permissionPromise = requestNativePermission();
      } catch {
        // Fallback gracefully
      }
    }

    setName(trimmedName);
    setIsSubmitting(true);

    // 2. Dispatch check-in API request immediately
    try {
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

      // 3. Instantly unlock scratch card and reveal reward UI (reward is NEVER blocked)
      setCheckinData(data);
      setIsScratchCardUnlocked(true);
      setStep("REVEALED");
      setIsSubmitting(false);

      try {
        sessionStorage.setItem(storageKey, JSON.stringify(data));
      } catch {}

      // 4. Background non-blocking FCM token resolution & registration
      void (async () => {
        let finalPerm: NotificationPermission = Notification.permission;
        if (permissionPromise) {
          try {
            finalPerm = await permissionPromise;
            if (finalPerm === "granted") {
              setPermissionState("granted");
            } else if (finalPerm === "denied") {
              setPermissionState("denied");
            } else {
              setPermissionState("default");
            }
          } catch {}
        }
        if (data.customer?.id) {
          await handleBackgroundTokenRegistration(data.customer.id, finalPerm);
        }
      })();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  /**
   * STEP 3: Handle "Enable Offers" when previously dismissed/blocked/denied
   */
  const handleAllowOffers = async () => {
    if (isSubmitting) return;

    // Trigger native permission synchronously if in default state
    let directPermissionPromise: Promise<NotificationPermission> | null = null;
    if (typeof window !== "undefined" && isPushNotificationSupported() && Notification.permission === "default") {
      try {
        directPermissionPromise = requestNativePermission();
      } catch {}
    }

    setIsSubmitting(true);
    setPermissionError(null);
    setError(null);

    try {
      if (!isPushNotificationSupported()) {
        setPermissionState("unsupported");
        setIsScratchCardUnlocked(true);
        setStep("REVEALED");
        setIsSubmitting(false);
        return;
      }

      let perm: NotificationPermission = Notification.permission;
      if (directPermissionPromise) {
        perm = await directPermissionPromise;
      }

      const fcmRes = await requestNotificationPermissionAndToken(perm);

      if (fcmRes.status === "granted") {
        setPermissionState("granted");
        if (fcmRes.token) {
          setFcmToken(fcmRes.token);
          if (checkinData?.customer?.id) {
            await registerPushToken(checkinData.customer.id, fcmRes.token);
          }
        }
        setIsScratchCardUnlocked(true);
        setStep("REVEALED");
      } else if (fcmRes.status === "denied") {
        setPermissionState("denied");
        setPermissionError(
          "Notification permission is blocked in browser settings. Please click the lock icon in the browser address bar to allow offers."
        );
      } else if (fcmRes.status === "unsupported") {
        setPermissionState("unsupported");
        setIsScratchCardUnlocked(true);
        setStep("REVEALED");
      } else {
        setPermissionState("default");
        setPermissionError(
          "Offers permission was dismissed. You can enable it anytime to receive store updates."
        );
      }
    } catch (err: unknown) {
      setPermissionError(
        err instanceof Error ? err.message : "Could not complete notification setup."
      );
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
  // VIEW 2: SCRATCH CARD / REVEALED STATE ("🎁 Aapka Reward")
  // =========================================================================
  if (step === "REVEALED" && checkinData && isScratchCardUnlocked) {
    return (
      <div className="space-y-4">
        {checkinData.reward ? (
          <div className="space-y-4">
            <div className="text-center">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                🎁 Aapka Reward
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                Welcome, {checkinData.customer.name}!
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Card ko scratch karke apna reward dekhein aur counter par dikhayein.
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
              {shopName} par aane ke liye shukriya.
            </p>
          </div>
        )}

        {/* Status Badge */}
        {permissionState === "granted" ? (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center flex items-center justify-center gap-2 text-xs font-semibold text-emerald-800 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Offers Enable Ho Gaye • Aapko exclusive offers milenge</span>
          </div>
        ) : permissionState === "unsupported" ? (
          <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-center flex items-center justify-center gap-2 text-xs font-semibold text-indigo-900 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span>🎁 Reward Unlock Ho Gaya • Counter par code dikhayein</span>
          </div>
        ) : permissionState === "denied" ? (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-left space-y-2 text-xs text-amber-950 shadow-xs">
            <div className="flex items-center gap-2 font-semibold text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Offers notifications browser me block hain</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Browser ke address bar me 🔒 lock icon dabakar Notification allow karein taaki future offers miss na hon.
            </p>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-slate-700 shadow-xs">
            <div className="flex items-center gap-2 font-semibold">
              <BellRing className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>Future offers pane ke liye notifications enable karein</span>
            </div>
            <Button
              size="sm"
              onClick={handleAllowOffers}
              isLoading={isSubmitting}
              className="w-full sm:w-auto text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
            >
              Enable Karein
            </Button>
          </div>
        )}

        {/* Nearby Offers (100–200m) Card */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-center space-y-2.5">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-800">
            <Navigation className="w-4 h-4 text-indigo-600" />
            <span>Nearby Offers (100–200m)</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Location allow karein taaki shop ke paas aane par aapko offers milein.
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
                : "Offers Near Me Check Karein"}
            </span>
          </Button>

          {nearbyResult && (
            <div className="pt-2 text-left">
              {nearbyResult.status === "ELIGIBLE" && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1.5">
                  <p className="font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>
                      Aap is shop ke paas hain! 🎉 ({nearbyResult.distanceMeters}m away)
                    </span>
                  </p>
                  {nearbyResult.offer && (
                    <div className="mt-1.5 pt-1.5 border-t border-emerald-200 text-emerald-950 space-y-1.5">
                      {nearbyResult.offer.image_url && (
                        <div className="w-full h-32 rounded-lg overflow-hidden bg-slate-100 border border-emerald-200">
                          <img
                            src={nearbyResult.offer.image_url}
                            alt={nearbyResult.offer.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
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
                  <p className="font-semibold">Shop Radius Se Bahar</p>
                  <p className="text-[11px] mt-0.5">
                    {nearbyResult.message || "Abhi koi nearby offer available nahi hai."}
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
                    {nearbyResult.message || "Location check complete ho gaya."}
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
              <span>Shop par achha laga?</span>
            </div>
            <p className="text-[11px] text-amber-800/80">
              Aapka review shop ke liye bahut helpful hoga!
            </p>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 text-xs font-semibold text-amber-950 bg-amber-200 hover:bg-amber-300 rounded-xl transition-colors shadow-sm"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Google Review Dein</span>
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
            Kisi aur customer ko check-in karein
          </Button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: PERMISSION DENIED GUIDANCE VIEW
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
            🎁 Aapka Reward
          </span>
          <h2 className="text-xl font-extrabold text-slate-900">
            Reward Paane Ke Liye Offers Enable Karein
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
            Please browser settings me Offers enable karein taaki aapko reward mil sake.
          </p>
        </div>

        {/* Permission Message */}
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-left flex items-start gap-2.5 text-xs text-amber-950">
          <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Offers enable karein aur reward paayein.</p>
            {permissionError && (
              <p className="text-[11px] text-amber-900 mt-0.5">{permissionError}</p>
            )}
          </div>
        </div>

        <div className="pt-2 space-y-2">
          <Button
            size="lg"
            onClick={handleAllowOffers}
            isLoading={isSubmitting}
            className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 shadow-md text-sm min-h-[48px]"
          >
            <BellRing className="w-4 h-4 text-amber-300" />
            <span>Offers Enable Karein</span>
          </Button>

          {permissionState === "denied" && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 text-left space-y-1">
              <p className="font-semibold text-slate-800 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                <span>Offers kaise enable karein:</span>
              </p>
              <ol className="list-decimal list-inside space-y-0.5 pl-1 text-[10px] text-slate-500">
                <li>Upar address bar ke paas 🔒 lock icon par tap karein.</li>
                <li><strong>Site settings</strong> ya <strong>Permissions</strong> par tap karein.</li>
                <li><strong>Offers</strong> / <strong>Notifications</strong> ko <strong>Allow</strong> karein.</li>
                <li>Phir upar &quot;Offers Enable Karein&quot; dabayein.</li>
              </ol>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep("NAME")}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            Wapas Jayein
          </Button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: NAME ENTRY ("Apna Naam Likhein" -> "Offers Enable Karein")
  // =========================================================================
  return (
    <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
      <div className="text-center mb-5">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2 shadow-sm">
          <Gift className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          Apna Store Reward Paayein
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Apna naam likhein aur scratch card reward unlock karein.
        </p>
      </div>

      {error && <Alert type="error" message={error} className="mb-4 text-xs" />}

      <form onSubmit={handleCheckinSubmit} className="space-y-4 text-left">
        <div>
          <Input
            label="Apna Naam Likhein"
            placeholder="Jaise: Rahul Sharma"
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="pt-1 pb-1">
          <p className="text-[11px] text-slate-500 leading-relaxed text-center bg-slate-50 border border-slate-100 rounded-xl py-1.5 px-2">
            ऑफ़र और इनाम पाने के लिए अनुमति दें — आप कभी भी नोटिफिकेशन बंद कर सकते हैं।
          </p>
        </div>

        <Button
          type="submit"
          isLoading={isSubmitting}
          className="w-full mt-1 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 text-sm min-h-[48px] shadow-sm"
          size="lg"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Offers Enable Karein</span>
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

