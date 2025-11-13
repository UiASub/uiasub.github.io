// Use Bootstrap's Collapse API to toggle members reliably
(function(){
  'use strict';

  function setupCollapseToggle(opts) {
    var btn = document.getElementById(opts.btnId);
    var collapseEl = document.getElementById(opts.collapseId);
    if (!btn || !collapseEl) return;
    if (!window.bootstrap || !bootstrap.Collapse) {
      console.warn('Bootstrap Collapse API not available for', opts.collapseId);
      return;
    }

    try {
      var bsCollapse = new bootstrap.Collapse(collapseEl, { toggle: false });

      function syncState(isShown) {
        btn.setAttribute('aria-expanded', isShown ? 'true' : 'false');
        var textEl = btn.querySelector('.button-text');
        if (textEl && opts.labels) textEl.textContent = isShown ? opts.labels.expanded : opts.labels.collapsed;
      }

      // Initialize based on DOM
      syncState(collapseEl.classList.contains('show'));

      btn.addEventListener('click', function (e) {
        e && e.preventDefault();
        var isShown = collapseEl.classList.contains('show');
        if (isShown) {
          bsCollapse.hide();
          syncState(false);
        } else {
          bsCollapse.show();
          // respect reduced-motion when scrolling into view
          try {
            var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (prefersReduced) collapseEl.scrollIntoView({ behavior: 'auto', block: 'start' });
            else collapseEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } catch (err) {}
          syncState(true);
        }
      });

      collapseEl.addEventListener('shown.bs.collapse', function () { syncState(true); });
      collapseEl.addEventListener('hidden.bs.collapse', function () { syncState(false); });
    } catch (err) {
      console.error('Failed to initialize collapse toggle for', opts.collapseId, err);
    }
  }

  function init() {
    // Locale detection: check path prefix (English pages are under /en/)
    var isEnglish = location.pathname && location.pathname.startsWith('/en');
    var LABELS = isEnglish ? { collapsed: 'Members', expanded: 'Hide Members' } : { collapsed: 'Medlemmer', expanded: 'Skjul' };

    setupCollapseToggle({ btnId: 'members-toggle', collapseId: 'members-collapse', labels: LABELS });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function onReady() { init(); }, { once: true });
  } else {
    init();
  }
})();