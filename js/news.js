// small progressive enhancement: add hover lift for non-touch devices
(function(){
  if(('ontouchstart' in window) || navigator.maxTouchPoints > 0) return;
  document.querySelectorAll('.card-hover').forEach(function(el){
    el.addEventListener('mouseenter', function(){ el.classList.add('hovered'); });
    el.addEventListener('mouseleave', function(){ el.classList.remove('hovered'); });
  });
})();