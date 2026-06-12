// Service Worker for SPLIT — DIVISOR DE CONTAS PWA installability.
const CACHE_NAME = 'split-v4';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through fetch handler to support offline status and satisfy Chromium's PWA install criteria.
  // This allows the browser to load direct assets fresh from the server by default.
  event.respondWith(
    fetch(event.request).catch(async (err) => {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }
      throw err;
    })
  );
});
