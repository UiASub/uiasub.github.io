// Scroll-driven hero scaling (now for class-banner)
(() => {
  const classBanner = document.querySelector('.class-banner-container');
  if (!classBanner) return;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // Config: how much to scale the banner when scrolled
  const minScale = 0.95;
  const maxScale = 1;
  const minOpacity = 0.7;
  const maxOpacity = 1;

  const onScroll = () => {
    const rect = classBanner.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const progress = clamp((-rect.top) / vh, 0, 1);
    const scale = maxScale - (progress * (maxScale - minScale));
    const opacity = maxOpacity - (progress * (maxOpacity - minOpacity));
    
    classBanner.style.transform = `scale(${scale.toFixed(3)})`;
    classBanner.style.opacity = opacity.toFixed(2);
  };

  let ticking = false;
  const onScrollRaf = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        onScroll();
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScrollRaf, { passive: true });
  window.addEventListener('resize', onScrollRaf);
  // init
  onScroll();
})();

// Mobile video source swap: switch to a mobile-optimized video when viewport is small
(() => {
  const MOBILE_QUERY = '(max-width: 767px)';
  const mobileSrc = '/videos/2Maybe.mp4';
  const desktopSrc = '/videos/UseThis.mp4';
  const video = document.getElementById('use-this-hero-video');
  if (!video) return;

  function setSource(src) {
    const sourceEl = video.querySelector('source');
    if (!sourceEl) return;
    if (sourceEl.getAttribute('src') === src) return;
    sourceEl.setAttribute('src', src);
    try { video.load(); } catch (e) { /* ignore */ }
    video.muted = true;
    video.playsInline = true;
    video.play().catch(() => {});
  }

  const mql = window.matchMedia(MOBILE_QUERY);
  function handleChange(e) {
    if (e.matches) setSource(mobileSrc);
    else setSource(desktopSrc);
  }

  // initial
  handleChange(mql);
  if (mql.addEventListener) mql.addEventListener('change', handleChange);
  else if (mql.addListener) mql.addListener(handleChange);
  window.addEventListener('resize', () => handleChange(window.matchMedia(MOBILE_QUERY)));
})();
