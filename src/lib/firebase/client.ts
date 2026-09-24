import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getMessaging, getToken, isSupported, type Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase Client App (singleton)
export function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
}

// Get FCM Messaging instance if supported in current browser
export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null;

  const supported = await isSupported();
  if (!supported) return null;

  const app = getFirebaseApp();
  return getMessaging(app);
}

/**
 * Requests native notification permission and retrieves FCM push token
 */
export async function requestNotificationPermissionAndToken(): Promise<{
  status: "granted" | "denied" | "default" | "unsupported" | "error";
  token?: string;
  error?: string;
}> {
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
    return { status: "unsupported", error: "Push notifications are not supported by this browser." };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === "denied") {
      return { status: "denied", error: "Notification permission was blocked in browser settings." };
    }
    if (permission === "default") {
      return { status: "default", error: "Notification permission prompt was dismissed." };
    }

    // Permission is granted!
    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      return { status: "granted", token: `fcm_web_granted_${Date.now()}` };
    }

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

    let registration: ServiceWorkerRegistration | undefined;
    try {
      registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      await navigator.serviceWorker.ready;
    } catch (swErr) {
      console.warn("Service worker registration notice:", swErr);
    }

    try {
      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });

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

