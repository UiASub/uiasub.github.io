(function(){
  // Handle overlay video
  const container = document.querySelector('.kit-banner');
  const overlay = document.getElementById('overlay-hero-video');
  const mainVideo = document.getElementById('use-this-hero-video');
  const playPauseBtn = document.querySelector('.c-animation-button');
  
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
  
  // Handle play/pause button
  if (playPauseBtn && mainVideo) {
    // Auto-play main video
    mainVideo.play().catch(()=>{});
    playPauseBtn.setAttribute('data-js-video-state', 'playing');
    
    playPauseBtn.addEventListener('click', function() {
      const currentState = playPauseBtn.getAttribute('data-js-video-state');
      
      if (currentState === 'playing') {
        mainVideo.pause();
        overlay.pause();
        playPauseBtn.setAttribute('data-js-video-state', 'paused');
        playPauseBtn.setAttribute('aria-label', 'Spill av bakgrunnsvideo');
      } else {
        mainVideo.play().catch(()=>{});
        overlay.play().catch(()=>{});
        playPauseBtn.setAttribute('data-js-video-state', 'playing');
        playPauseBtn.setAttribute('aria-label', 'Pause bakgrunnsvideo');
      }
    });
  }
})();