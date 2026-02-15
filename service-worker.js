const CACHE_VERSION = 'v11';
const STATIC_CACHE = `uiasub-static-${CACHE_VERSION}`;
const HTML_CACHE = `uiasub-html-${CACHE_VERSION}`;
const RUNTIME_CACHE = `uiasub-runtime-${CACHE_VERSION}`;
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/css/custom.css',
  '/css/header.css',
  '/js/header.js'
];
const PRECACHE_URL_SET = new Set(PRECACHE_URLS.map((url) => new URL(url, self.location.href).href));

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    await cache.addAll(PRECACHE_URLS);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    if (self.registration.navigationPreload) {
      await self.registration.navigationPreload.enable();
    }

    const keep = new Set([STATIC_CACHE, HTML_CACHE, RUNTIME_CACHE]);
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Simple fetch handler: navigation requests -> network-first, others -> cache-first
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only handle same-origin requests - let external resources (analytics, CDNs, etc.) pass through
  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.method !== 'GET') return;

  const isNavigation = request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html');

  if (isNavigation) {
    event.respondWith((async () => {
      const cache = await caches.open(HTML_CACHE);
      try {
        const preload = await event.preloadResponse;
        if (preload) {
          cache.put(request, preload.clone());
          return preload;
        }

        const response = await fetch(request);
        cache.put(request, response.clone());
        return response;
      } catch {
        const cached = await cache.match(request);
        if (cached) return cached;
        return caches.match(new URL('./offline.html', self.registration.scope));
      }
    })());
    return;
  }

  if (PRECACHE_URL_SET.has(request.url)) {
    event.respondWith((async () => {
      const cache = await caches.open(STATIC_CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      cache.put(request, response.clone());
      return response;
    })());
    return;
  }

  const isAsset = ['style', 'script', 'image', 'font'].includes(request.destination);
  if (isAsset) {
    event.respondWith((async () => {
      const cache = await caches.open(RUNTIME_CACHE);
      const cached = await cache.match(request);
      const fetchPromise = fetch(request).then((response) => {
        cache.put(request, response.clone());
        return response;
      });
      return cached || fetchPromise;
    })());
    return;
  }

  // Other same-origin GET requests: network-first with cache fallback
  event.respondWith((async () => {
    const cache = await caches.open(RUNTIME_CACHE);
    try {
      const response = await fetch(request);
      cache.put(request, response.clone());
      return response;
    } catch {
      const cached = await cache.match(request);
      if (cached) return cached;
      return Response.error();
    }
  })());
});
