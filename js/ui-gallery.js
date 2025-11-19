(function () {
  'use strict';

  /**
   * UI mockups data. Images are referenced under /images/ui-mockups/ (to be added) with placeholder fallback.
   * Each object: { title, description, imagePath, category }
   * We support localized datasets and choose based on <html lang> or path prefix.
   */
  const mockupsData_no = [
    {
      title: 'Hovedkontrollpanel',
      description: 'Joystick input, thruster allocation, og sanntidsstatus',
      imagePath: '/images/project/dashboard.png',
      category: 'Control'
    },
    {
      title: 'Sensor Dashboard',
      description: 'Sanntidsvisning av dybde, temperatur, orientering og andre sensorer',
      imagePath: '/images/project/sensor.png',
      category: 'Monitoring'
    },
    {
      title: 'Video Feed Interface',
      description: 'Primær og sekundær kamera med overlay-informasjon',
      imagePath: '/images/project/dashboard.png',
      category: 'Video'
    },
    {
      title: 'Thruster Kontroll',
      description: 'Individuell thruster-status og vektorisert kraftfordeling',
      imagePath: '/images/project/sensor.png',
      category: 'Control'
    },
    {
      title: 'Telemetri Visning',
      description: 'Grafisk telemetri, historiske plots og alarmer',
      imagePath: '/images/project/dashboard.png',
      category: 'Monitoring'
    },
    {
      title: 'Systemstatus',
      description: 'Oversikt over batteri, temperatur og feillogger',
      imagePath: '/images/project/sensor.png',
      category: 'Status'
    }
  ];

  const mockupsData_en = [
    {
      title: 'Main Control Panel',
      description: 'Joystick input, thruster allocation and real-time status',
      imagePath: '/images/project/dashboard.png',
      category: 'Control'
    },
    {
      title: 'Sensor Dashboard',
      description: 'Real-time display of depth, temperature and orientation',
      imagePath: '/images/project/sensor.png',
      category: 'Monitoring'
    },
    {
      title: 'Video Feed Interface',
      description: 'Primary and secondary camera with overlay information',
      imagePath: '/images/project/dashboard.png',
      category: 'Video'
    },
    {
      title: 'Thruster Control',
      description: 'Individual thruster status and force distribution',
      imagePath: '/images/project/sensor.png',
      category: 'Control'
    },
    {
      title: 'Telemetry Display',
      description: 'Graphical telemetry, historical plots and alerts',
      imagePath: '/images/project/dashboard.png',
      category: 'Monitoring'
    },
    {
      title: 'System Status',
      description: 'Overview of battery, temperature and error logs',
      imagePath: '/images/project/sensor.png',
      category: 'Status'
    }
  ];

  // Locale detection: check path prefix (English pages are under /en/)
  const isEnglish = location.pathname && location.pathname.startsWith('/en');
  const mockupsData = isEnglish ? mockupsData_en : mockupsData_no;

  const placeholderBase = 'https://via.placeholder.com/1200x800/002f47/ffffff?text=';

  let currentMockupIndex = 0;
  let keydownHandler = null;

  /**
   * Safe accessor to DOM elements used by the gallery.
   */
  function $(selector, root = document) {
    return root.querySelector(selector);
  }

  /**
   * Update the modal content to the given mockup index.
   * Lazy-loads the image and updates title/description and nav state.
   * @param {number} index
   */
  function updateModalContent(index) {
    if (typeof index !== 'number' || index < 0 || index >= mockupsData.length) return;
    const data = mockupsData[index];
    const titleEl = $('#uiModalLabel');
    const imgEl = $('#uiModalImage');
    const descEl = $('#uiModalDescription');
    const prevBtn = $('#prevMockup');
    const nextBtn = $('#nextMockup');

    if (!titleEl || !imgEl || !descEl) return;

    // Use dataset-driven content where available (cards in HTML may contain localized text),
    // but fall back to our localized mockupsData object.
    titleEl.textContent = data.title;
    descEl.textContent = data.description || '';

    // Lazy load image: set src only when modal is shown/updated
    const imgUrl = data.imagePath || (placeholderBase + encodeURIComponent(data.title));
    // Use a cache-busting-free approach: let the browser handle caching; on error we'll fallback
    imgEl.src = imgUrl;

    // Update navigation state
    if (prevBtn) {
      if (index === 0) {
        prevBtn.classList.add('disabled');
        prevBtn.setAttribute('disabled', '');
      } else {
        prevBtn.classList.remove('disabled');
        prevBtn.removeAttribute('disabled');
      }
    }
    if (nextBtn) {
      if (index === mockupsData.length - 1) {
        nextBtn.classList.add('disabled');
        nextBtn.setAttribute('disabled', '');
      } else {
        nextBtn.classList.remove('disabled');
        nextBtn.removeAttribute('disabled');
      }
    }

    currentMockupIndex = index;
  }

  function showNextMockup() {
    if (currentMockupIndex < mockupsData.length - 1) {
      updateModalContent(currentMockupIndex + 1);
    }
  }

  function showPreviousMockup() {
    if (currentMockupIndex > 0) {
      updateModalContent(currentMockupIndex - 1);
    }
  }

  /**
   * Handle image load errors by replacing with a placeholder.
   */
  function handleImageError(ev) {
    ev.target.src = placeholderBase + 'Image+Not+Found';
  }


  /**
   * Initialize gallery: attach event listeners to thumbnails and modal controls.
   */
  function initGallery() {
    try {
      const modalEl = $('#uiModal');
      const thumbnailNodes = document.querySelectorAll('[data-ui-index]');
      const prevBtn = $('#prevMockup');
      const nextBtn = $('#nextMockup');
      const imgEl = $('#uiModalImage');

      if (!modalEl) return; // graceful degradation

      // Thumbnail click handlers
      thumbnailNodes.forEach(node => {
        node.addEventListener('click', (ev) => {
          const idx = parseInt(node.getAttribute('data-ui-index'), 10);
          if (Number.isNaN(idx)) return;
          updateModalContent(idx);
          // Allow Bootstrap's data-bs-toggle to open the modal
        });
        // Keyboard activation (Enter/Space)
        node.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            node.click();
          }
        });
      });

      // Prev/Next handlers
      if (prevBtn) prevBtn.addEventListener('click', showPreviousMockup);
      if (nextBtn) nextBtn.addEventListener('click', showNextMockup);

      // Image error handling
      if (imgEl) imgEl.addEventListener('error', handleImageError);

      // Keyboard nav (attached when modal is shown)
      modalEl.addEventListener('shown.bs.modal', function () {
        // Attach keydown handler to the document
        keydownHandler = function (ev) {
          if (ev.key === 'ArrowLeft') {
            showPreviousMockup();
          } else if (ev.key === 'ArrowRight') {
            showNextMockup();
          }
        };
        document.addEventListener('keydown', keydownHandler);
      });

      modalEl.addEventListener('hidden.bs.modal', function () {
        // cleanup
        if (keydownHandler) {
          document.removeEventListener('keydown', keydownHandler);
          keydownHandler = null;
        }
      });

      // Optional: initialize first mockup into modal image alt/title (modal hidden by default)
      if (mockupsData.length > 0) {
        updateModalContent(0);
      }

    } catch (err) {
      console.error('ui-gallery: failed to initialize gallery', err);
    }
  }

  // Initialize on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGallery);
  } else {
    initGallery();
  }

})();
