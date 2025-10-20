
# UiASub Website

This repository contains the static website for UiASub (a GitHub Pages site). It's a vanilla HTML/CSS/JS site with small dynamic bits (header/footer injection and a simple login flow that uses an external Edge Function / Supabase). The site is meant to be served as static files (GitHub Pages or any static host).

## Quick preview

From the project root you can run a simple static server. Example using Python 3:

```bash
python3 -m http.server 8000
# Then open http://localhost:8000 in your browser
```

Or use any static server you prefer (live-server, http-server, etc.).

## Project structure (important files)

- `index.html`, `en/index.html` — top-level landing pages (Norwegian and English).
- `header.html`, `footer.html` — header/footer snippets used by pages.
- `js/header.js` — injects header into pages, controls language selection, hamburger menu, and login-link logic. It calls the configured `EDGE_FUNCTION_URL` to validate Discord roles when a token is present.
- `js/login.js` — OAuth redirect handler for Supabase/Discord. Expects an access token in the URL hash and stores it in `localStorage.access_token`.
- `js/storage.js` — small helper for local storage usage across the site.
- `css/` — stylesheets (Bootstrap, custom CSS, and theme files).
- `src/` and `en/` directories — localized pages and content (English under `en/`).

See the repository root for additional pages in `pages/` and `en/pages/`.

## Header & Footer injection pattern

All content pages should include a placeholder for the header and the footer injection snippet. Example pattern used across pages:

1. Add a header placeholder near the top of the page:

```html
<div id="header"></div>
<script src="/js/header.js"></script>
```

For English pages use `id="header-eng"` instead of `header` and the same `js/header.js` script. The header script will detect which to inject based on page language.

2. Add a footer placeholder near the bottom of the page (footer is fetched dynamically):

```html
<div id="footer"></div>
<script>
	fetch('/footer.html').then(r => r.text()).then(html => document.getElementById('footer').innerHTML = html);
</script>
```

Do not change the injection mechanism unless you update both `js/header.js` and `js/login.js` accordingly.

## Login / Edge Function notes

- The login flow is implemented with `js/login.js` and expects an OAuth provider (Discord via Supabase). After redirect it expects an access token inside the URL hash and writes `localStorage.access_token`.
- `js/header.js` will call the configured `EDGE_FUNCTION_URL` with the token (Bearer) to validate roles/permissions and update UI (login link text, admin links, etc.).
- The value `EDGE_FUNCTION_URL` is used in both `js/header.js` and `js/login.js` and should not be hard-coded into committed files for production. For local testing you can mock the Edge Function response or use a development endpoint that returns the same JSON shape.

Contract: the Edge Function should accept a bearer token and return a JSON object describing whether the user is allowed and which roles they have. A minimal successful response shape looks like:

```json
{ "ok": true, "roles": ["admin", "member"] }
```

If you need a local mock while developing, return `{ "ok": true }` i think.

## How to add a new page (localization)

- Create the HTML file under `pages/` or `en/pages/` as appropriate.
- Include the header placeholder and `js/header.js` script as shown above.
- Add content and, if necessary, classes from the existing CSS files.

For example, to add an English page `en/pages/events.html`:

1. Create `en/pages/events.html`.
2. Include `<div id="header-eng"></div><script src="/js/header.js"></script>` at the top.
3. Include the footer snippet at the bottom.

## Development tips

- Keep CDN versions (jQuery/Bootstrap/Tailwind) consistent with existing pages.
- Match the existing CSS class names to avoid breaking layouts (`.masthead`, `.navigation`, etc.).
- When changing login behavior, update both `js/header.js` and `js/login.js` to preserve storage and redirect logic.

## Contributing

1. Create a branch for your feature/fix (e.g., `feature/update-header`).
2. Make small, focused commits and push the branch.
3. Open a PR describing the change and any static-server preview steps.

Security note: Do not commit real tokens, API keys, or secrets into the repo. If you need to share test credentials, use environment-specific configuration or a secrets manager outside the repo.

## Deploying

This repo is suitable for GitHub Pages. Push to the branch configured for GitHub Pages in the repository settings (`main`) or follow new deployment flow.

If you use an automated CI to build/publish, ensure the CI serves the repository root and that any environment-only endpoints (Edge Function URLs) are set via environment variables or repo secrets.

## Files to inspect when changing header/login behavior

- `js/header.js` — header injection, menu, role checks.
- `js/login.js` — OAuth redirect handler.
- `header.html` / `footer.html` — markup for header/footer.

## Contact

If anything is unclear, open an issue in this repo or contact the maintainers via the project's usual channels.
