(() => {
  const successBanner = document.getElementById('contact-success');
  if (!successBanner) return;

  const params = new URLSearchParams(window.location.search);
  if (params.get('success') === 'true') {
    successBanner.classList.add('is-visible');
    successBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
    params.delete('success');
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ''}`;
    window.history.replaceState({}, document.title, newUrl);
  }
})();
