// Reduced-motion and video control handling
(() => {
  const baseVideo = document.getElementById('use-this-hero-video');
  const overlayVideo = document.getElementById('overlay-hero-video');
  const controlBtn = document.getElementById('video-play-pause');
  
  if (!baseVideo) return;

  let isPlaying = true;

  function updateVideoPlayback() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReduced) {
      baseVideo.pause();
      if (overlayVideo) overlayVideo.pause();
      isPlaying = false;
      updateControlButton();
    } else if (isPlaying) {
      baseVideo.play().catch(() => {});
      if (overlayVideo) overlayVideo.play().catch(() => {});
    }
  }

  function updateControlButton() {
    if (!controlBtn) return;
    const pauseIcon = controlBtn.querySelector('.pause-icon');
    const playIcon = controlBtn.querySelector('.play-icon');
    
    // Localize labels based on document language
    const lang = document.documentElement.lang || 'nb';
    const labels = {
      'nb': { pause: 'Pause bakgrunnsvideo', play: 'Spill av bakgrunnsvideo' },
      'en': { pause: 'Pause background video', play: 'Play background video' }
    };
    const currentLabels = labels[lang] || labels['nb'];
    
    if (isPlaying) {
      controlBtn.setAttribute('aria-label', currentLabels.pause);
      controlBtn.setAttribute('aria-pressed', 'true');
      if (pauseIcon) pauseIcon.style.display = '';
      if (playIcon) playIcon.style.display = 'none';
    } else {
      controlBtn.setAttribute('aria-label', currentLabels.play);
      controlBtn.setAttribute('aria-pressed', 'false');
      if (pauseIcon) pauseIcon.style.display = 'none';
      if (playIcon) playIcon.style.display = '';
    }
  }

  function togglePlayback() {
    isPlaying = !isPlaying;
    if (isPlaying) {
      baseVideo.play().catch(() => {});
      if (overlayVideo) overlayVideo.play().catch(() => {});
    } else {
      baseVideo.pause();
      if (overlayVideo) overlayVideo.pause();
    }
    updateControlButton();
  }

  // Control button click and keyboard support
  if (controlBtn) {
    controlBtn.addEventListener('click', togglePlayback);
    controlBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        togglePlayback();
      }
    });
  }

  // Listen for reduced-motion changes
  const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mql.addEventListener) {
    mql.addEventListener('change', updateVideoPlayback);
  } else if (mql.addListener) {
    mql.addListener(updateVideoPlayback);
  }

  // Initial check
  updateVideoPlayback();
  updateControlButton();
})();

// Scroll-driven hero scaling
(() => {
  const videoHero = document.querySelector('.video-hero');
  if (!videoHero) return;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // Config: how much to scale the video when scrolled to 100% of hero height
  const minScale = 0.52;
  const maxScale = 1;

  const onScroll = () => {
    const rect = videoHero.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    // progress should be 0 when hero top == 0, and approach 1 when hero has scrolled up by ~1vh
    const progress = clamp((-rect.top) / vh, 0, 1);
    const scale = maxScale - (progress * (maxScale - minScale));
    videoHero.style.setProperty('--hero-scale', scale.toFixed(3));
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
