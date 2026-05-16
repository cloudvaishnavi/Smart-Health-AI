const CACHE_NAME = 'smart-health-ai-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/auth.html',
  '/dashboard.html',
  '/records.html',
  '/family.html',
  '/emergency-card.html',
  '/ai-insights.html',
  '/public-emergency.html',
  '/css/style.css',
  '/css/components.css',
  '/css/auth.css',
  '/css/ai.css',
  '/js/main.js',
  '/js/auth.js',
  '/js/offline-sync.js',
  '/js/voice-engine.js',
  '/js/qr-logic.js',
  '/js/ml-predict.js',
  '/js/ai-handler.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only intercept GET requests
  if (event.request.method !== 'GET') return;
  // Ignore external API requests (like Supabase or CDNs) for now to ensure fresh data
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).then((fetchResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, fetchResponse.clone());
          return fetchResponse;
        });
      });
    })
  );
});
