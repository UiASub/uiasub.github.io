# UiASub static site - quick wiki

This repository is a small static website (no build step) with a few client-side features and a PWA service worker. Use this wiki as a short, actionable reference for contributors and automated agents.

## Big-picture architecture

- Static HTML pages at the repository root and in `en/` for English-localized copies. Each page is standalone and may include the shared fragments `header.html` and `footer.html`.
- Client-side behavior is implemented in `js/` (vanilla JS). Notable examples:
  - `js/news-render.js` - dynamically fetches `/data/posts.json` and renders a news grid.
  - `js/storage.js` - upload / file listing UI that proxies actions through a Supabase Edge Function.
- Progressive Web App:
  - `service-worker.js` precaches a small set of assets and implements a network-first strategy for navigations with `/offline.html` fallback.
  - `manifest.webmanifest` provides PWA metadata.

## Key files and directories

- `index.html`, `pages/*.html`, `en/index.html` - primary entry points.
- `header.html`, `footer.html` - shared fragments used across pages (root and `en/` copies).
- `js/` - client logic. See `news-render.js` and `storage.js` for canonical patterns.
- `css/` - page-scoped styles (prefer editing the matching page CSS file).
- `data/posts.json` - news feed consumed by `js/news-render.js` (cache: no-store).
- `service-worker.js`, `offline.html`, `manifest.webmanifest` - PWA/offline behavior.

## Local development / preview

There is no build step - the site is static.
Preview locally with a simple HTTP server (service workers require a secure origin or localhost):

```bash
python3 -m http.server 8000
# Then open http://localhost:8000 in your browser
```

## News content (`pages/news.html`)

## Uploads / Storage pattern (Edge Function)

- `js/storage.js` does not call Supabase directly from the browser with service-role keys. Instead it proxies all storage operations through a Supabase Edge Function endpoint.
- Client actions use a small action-based contract. Examples:

  - `upload_file` - used by the Uppy XHR upload (multipart/form-data) proxied to Supabase.

  - `list_files` - returns a file list.

  - `sign_file` - returns a signed URL for download/share.

  - `download_file`, `delete_file` - server-side proxied actions.
- Important: `js/storage.js` is defensive about response shapes. When parsing an Edge Function response prefer these shapes (in order): `payload.files`, `payload.data`, `payload.rows`, or the raw payload array. If you change server responses, keep one of these shapes or update the parsing in `js/storage.js`.

### Authentication

- `js/storage.js` reads an access token from the URL fragment (after OAuth redirect) or from `localStorage` (`access_token`). If missing, the UI redirects to `/pages/login.html`.
- All Edge Function calls include `Authorization: Bearer <token>` headers - preserve this when modifying or adding storage-related client calls.

## Service Worker / PWA notes

- `service-worker.js` sets `CACHE_NAME = 'uiasub-static-v2'` and a `PRECACHE_URLS` list. If you change the list or add files that must be cached, bump the cache name to force activation and cleanup of old caches.
- Fetch strategy: navigation requests use network-first (with `/offline.html` fallback); other assets use cache-first.

## Conventions and small patterns

- Fragments: edit `header.html` / `footer.html` (and `en/` copies) to change layout/site-wide links.
- CSS: files are per-page where possible (e.g., `css/contact.css`). Prefer adding or editing per-page CSS rather than changing `custom.css` for small visual changes.
- JS: many files are IIFEs (immediately-invoked) or small modules. Some remote ESM imports are used (see `js/storage.js` importing Uppy from a CDN). The project expects browser-friendly files - avoid adding a bundler unless you update `index.html` imports accordingly.

## Debugging tips

- Use browser DevTools Console for client-side errors.
- To debug service worker caching: unregister the service worker in DevTools > Application, then hard reload.
- For storage issues, inspect network requests to the Edge Function and confirm the request payload includes the `action` and correct Authorization header.
