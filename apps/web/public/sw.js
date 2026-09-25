const CACHE_NAME = "voeq-v1";
self.addEventListener("install", (e) => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("push", (e) => {
  const data = e.data ? e.data.json() : {};
  const title = data.title || "Voeq";
  const body = data.body || "You have a new notification";
  const url = data.url || "/";
  e.waitUntil(self.registration.showNotification(title, { body, icon: "/favicon-192x192.png", data: { url } }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data?.url || "/";
  e.waitUntil(self.clients.openWindow(url));
});
