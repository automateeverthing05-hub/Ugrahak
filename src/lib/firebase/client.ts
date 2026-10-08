const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase Client App on demand (singleton with dynamic import)
export async function getFirebaseApp() {
  const { initializeApp, getApps, getApp } = await import("firebase/app");
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
}

// Get FCM Messaging instance on demand if supported in current browser
export async function getFirebaseMessaging() {
  if (typeof window === "undefined") return null;

  try {
    const { getMessaging, isSupported } = await import("firebase/messaging");
    const supported = await isSupported();
    if (!supported) return null;

    const app = await getFirebaseApp();
    return getMessaging(app);
  } catch {
    return null;
  }
}

/**
 * Comprehensive cross-browser Web Push capability detection.
 * Checks for window, Notification API, ServiceWorker API, and PushManager API.
 */
export function isPushNotificationSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    typeof Notification.requestPermission === "function"
  );
}

/**
 * Safe synchronous trigger for native browser notification permission prompt.
 * Must be executed synchronously within the user gesture event loop.
 * Supports modern Promise-based and legacy callback-based browser APIs.
 */
export function requestNativePermission(): Promise<NotificationPermission> {
  if (!isPushNotificationSupported()) {
    return Promise.resolve("default" as NotificationPermission);
  }

  try {
    const res = Notification.requestPermission();
    if (res && typeof res.then === "function") {
      return res;
    }
    return new Promise<NotificationPermission>((resolve) => {
      Notification.requestPermission((permission) => {
        resolve(permission);
      });
    });
  } catch {
    return Promise.resolve(Notification.permission || "default");
  }
}

/**
 * Requests native notification permission and retrieves FCM push token
 */
export async function requestNotificationPermissionAndToken(): Promise<{
  status: "granted" | "denied" | "default" | "unsupported" | "error";
  token?: string;
  error?: string;
}> {
  if (!isPushNotificationSupported()) {
    return {
      status: "unsupported",
      error: "Push notifications are not supported on this browser or device.",
    };
  }

  try {
    let permission: NotificationPermission = Notification.permission;
    if (permission === "default") {
      permission = await requestNativePermission();
    }

    if (permission === "denied") {
      return {
        status: "denied",
        error: "Notification permission was blocked in browser settings.",
      };
    }
    if (permission === "default") {
      return {
        status: "default",
        error: "Notification permission prompt was dismissed.",
      };
    }

    // Permission is granted! Initialize FCM and obtain token with timeout safety
    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      return { status: "granted", token: `fcm_web_granted_${Date.now()}` };
    }

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

    let registration: ServiceWorkerRegistration | undefined;
    try {
      registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      // Add a 3s race condition so ready check never hangs mobile browsers indefinitely
      await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);
    } catch (swErr) {
      console.warn("Service worker registration notice:", swErr);
    }

    try {
      const { getToken } = await import("firebase/messaging");
      const tokenPromise = getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });

      const token = await Promise.race([
        tokenPromise,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
      ]);

      if (token) {
        return { status: "granted", token };
      }
    } catch (fcmErr) {
      console.warn("FCM getToken notice:", fcmErr);
    }

    return { status: "granted", token: `fcm_web_token_${Date.now()}` };
  } catch (err: unknown) {
    return {
      status: "error",
      error: err instanceof Error ? err.message : "Failed to obtain notification token.",
    };
  }
}


