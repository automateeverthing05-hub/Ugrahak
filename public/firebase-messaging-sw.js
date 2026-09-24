// Ugrahak Firebase Cloud Messaging Service Worker
// Provides immediate notification reception, vibration, badges, and click-to-open routing.

/* eslint-disable no-restricted-globals */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Native Push Event Listener (Runs immediately when Web Push packet arrives from FCM)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();

    const notification = payload.notification || {};
    const data = payload.data || {};
    const webpush = payload.webpush || {};

    const title =
      notification.title ||
      data.title ||
      'Ugrahak Store Offer';

    const body =
      notification.body ||
      data.body ||
      'You have received an exclusive promotional deal!';

    const icon = notification.icon || webpush.notification?.icon || '/favicon.ico';
    const image = notification.image || notification.imageUrl || data.image || data.imageUrl || undefined;
    const targetUrl = data.url || data.click_action || payload.fcmOptions?.link || '/';

    const options = {
      body,
      icon,
      badge: '/favicon.ico',
      image,
      tag: data.offer_id || 'ugrahak-offer',
      renotify: true,
      requireInteraction: true,
      data: {
        url: targetUrl,
        offer_id: data.offer_id,
        timestamp: Date.now(),
      },
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    // Text fallback
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('Ugrahak Store Offer', {
        body: text || 'You have received a new store offer!',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data: {
          url: '/',
        },
      })
    );
  }
});

// Notification Click Listener (Opens or focuses the exact offer page immediately)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const rawUrl = event.notification.data?.url || '/';
  // Resolve relative path to absolute URL
  const targetUrl = new URL(rawUrl, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 1. Look for an existing tab with the same URL or on the shop page
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }

      // 2. If an open tab from our origin exists, navigate and focus it
      for (const client of clientList) {
        if ('navigate' in client && 'focus' in client) {
          client.focus();
          return client.navigate(targetUrl);
        }
      }

      // 3. Otherwise, open a new window directly with the offer URL
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
