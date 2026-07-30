// SLMS push service worker. Listens for 'push' and shows the status alert.

// Take control as soon as an updated worker is installed (so changes here apply
// after a single page reload instead of waiting for all tabs to close).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "SLMS", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "SLMS Peringatan";

  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "Kondisi kandang perlu diperiksa",
      tag: "slms-status",
      renotify: true, // re-alert even when replacing a same-tag notification
      requireInteraction: true, // stay until the user dismisses it
      vibrate: [200, 100, 200],
      data: { url: "/dashboard" },
    }),
  );
});

// Focus/open the app when the notification is clicked.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const c of clients) {
        if ("focus" in c) return c.focus();
      }
      return self.clients.openWindow("/dashboard");
    }),
  );
});
