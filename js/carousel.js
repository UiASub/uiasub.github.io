/* Carousel v2.0 initializer (moved out of index.html)
   - Initializes Bootstrap carousel
   - Wires thumbnail active state
   - Adds keyboard navigation (left/right)
   - Ensures lazy images in active slide are set
*/
(function () {
  try {
    var el = document.querySelector('#myCarousel');
    if (!el || !window.bootstrap) return;

    var carousel = new bootstrap.Carousel(el, { interval: parseInt(el.getAttribute('data-bs-interval')) || 8000, ride: el.getAttribute('data-bs-ride') || false, pause: 'hover' });

    // Thumbnails: keep active class in sync
    var thumbs = el.querySelectorAll('.carousel-thumbs .thumb');
    function setActiveThumb(index) {
      thumbs.forEach(function (t, i) {
        t.classList.toggle('active', i === index);
        t.setAttribute('aria-pressed', String(i === index));
      });
    }

    // Update on slide event
    el.addEventListener('slid.bs.carousel', function (ev) {
      var idx = (ev && typeof ev.to === 'number') ? ev.to : Array.from(el.querySelectorAll('.carousel-item')).indexOf(ev.relatedTarget) || 0;
      setActiveThumb(idx);
      // Ensure images in the active slide are loaded (safety for lazy loading)
      var imgs = el.querySelectorAll('.carousel-item.active img.lazy');
      imgs.forEach(function (img) { if (img.dataset && img.dataset.src && img.src !== img.dataset.src) img.src = img.dataset.src; });
    });

    // Wire thumbnail clicks to navigate carousel
    thumbs.forEach(function (btn, i) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        carousel.to(i);
        setActiveThumb(i);
      });
    });

    // Keyboard support: left/right to navigate
    el.tabIndex = 0;
    el.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault(); carousel.prev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault(); carousel.next();
      }
    });

    // Initial active thumb
    setActiveThumb(0);

  } catch (e) {
    console.error('Carousel v2.0 (external) init failed', e);
  }
})();
