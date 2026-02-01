(function () {
  'use strict';

  // Configuration
  const REPOS = ['Topside', 'K2-Zephyr', 'joystick-arduino', 'wiki.uiasub.no', 'uiasub.github.io'];
  const API_BASE = 'https://api.github.com/repos/UiASub/';
  const CONTAINER_SELECTOR = '#github-projects-container';
  const CACHE_KEY = 'github_repos_cache';
  const CACHE_TTL = 600000; // 10 minutes in milliseconds
  const LOCK_KEY = 'github_repos_lock';
  const LOCK_TTL = 60000; // 60 seconds lock freshness for cross-tab coord
  const CHANNEL_NAME = 'github_repos_channel';

  /**
   * localStorage cache helpers
   */
  function getCachedData() {
    try {
      if (!window.localStorage) return null;
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.timestamp || !parsed.data || !parsed.meta) return null;
      // validate metadata to ensure cache matches current REPOS/API_BASE
      const meta = parsed.meta || {};
      try {
        const sameRepos = Array.isArray(meta.repos) && meta.repos.length === REPOS.length && meta.repos.every((v, i) => v === REPOS[i]);
        const sameApi = meta.api_base === API_BASE;
        if (!sameRepos || !sameApi) {
          return null; // metadata mismatch - treat as invalid
        }
      } catch (e) {
        return null;
      }
      const age = Date.now() - parsed.timestamp;
      if (age < CACHE_TTL) {
        return parsed.data; // data is expected to be an object keyed by repo name (or null placeholders)
      }
      // expired
      return null;
    } catch (err) {
      console.warn('github-projects: cache read failed', err);
      return null;
    }
  }

  function setCachedData(data) {
    try {
      if (!window.localStorage) return false;
      // Data should be an object keyed by repo name. If caller passed an array of repo objects,
      // normalize into an object preserving REPOS order and null placeholders for failures.
      let payloadData = {};
      if (Array.isArray(data)) {
        // map by name
        const byName = {};
        data.forEach(d => { if (d && d.name) byName[d.name] = d; });
        REPOS.forEach(name => { payloadData[name] = byName[name] || null; });
      } else if (data && typeof data === 'object') {
        // assume already keyed by repo name
        REPOS.forEach(name => { payloadData[name] = data[name] || null; });
      } else {
        // fallback: fill with nulls
        REPOS.forEach(name => { payloadData[name] = null; });
      }

      const payload = { timestamp: Date.now(), data: payloadData, meta: { repos: REPOS.slice(), api_base: API_BASE } };
      localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
      return true;
    } catch (err) {
      console.warn('github-projects: cache write failed', err);
      return false;
    }
  }

  function clearCache() {
    try {
      if (window.localStorage) localStorage.removeItem(CACHE_KEY);
    } catch (err) {
      console.warn('github-projects: cache clear failed', err);
    }
  }

  // Helpers
  function escapeHtml(s) {
    if (!s) return '';
    return s.replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  // Locale detection: check path prefix (English pages are under /en/)
  const lang = location.pathname && location.pathname.startsWith('/en') ? 'en' : 'no';

  const STRINGS = {
    en: {
      today: 'Today',
      yesterday: 'Yesterday',
  daysAgo: (n) => `${n} days ago`,
  weeksAgo: (n) => `${Math.floor(n)} weeks ago`,
  monthsAgo: (n) => `${Math.floor(n)} months ago`,
  yearsAgo: (n) => `${Math.floor(n)} years ago`,
      errors: {
        load_failed: 'Could not load data',
        see_repo: 'See repo on GitHub',
        could_not_load_projects: 'Could not load GitHub projects right now.'
      },
      no_description: 'No description',
      updated: 'Updated'
    },
    no: {
      today: 'I dag',
      yesterday: 'I går',
      daysAgo: (n) => `${n} dager siden`,
      weeksAgo: (n) => `${Math.floor(n)} uker siden`,
      monthsAgo: (n) => `${Math.floor(n)} måneder siden`,
      yearsAgo: (n) => `${Math.floor(n)} år siden`,
      errors: {
        load_failed: 'Kunne ikke laste data',
        see_repo: 'Se repo på GitHub',
        could_not_load_projects: 'Kunne ikke laste GitHub-prosjekter akkurat nå.'
      },
      no_description: 'Ingen beskrivelse',
      updated: 'Oppdatert'
    }
  };

  const locale = STRINGS[lang && lang.startsWith('en') ? 'en' : 'no'];

  function formatRelativeTime(dateString) {
    if (!dateString) return '';
    const then = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - then) / 1000); // seconds

    const days = Math.floor(diff / 86400);
    if (days === 0) return locale.today;
    if (days === 1) return locale.yesterday;
    if (days < 7) return locale.daysAgo(days);
    if (days < 30) return locale.weeksAgo(days / 7);
    if (days < 365) return locale.monthsAgo(days / 30);
    return locale.yearsAgo(days / 365);
  }

  function getLanguageColor(language) {
    if (!language) return '#8b949e';
    const map = {
      'JavaScript': '#f1e05a',
      'TypeScript': '#3178c6',
      'Python': '#3572A5',
      'C++': '#f34b7d',
      'C': '#555555',
      'HTML': '#e34c26',
      'CSS': '#563d7c',
      'Rust': '#dea584'
    };
    return map[language] || '#8b949e';
  }

  // Create a loading skeleton card
  function createLoadingCard() {
    return `
      <div class="col-12 col-md-6 col-lg-4">
        <div class="sponsor-logo-card p-3 h-100" aria-hidden="true">
          <div style="height:18px;width:60%;background:linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%);background-size:200% 100%;animation: shimmer 1.2s infinite; margin-bottom:12px;border-radius:4px;"></div>
          <div style="height:12px;width:100%;background:rgba(255,255,255,0.02);margin-bottom:8px;border-radius:3px;"></div>
          <div style="height:12px;width:90%;background:rgba(255,255,255,0.02);margin-bottom:8px;border-radius:3px;"></div>
          <div style="height:12px;width:40%;background:rgba(255,255,255,0.02);margin-top:18px;border-radius:3px;"></div>
        </div>
      </div>
    `;
  }

  function createErrorCard(name, detail) {
    const repoUrl = `https://github.com/UiASub/${encodeURIComponent(name)}`;
    const detailHtml = detail ? `<div class="text-white-50 small mt-2">${escapeHtml(String(detail))}</div>` : '';
    return `
      <div class="col-12 col-md-6 col-lg-4">
        <div class="sponsor-logo-card p-3 h-100">
          <h3 class="h5 text-white">${escapeHtml(name)}</h3>
          <p class="text-white">${locale.errors.load_failed}</p>
          ${detailHtml}
          <div class="mt-2"><a href="${repoUrl}" target="_blank" rel="noopener noreferrer" class="small text-white">${locale.errors.see_repo}</a></div>
        </div>
      </div>
    `;
  }

  function createRepoCard(repo) {
    const name = escapeHtml(repo.name || 'unknown');
  const rawDesc = repo.description || '';
  const MAX_DESC = 100;
  const desc = rawDesc.length > MAX_DESC ? escapeHtml(rawDesc.slice(0, MAX_DESC)) + '…' : escapeHtml(rawDesc);
    const stars = repo.stargazers_count || 0;
    const forks = repo.forks_count || 0;
    const updated = formatRelativeTime(repo.updated_at);
    const language = repo.language || '';
    const langColor = getLanguageColor(language);
    const url = repo.html_url || '#';

    const textColor = '#000';
    // simple brightness check for badge text color (dark backgrounds -> white)
    const badgeText = (langColor === '#676e76ff' || langColor === '#f1e05a' || langColor === '#e34c26') ? '#000' : '#fff';

    return `
      <div class="col-12 col-md-6 col-lg-4">
        <a class="text-decoration-none" href="${url}" target="_blank" rel="noopener noreferrer">
          <div class="sponsor-logo-card p-3 h-100" style="cursor:pointer; align-items:stretch;">
            <div class="w-100">
              <h3 class="h5 mb-2 text-white">${name}</h3>
              <p class="text-white mb-3">${desc || `<span class="text-white">${locale.no_description}</span>`}</p>

              <div class="d-flex justify-content-between align-items-center mb-2 w-100">
                <div class="d-flex align-items-center" aria-hidden="true">
                  <span style="margin-right:6px;">⭐</span><span class="text-white">${stars}</span>
                  <span style="margin:0 8px;">•</span>
                  <span style="margin-right:6px;">🍴</span><span class="text-white">${forks}</span>
                </div>
                ${language ? `<span class="badge rounded-pill px-2 py-1" style="background:${langColor};color:${badgeText};">${escapeHtml(language)}</span>` : ''}
              </div>

              <div class="text-white small">${escapeHtml(locale.updated)} ${escapeHtml(updated)}</div>
            </div>
          </div>
        </a>
      </div>
    `;
  }

  // Main loader
  async function fetchAndRenderRepos() {
    const container = document.querySelector(CONTAINER_SELECTOR);
    const spinner = document.getElementById('github-loading-spinner');
    if (!container) return;
    // Try cache first (cache now expected to be an object keyed by repo name)
    const cached = getCachedData();
    if (cached && typeof cached === 'object') {
      try {
        // Ensure we render one card per entry in REPOS to preserve order and error placeholders
        const cards = REPOS.map(name => {
          const repoObj = cached[name];
          if (repoObj) return createRepoCard(repoObj);
          return createErrorCard(name);
        });
        container.innerHTML = cards.join('');
        container.setAttribute('aria-busy', 'false');
        if (spinner) spinner.style.display = 'none';
        console.log('github-projects: Using cached GitHub data (ordered)');
        return;
      } catch (err) {
        console.warn('github-projects: failed to render cached data, falling back to fetch', err);
        // continue to fetch
      }
    }

    // Cross-tab coordination: try to acquire a fetch lock to avoid multiple tabs fetching simultaneously
    const channel = (typeof window !== 'undefined' && 'BroadcastChannel' in window) ? new BroadcastChannel(CHANNEL_NAME) : null;
    async function acquireLockOrWait() {
      try {
        if (!window.localStorage) return true; // cannot coordinate, proceed
        const now = Date.now();
        const raw = localStorage.getItem(LOCK_KEY);
        const lock = raw ? JSON.parse(raw) : null;
        if (!lock || (now - lock.timestamp) > LOCK_TTL) {
          // attempt to acquire
          const token = { timestamp: now };
          localStorage.setItem(LOCK_KEY, JSON.stringify(token));
          // verify
          const verifyRaw = localStorage.getItem(LOCK_KEY);
          const verify = verifyRaw ? JSON.parse(verifyRaw) : null;
          if (verify && verify.timestamp === now) {
            return true; // acquired
          }
        }
        // Another tab holds a fresh lock — wait for cache to appear or for lock to expire
        const maxWait = 5000; // ms
        const start = Date.now();
        let backoff = 200;
        return await new Promise(resolve => {
          let resolved = false;
          function checkCache() {
            try {
              const c = getCachedData();
              if (c) {
                resolved = true;
                resolve(false); // don't fetch here; cache is ready and other tab did fetch
                return;
              }
            } catch (e) {
              // ignore
            }
            if (Date.now() - start > maxWait) {
              // timeout, allow this tab to proceed to fetch
              if (!resolved) { resolved = true; resolve(true); }
              return;
            }
            // continue waiting with backoff
            setTimeout(checkCache, backoff);
            backoff = Math.min(1000, backoff * 1.5);
          }

          // listen to BroadcastChannel if available to stop early
          if (channel) {
            channel.addEventListener('message', function onMsg(ev) {
              if (ev && ev.data === 'cache-ready') {
                if (!resolved) { resolved = true; resolve(false); }
                channel.removeEventListener('message', onMsg);
              }
            });
          }

          // start polling
          checkCache();
        });
      } catch (err) {
        // on any error, allow fetch
        return true;
      }
    }

    const shouldFetch = await acquireLockOrWait();
    if (!shouldFetch) {
      // another tab fetched and cache is available; try to read cache and render
      const cached2 = getCachedData();
      if (cached2 && typeof cached2 === 'object') {
        const cards = REPOS.map(name => cached2[name] ? createRepoCard(cached2[name]) : createErrorCard(name));
        container.innerHTML = cards.join('');
        container.setAttribute('aria-busy', 'false');
        if (spinner) spinner.style.display = 'none';
        console.log('github-projects: Rendered cache populated by another tab');
        return;
      }
      // else fall through and attempt to fetch (lock likely expired)
    }

    // show loading skeletons — hide spinner while skeletons render to avoid double indicators
    if (spinner) spinner.style.display = 'none';
    container.innerHTML = Array.from({ length: REPOS.length }).map(() => createLoadingCard()).join('');
    container.setAttribute('aria-busy', 'true');

    const fetches = REPOS.map(name => fetch(API_BASE + encodeURIComponent(name), { headers: { Accept: 'application/vnd.github.v3+json' } }).then(async res => {
      if (!res.ok) throw new Error(`HTTP ${res.message || res.status}`);
      return res.json();
    }));

    try {
      const results = await Promise.allSettled(fetches);
      // collect successful repo objects for caching
      const successful = results.filter(r => r.status === 'fulfilled').map(r => r.value);

      // Normalize results into an object keyed by repo name, preserving REPOS order and nulls
      const normalized = {};
      REPOS.forEach(name => { normalized[name] = null; });
      successful.forEach(r => { if (r && r.name) normalized[r.name] = r; });

      // Set cache only if at least one successful result exists
      if (Object.values(normalized).some(v => v !== null)) {
        try {
          setCachedData(normalized);
          try { if (channel) channel.postMessage('cache-ready'); } catch (e) {}
          console.log('github-projects: Cached GitHub data for 10 minutes');
        } catch (err) {
          console.warn('github-projects: failed to set cache', err);
        }
      }


      const cards = REPOS.map((name, i) => {
        const r = results[i];
        if (r && r.status === 'fulfilled') {
          return createRepoCard(r.value);
        }
        // create a slightly more informative error card with the failure reason (HTTP status or error message)
        const reason = (r && r.status === 'rejected' && r.reason) ? (r.reason.message || String(r.reason)) : null;
        console.warn('Failed to fetch', name, reason);
        return createErrorCard(name, reason);
      });

      // release cross-tab lock if present
      try { if (window.localStorage) localStorage.removeItem(LOCK_KEY); } catch (e) {}
      container.innerHTML = cards.join('');
      container.setAttribute('aria-busy', 'false');
      if (spinner) spinner.style.display = 'none';
    } catch (err) {
      console.error('Critical error loading repos', err);
      try { if (window.localStorage) localStorage.removeItem(LOCK_KEY); } catch (e) {}
      container.innerHTML = `<div class="col-12 text-center text-white">${locale.errors.could_not_load_projects}</div>`;
      container.setAttribute('aria-busy', 'false');
      if (spinner) spinner.style.display = 'none';
    }
  }

  // Add shimmer keyframes to document (only if not present)
  function injectShimmerStyles() {
    if (document.getElementById('github-skeleton-styles')) return;
    const style = document.createElement('style');
    style.id = 'github-skeleton-styles';
    style.textContent = `@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`;
    document.head.appendChild(style);
  }

  document.addEventListener('DOMContentLoaded', function () {
    injectShimmerStyles();
    fetchAndRenderRepos();
  });

  // Expose manual cache clear for development/debugging
  try {
    window.clearGitHubCache = clearCache;
  } catch (err) {
    // ignore
  }

  // When the document becomes visible again, invalidate cache if it's older than TTL
  if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    document.addEventListener('visibilitychange', function () {
      try {
        if (!document.hidden) {
          // if cache exists but is older than TTL (i.e. getCachedData returns null), force a fresh fetch
          const cached = (function () {
            try {
              const raw = localStorage.getItem(CACHE_KEY);
              if (!raw) return null;
              const parsed = JSON.parse(raw);
              return parsed;
            } catch (e) {
              return null;
            }
          })();

          if (cached && cached.timestamp && (Date.now() - cached.timestamp) > CACHE_TTL) {
            // clear and refetch
            clearCache();
            fetchAndRenderRepos();
          }
        }
      } catch (err) {
        // non-fatal
      }
    });
  }

  // Clean up BroadcastChannel when the page unloads
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const _ch = new BroadcastChannel(CHANNEL_NAME);
      window.addEventListener('unload', function () { try { _ch.close(); } catch (e) {} });
      _ch.close();
    }
  } catch (e) {}

})();
