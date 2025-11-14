// Sponsor Carousel Slider
$(document).ready(function(){
  var owl = $('.owl-carousel.sponsor-carousel');
  owl.owlCarousel({
    loop: true,
    margin: 15,
    center: true,
    responsiveClass: true,
    autoplay: true,
    autoplayTimeout: 3000,
    autoplayHoverPause: true,
    smartSpeed: 450,
    responsive: {
      0: {
        items: 1,
        nav: true
      },
      600: {
        items: 2,
        nav: false
      },
      1000: {
        items: 3,
        nav: true
      }
    }
  });
  
  // Force restart autoplay after initialization
  owl.trigger('play.owl.autoplay', [3000]);
});