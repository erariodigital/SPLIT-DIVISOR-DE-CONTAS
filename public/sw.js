// Service Worker for SPLIT — DIVISOR DE CONTAS PWA installability.
const CACHE_NAME = 'split-v5';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json?v=3',
  './logo.png?v=3',
  './logo_180.png?v=3',
  './logo_192.png?v=3',
  './logo_512.png?v=3'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('Pre-cache warning (some assets failed to load offline):', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Clear older caches to ensure updated icons get fetched immediately
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Clearing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Serve from network first, fall back to cache when offline
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
