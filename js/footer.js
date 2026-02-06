// footer.js - Centralized footer loader with locale detection
(function () {
  'use strict';

  function parseHtmlFragment(html) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const bodyHtml = doc && doc.body ? doc.body.innerHTML : html;
      const headLinks = doc && doc.head ? Array.from(doc.head.querySelectorAll('link[rel="stylesheet"]')) : [];
      return { bodyHtml, headLinks };
    } catch (e) {
      return { bodyHtml: html, headLinks: [] };
    }
  }

  function ensureStyles(links) {
    if (!links || !links.length) return;
    links.forEach((link) => {
      const href = link.getAttribute('href');
      if (!href) return;
      if (document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) return;
      const newLink = document.createElement('link');
      newLink.rel = 'stylesheet';
      newLink.href = href;
      document.head.appendChild(newLink);
    });
  }

  function loadFooter() {
    // Detect locale from URL path
    const isEnglish = location.pathname.startsWith('/en');
    const footerPath = isEnglish ? '/en/footer.html' : '/footer.html';

    fetch(footerPath)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Footer fetch failed: ${response.status}`);
        }
        return response.text();
      })
      .then(data => {
        const footerContainer = document.getElementById('footer');
        if (footerContainer) {
          const parsed = parseHtmlFragment(data);
          footerContainer.innerHTML = parsed.bodyHtml;
          ensureStyles(parsed.headLinks);
        }
      })
      .catch(error => {
        console.error('Error loading footer:', error);
        const footerContainer = document.getElementById('footer');
        if (footerContainer) {
          footerContainer.innerHTML = '<footer class="text-center py-4"><p>&copy; 2025 UiASub</p></footer>';
        }
      });
  }

  // Wait for DOM to be ready before loading footer
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadFooter);
  } else {
    // DOM is already ready
    loadFooter();
  }
})();
