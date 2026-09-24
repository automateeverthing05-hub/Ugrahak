import { initializeApp, getApps, getApp, cert, type App } from "firebase-admin/app";
import { getMessaging, type MulticastMessage, type Message, type SendResponse } from "firebase-admin/messaging";

// Ensure this module is never loaded client-side
if (typeof window !== "undefined") {
  throw new Error("Firebase Admin must only be executed on the server.");
}

function getFirebaseAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!clientEmail || !privateKey || !projectId) {
    throw new Error(
      "Missing Firebase Admin credentials (FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, or NEXT_PUBLIC_FIREBASE_PROJECT_ID)."
    );
  }

  // Format private key properly
  privateKey = privateKey.replace(/\\n/g, "\n").trim();
  // Ensure PEM quotes are stripped if any
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export interface SendPushPayload {
  tokens: string[];
  title: string;
  body: string;
  imageUrl?: string | null;
  linkUrl?: string;
  data?: Record<string, string>;
}

export interface SendPushResult {
  successfulTokens: string[];
  invalidTokens: string[];
  failedTokens: { token: string; error: string }[];
  totalSent: number;
  totalFailed: number;
}

/**
 * Broadcasts push notifications to a list of device tokens using Firebase Admin SDK.
 * Configured with Urgency: 'high' and priority: 'high' for immediate delivery without 30-min doze delay.
 */
export async function sendMulticastPushNotification({
  tokens,
  title,
  body,
  imageUrl,
  linkUrl,
  data = {},
}: SendPushPayload): Promise<SendPushResult> {
  const result: SendPushResult = {
    successfulTokens: [],
    invalidTokens: [],
    failedTokens: [],
    totalSent: 0,
    totalFailed: 0,
  };

  // Filter valid non-empty tokens
  const cleanTokens = Array.from(
    new Set(
      (tokens || [])
        .map((t) => (typeof t === "string" ? t.trim() : ""))
        .filter((t) => t.length > 20)
    )
  );

  if (cleanTokens.length === 0) {
    return result;
  }

  // Safe Mock FCM Delivery for Load Testing / Staging (never contacts Firebase or real devices)
  if (process.env.MOCK_FCM === "true") {
    // Simulate realistic async network dispatch delay (~10ms)
    await new Promise((resolve) => setTimeout(resolve, 10));
    result.successfulTokens = cleanTokens;
    result.totalSent = cleanTokens.length;
    result.totalFailed = 0;
    return result;
  }

  const app = getFirebaseAdminApp();
  const messaging = getMessaging(app);

  const resolvedLinkUrl = linkUrl || "/";

  // Batch tokens into chunks of 500 (FCM multicast limit)
  const chunkSize = 500;
  for (let i = 0; i < cleanTokens.length; i += chunkSize) {
    const chunk = cleanTokens.slice(i, i + chunkSize);

    const message: MulticastMessage = {
      tokens: chunk,
      notification: {
        title,
        body,
        ...(imageUrl ? { imageUrl } : {}),
      },
      data: {
        ...data,
        title,
        body,
        image: imageUrl || "",
        click_action: resolvedLinkUrl,
        url: resolvedLinkUrl,
      },
      // Web Push configuration: Urgency: 'high' forces immediate delivery across browsers
      webpush: {
        headers: {
          Urgency: "high",
          TTL: "86400",
        },
        fcmOptions: {
          link: resolvedLinkUrl,
        },
        notification: {
          title,
          body,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          ...(imageUrl ? { image: imageUrl } : {}),
          requireInteraction: true,
          data: {
            url: resolvedLinkUrl,
          },
        },
      },
      // Android configuration: priority: 'high' prevents background doze/delay
      android: {
        priority: "high",
        notification: {
          title,
          body,
          ...(imageUrl ? { imageUrl } : {}),
          priority: "high",
          defaultSound: true,
          defaultVibrateTimings: true,
          clickAction: resolvedLinkUrl,
        },
      },
      // APNs configuration: priority: '10' for instant Apple delivery
      apns: {
        headers: {
          "apns-priority": "10",
          "apns-push-type": "alert",
        },
        payload: {
          aps: {
            alert: {
              title,
              body,
            },
            sound: "default",
          },
        },
        fcmOptions: {
          ...(imageUrl ? { imageUrl } : {}),
        },
      },
    };

    try {
      const response = await messaging.sendEachForMulticast(message);

      response.responses.forEach((resp: SendResponse, idx: number) => {
        const token = chunk[idx];
        if (resp.success) {
          result.successfulTokens.push(token);
          result.totalSent++;
        } else {
          result.totalFailed++;
          const errorCode = resp.error?.code || "unknown";
          const errorMessage = resp.error?.message || "Send failed";

          if (
            errorCode === "messaging/registration-token-not-registered" ||
            errorCode === "messaging/invalid-registration-token" ||
            errorCode === "messaging/invalid-argument" ||
            errorMessage.includes("not registered") ||
            errorMessage.includes("invalid")
          ) {
            result.invalidTokens.push(token);
          } else {
            result.failedTokens.push({ token, error: `${errorCode}: ${errorMessage}` });
          }
        }
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Multicast send error";
      chunk.forEach((token) => {
        result.totalFailed++;
        result.failedTokens.push({ token, error: errMsg });
      });
    }
  }

  return result;
}

export interface IndividualPushItem {
  token: string;
  title: string;
  body: string;
  imageUrl?: string | null;
  linkUrl?: string;
  data?: Record<string, string>;
}

/**
 * Sends individually personalized push notifications to multiple devices.
 * Supports custom bodies (e.g. customized recipient name, shop name, contact number) per token.
 */
export async function sendPersonalizedPushNotifications(
  items: IndividualPushItem[]
): Promise<SendPushResult> {
  const result: SendPushResult = {
    successfulTokens: [],
    invalidTokens: [],
    failedTokens: [],
    totalSent: 0,
    totalFailed: 0,
  };

  const validItems = (items || []).filter(
    (item) => item && typeof item.token === "string" && item.token.trim().length > 20
  );

  if (validItems.length === 0) {
    return result;
  }

  if (process.env.MOCK_FCM === "true") {
    await new Promise((resolve) => setTimeout(resolve, 10));
    result.successfulTokens = validItems.map((i) => i.token.trim());
    result.totalSent = validItems.length;
    result.totalFailed = 0;
    return result;
  }

  const app = getFirebaseAdminApp();
  const messaging = getMessaging(app);

  const chunkSize = 500;
  for (let i = 0; i < validItems.length; i += chunkSize) {
    const chunk = validItems.slice(i, i + chunkSize);

    const messages: Message[] = chunk.map((item) => {
      const resolvedLinkUrl = item.linkUrl || "/";
      return {
        token: item.token.trim(),
        notification: {
          title: item.title,
          body: item.body,
          ...(item.imageUrl ? { imageUrl: item.imageUrl } : {}),
        },
        data: {
          ...(item.data || {}),
          title: item.title,
          body: item.body,
          image: item.imageUrl || "",
          click_action: resolvedLinkUrl,
          url: resolvedLinkUrl,
        },
        webpush: {
          headers: {
            Urgency: "high",
            TTL: "86400",
          },
          fcmOptions: {
            link: resolvedLinkUrl,
          },
          notification: {
            title: item.title,
            body: item.body,
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            ...(item.imageUrl ? { image: item.imageUrl } : {}),
            requireInteraction: true,
            data: {
              url: resolvedLinkUrl,
            },
          },
        },
        android: {
          priority: "high",
          notification: {
            title: item.title,
            body: item.body,
            ...(item.imageUrl ? { imageUrl: item.imageUrl } : {}),
            priority: "high",
            defaultSound: true,
            defaultVibrateTimings: true,
            clickAction: resolvedLinkUrl,
          },
        },
        apns: {
          headers: {
            "apns-priority": "10",
            "apns-push-type": "alert",
          },
          payload: {
            aps: {
              alert: {
                title: item.title,
                body: item.body,
              },
              sound: "default",
            },
          },
          fcmOptions: {
            ...(item.imageUrl ? { imageUrl: item.imageUrl } : {}),
          },
        },
      };
    });

    try {
      const response = await messaging.sendEach(messages);

      response.responses.forEach((resp: SendResponse, idx: number) => {
        const item = chunk[idx];
        const token = item.token.trim();
        if (resp.success) {
          result.successfulTokens.push(token);
          result.totalSent++;
        } else {
          result.totalFailed++;
          const errorCode = resp.error?.code || "unknown";
          const errorMessage = resp.error?.message || "Send failed";

          if (
            errorCode === "messaging/registration-token-not-registered" ||
            errorCode === "messaging/invalid-registration-token" ||
            errorCode === "messaging/invalid-argument" ||
            errorMessage.includes("not registered") ||
            errorMessage.includes("invalid")
          ) {
            result.invalidTokens.push(token);
          } else {
            result.failedTokens.push({ token, error: `${errorCode}: ${errorMessage}` });
          }
        }
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Batch send error";
      chunk.forEach((item) => {
        const token = item.token.trim();
        result.totalFailed++;
        result.failedTokens.push({ token, error: errMsg });
      });
    }
  }

  return result;
}
