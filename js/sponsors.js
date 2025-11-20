// Sponsor Carousel Slider
$(document).ready(function () {
  const sponsorContainer = $('.owl-carousel.sponsor-carousel');
  const isEnglish = document.documentElement.lang === 'en' || window.location.pathname.includes('/en/');
  const visitText = isEnglish ? 'Visit Website' : 'Besøk Nettside';

  fetch('/data/sponsors.json')
    .then(response => response.json())
    .then(data => {
      if (data && data.length > 0) {
        data.forEach(sponsor => {
          const description = isEnglish && sponsor.description_en ? sponsor.description_en : sponsor.description;

          const itemHtml = `
            <div class="sponsor-item">
              <img src="${sponsor.image}" alt="${sponsor.name} Logo">
              <h3>${sponsor.name}</h3>
              <p>${description}</p>
              <a href="${sponsor.link}" target="_blank" rel="noopener noreferrer" class="btn btn-primary mt-3">${visitText}</a>
            </div>
          `;
          sponsorContainer.append(itemHtml);
        });

        // Initialize Owl Carousel AFTER adding items
        sponsorContainer.owlCarousel({
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
        sponsorContainer.trigger('play.owl.autoplay', [3000]);
      }
    })
    .catch(error => console.error('Error loading sponsors:', error));
});