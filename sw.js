/**
 * Students Parliament Nigeria - Progressive Web App Service Worker
 * Version: 2026.10.10-v5
 */

const CACHE_NAME = 'spn-pwa-v5';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/generator.html',
  '/css/style.css',
  '/css/paywall.css',
  '/css/portal.css',
  '/css/modal-alert.css',
  '/css/pwa.css',
  '/js/modal-alert.js',
  '/js/cloud-db.js',
  '/js/app.js',
  '/js/portal.js',
  '/js/pwa.js',
  '/js/templates-data.js',
  '/manifest.webmanifest',
  '/favicon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/image/image-3.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache non-critical failure:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET requests and external API/database calls (e.g. Supabase, Paystack, Google Fonts)
  if (req.method !== 'GET' || url.origin !== location.origin) {
    return;
  }

  // Network-first for navigation requests (HTML pages) so user always gets latest updates
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkRes;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('/index.html')))
    );
    return;
  }

  // Stale-while-revalidate for static assets
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkRes;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
