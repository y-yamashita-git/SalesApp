self.addEventListener("install", e => {
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  clients.claim();
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
});
