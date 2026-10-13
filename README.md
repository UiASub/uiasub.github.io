# Hosting UiASub official static website

Read the [Wiki](https://wiki.uiasub.no/website/) for more information

The service worker revalidates same-origin pages, images, scripts, styles and data
with the server before using cached content. Cached copies remain available when
offline. Updating files at their existing paths does not require a cache-version
bump; bump `CACHE_VERSION` in `service-worker.js` when the cache policy changes.
Existing visitors receive a changed worker while browsing; a page already rendered
by the previous worker may need another navigation before showing fresh content.

Run the cache regression checks with `node --test tests/service-worker.test.cjs`.
