const CACHE_NAME = 'uiasub-static-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/header.html',
  '/footer.html',
  '/css/bootstrap.min.css',
  '/css/custom.css',
  '/offline.html',
  '/images/uiasub/Icon.png',
  '/images/uiasub/Icon2x.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Simple fetch handler: navigation requests -> network-first, others -> cache-first
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.mode === 'navigate' || (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'))) {
    event.respondWith(
        fetch(request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return res;
        }).catch(() => caches.match(request).then((r) => r || caches.match('/offline.html')))
    );
    return;
  }

  // For other requests, try cache first
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
