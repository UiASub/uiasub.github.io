(function(){
  const container = document.querySelector('.video-hero[data-overlay-enabled]');
  const overlay = document.getElementById('overlay-hero-video');
  if (!overlay || !container) return;
  function updateOverlayPlayback(){
    try{
      const style = window.getComputedStyle(overlay);
      if (style && style.display === 'none'){
        overlay.pause();
      } else if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        overlay.pause();
      } else {
        overlay.play().catch(()=>{});
      }
    }catch(e){}
  }
  updateOverlayPlayback();
  window.addEventListener('resize', updateOverlayPlayback);
  var mql = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mql.addEventListener) mql.addEventListener('change', updateOverlayPlayback);
  else if (mql.addListener) mql.addListener(updateOverlayPlayback);
})();