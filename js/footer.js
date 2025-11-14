// footer.js - Centralized footer loader with locale detection
(function() {
  'use strict';

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
        footerContainer.innerHTML = data;
      }
    })
    .catch(error => {
      console.error('Error loading footer:', error);
      const footerContainer = document.getElementById('footer');
      if (footerContainer) {
        footerContainer.innerHTML = '<footer class="text-center py-4"><p>&copy; 2025 UiASub</p></footer>';
      }
    });
})();