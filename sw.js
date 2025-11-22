// sw.js – Offline-first PWA for Pukekohe High School Materials Technology
// Version: 2025-v8 (updated for full offline + view-after-deadline support)

const CACHE_NAME = 'phs-materials-v900'; // bump this number any time you update files

const CORE_ASSETS = [
  '/',                              // important for offline root
  '/index.html',
  '/script.js',
  '/questions.json',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/crest_shield.png',              // school crest – essential for header
  // External libraries (cached aggressively for offline use)
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

// Optional: pre-cache common question images (add more if you want)
// Example:
// '/images/woodq1.jpg',
// '/images/plywood.jpg',

// INSTALL – cache all core files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching core assets...');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// ACTIVATE – clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// FETCH – serve from cache first, fallback to network, then cache new files
self.addEventListener('fetch', event => {
  // Only handle GET requests and http/https
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached version if exists
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise fetch from network
        return fetch(event.request).then(networkResponse => {
          // Cache successful responses (200) that are not chrome-extension etc.
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        }).catch(() => {
          // Offline fallback: show index.html for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
