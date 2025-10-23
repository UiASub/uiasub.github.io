/* Scroll-driven video hero
   - Maps scroll progress over the hero section to video playback time
   - Plays/pauses based on visibility
   - Falls back to simple play on click for mobile
*/
(function () {
  var video = document.getElementById('heroVideo');
  var hero = document.getElementById('video-hero');
  if (!video || !hero) return;

  // Ensure we can read duration; if not available, wait for metadata
  function init() {
    var duration = video.duration || 1;

    // Map scroll progress within hero to video time
    function onScroll() {
      var rect = hero.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      // progress 0..1 where 0 means top of hero at bottom of viewport, 1 means bottom of hero at top of viewport
      var start = vh; // when hero top is at bottom
      var end = -rect.height; // when hero bottom is at top
      var total = start - end;
      var offset = rect.top - end;
      var progress = Math.min(Math.max(1 - (offset / total), 0), 1);

      // set video time
      try {
        video.currentTime = progress * duration;
      } catch (e) {
        // Some browsers restrict setting currentTime before user interaction; ignore
      }

      // Play if hero is at least partially visible, pause otherwise
      if (rect.bottom > 0 && rect.top < vh) {
        if (video.paused) {
          video.play().catch(function () {});
        }
      } else {
        if (!video.paused) video.pause();
      }
    }

    // Throttle scroll with requestAnimationFrame
    var ticking = false;
    function onScrollRaf() {
      if (!ticking) {
        window.requestAnimationFrame(function () { onScroll(); ticking = false; });
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScrollRaf, { passive: true });
    window.addEventListener('resize', onScrollRaf);

    // Provide click-to-play for touch devices / when browser blocks autoplay
    hero.addEventListener('click', function () {
      if (video.paused) video.play().catch(function () {});
      else video.pause();
    });

    // Kickstart one render
    onScroll();
  }

  if (video.readyState >= 1) {
    init();
  } else {
    video.addEventListener('loadedmetadata', init);
  }
})();
