const CACHE_VERSION = 'v12';
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
    await cache.addAll(PRECACHE_URLS.map((url) => new Request(new URL(url, self.location.href), { cache: 'no-cache' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    if (self.registration.navigationPreload) {
      // Fetch explicitly below so navigations also revalidate the HTTP cache.
      await self.registration.navigationPreload.disable();
    }

    const keep = new Set([STATIC_CACHE, HTML_CACHE, RUNTIME_CACHE]);
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('uiasub-') && !keep.has(k)).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Check for updates on every visit; Cache Storage is only an offline fallback.
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only handle same-origin requests - let external resources (analytics, CDNs, etc.) pass through
  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.method !== 'GET' || request.headers.has('range')) return;

  const isNavigation = request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html');

  const cacheName = isNavigation ? HTML_CACHE
    : PRECACHE_URL_SET.has(request.url) ? STATIC_CACHE : RUNTIME_CACHE;

  // Conditional requests let unchanged files reuse their HTTP-cached body.
  const networkResponse = fetch(request, { cache: 'no-cache' });
  event.waitUntil(networkResponse.then(async (response) => {
    if (response.status === 200) {
      const copy = response.clone();
      const cache = await caches.open(cacheName);
      await cache.put(request, copy);
    }
  }).catch(() => {
    // A full or unavailable cache must not prevent an online response.
  }));

  event.respondWith(networkResponse.catch(async () => {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) return cached;
    if (isNavigation) {
      const fallback = await caches.match(new URL('/offline.html', self.registration.scope));
      if (fallback) return fallback;
    }
    return Response.error();
  }));
});
