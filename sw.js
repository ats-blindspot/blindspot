// Blindspot Service Worker (Clean - No Notifications)
const CACHE_NAME = 'blindspot-v100'; // <--- This forces the browser to clear old cache

const urlsToCache = [
  '/',
  '/index.html'
];

// Install
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch((err) => {
        console.log('[SW] Cache add failed:', err);
      });
    })
  );
});

// Activate
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch (network first, cache fallback)
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  // Skip supabase API calls
  if (event.request.url.includes('supabase.co')) return;
  
  event.respondWith(
    fetch(event.request)
    .then((response) => {
      // Cache successful responses
      if (response && response.status === 200) {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
      }
      return response;
    })
    .catch(() => {
      // Network failed, try cache
      return caches.match(event.request);
    })
  );
});