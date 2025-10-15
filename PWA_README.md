# PWA setup for UiASub

## Files added/updated

- `manifest.webmanifest` — app manifest with icons
- `service-worker.js` — simple precache + navigation fallback
- `offline.html` — offline fallback page
- `header.html`, `index.html` — manifest link and SW registration added

## Quick local test

1. From the repo root run the local static server:

```bash
python3 -m http.server 8000
```

2. Open the local site in Chrome (for example: [http://localhost:8000](http://localhost:8000)). Open DevTools → Application → Manifest to inspect the manifest and icons.

3. In DevTools → Application → Service Workers, check that the service worker is registered.

4. To test offline: in DevTools → Network, set 'Offline' and reload — the `offline.html` fallback should be served for navigation requests.

## Next steps

- Add properly sized icons in `/images/icons/` (I can generate 192/256/512 sizes if you want).
- Improve caching strategy with Workbox or PWABuilder for production builds.
- Run a Lighthouse audit and iterate on PWA score.
