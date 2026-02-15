// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
      .then(function(reg) { console.log('ServiceWorker registered:', reg.scope); })
      .catch(function(err) { console.warn('ServiceWorker registration failed:', err); });
  });
}
