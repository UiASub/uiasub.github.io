(function () {
  'use strict';

  // Shared small helper to safely initialize a Bootstrap Collapse-driven toggle.
  function setupCollapseToggle(opts) {
    var btn = document.getElementById(opts.btnId);
    var collapseEl = document.getElementById(opts.collapseId);

    if (!btn || !collapseEl) return; // nothing to do
    if (!window.bootstrap || !bootstrap.Collapse) {
      console.warn('Bootstrap Collapse API not available for', opts.collapseId);
      return;
    }

    try {
      var bsCollapse = new bootstrap.Collapse(collapseEl, { toggle: false });

      // Sync helper: set aria-expanded and optional .button-text
      function syncState(isShown) {
        btn.setAttribute('aria-expanded', isShown ? 'true' : 'false');
        var textEl = btn.querySelector('.button-text');
        if (textEl && opts.labels) textEl.textContent = isShown ? opts.labels.expanded : opts.labels.collapsed;
      }

      // Initialize state based on current DOM (could be pre-opened)
      syncState(collapseEl.classList.contains('show'));

      // Click toggles the collapse
      btn.addEventListener('click', function (e) {
        e.preventDefault && e.preventDefault();
        var isShown = collapseEl.classList.contains('show');
        if (isShown) {
          bsCollapse.hide();
          // sync will be handled by hidden event, but set immediately for responsiveness
          syncState(false);
        } else {
          bsCollapse.show();
          // scroll into view, but respect reduced-motion
          try {
            var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (prefersReduced) {
              collapseEl.scrollIntoView({ behavior: 'auto', block: 'start' });
            } else {
              collapseEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          } catch (err) {
            // ignore if unsupported
          }
          // sync will be handled by shown event, but set immediately for responsiveness
          syncState(true);
        }
      });

      // Keep state in sync if collapse is toggled externally
      collapseEl.addEventListener('shown.bs.collapse', function () { syncState(true); });
      collapseEl.addEventListener('hidden.bs.collapse', function () { syncState(false); });
    } catch (err) {
      console.error('Failed to initialize collapse toggle for', opts.collapseId, err);
    }
  }

  // Init function with safe DOMContentLoaded guard
  function init() {
    // locale detection: prefer <html lang="...">, fallback to path prefix
    var docLang = (document.documentElement && document.documentElement.lang) || '';
    var isEnglish = /^en($|-)/i.test(docLang) || (location.pathname && location.pathname.startsWith('/en'));
    var LABELS = isEnglish ? { collapsed: 'Detailed Specifications', expanded: 'Hide Details' } : { collapsed: 'Spesifikasjoner', expanded: 'Skjul Detaljer' };

    setupCollapseToggle({ btnId: 'specs-toggle', collapseId: 'specs-collapse', labels: LABELS });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function onReady() { init(); }, { once: true });
  } else {
    init();
  }

})();
