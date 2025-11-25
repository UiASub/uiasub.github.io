const CACHE_NAME = 'uiasub-static-v8';
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './header.html',
  './footer.html',
  './css/contact.css',
  './css/custom.css',
  './offline.html',
  './images/uiasub/Icon.png',
  './images/uiasub/Icon2x.png',
  './images/uiasub/Icon1.png'
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
  const url = new URL(request.url);

  // Only handle same-origin requests - let external resources (analytics, CDNs, etc.) pass through
  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === 'navigate' || (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'))) {
    event.respondWith(
      fetch(request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return res;
      }).catch(() => caches.match(request).then((r) => r || caches.match(new URL('./offline.html', self.registration.scope))))
    );
    return;
  }

  // For other same-origin requests, try cache first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).catch(() => {
        // Silently fail for missing resources when offline
        return new Response('', { status: 408, statusText: 'Request Timeout' });
      });
    })
  );
});
