(() => {
  const section = document.querySelector('.home-sponsors');
  if (!section) return;
  const list = section.querySelector('.home-sponsors__logos');

  // Off-screen SVG waves otherwise trigger layout on every frame of the homepage.
  const waveVisibility = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.target.classList.toggle('waves--offscreen', !entry.isIntersecting));
  }, { rootMargin: '100px 0px' });
  document.querySelectorAll('.wavesContainer').forEach(wave => {
    wave.classList.add('waves--offscreen');
    waveVisibility.observe(wave);
  });

  function logoItem(sponsor) {
    const item = document.createElement('li');
    item.className = 'home-sponsors__logo';
    if (['IXYS Norge', 'Würth Elektronik', 'FFU'].includes(sponsor.name)) item.classList.add('home-sponsors__logo--dark');
    if (sponsor.name === 'Water Linked') item.classList.add('home-sponsors__logo--waterlinked');
    const link = document.createElement('a');
    link.href = sponsor.link;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    const image = document.createElement('img');
    image.src = sponsor.image;
    image.alt = sponsor.name;
    image.width = 200;
    image.height = 80;
    link.append(image);
    item.append(link);
    return item;
  }

  fetch('/data/sponsors.json')
    .then(response => {
      if (!response.ok) throw new Error(`Sponsors: ${response.status}`);
      return response.json();
    })
    .then(sponsors => {
      if (!sponsors.length) return;
      list.append(...sponsors.map(logoItem));
      section.hidden = false;
      const viewport = section.querySelector('.home-sponsors__viewport');
      const track = document.createElement('div');
      track.className = 'home-sponsors__logos';
      list.className = 'home-sponsors__group';
      track.append(list);
      viewport.replaceChildren(track);
      const copies = [];
      const syncLoop = () => {
        const loopWidth = list.getBoundingClientRect().width;
        if (!loopWidth) return;
        // Keep enough inert copies to cover the viewport through the entire loop.
        const needed = Math.max(1, Math.ceil(viewport.clientWidth / loopWidth));
        while (copies.length < needed) {
          const copy = list.cloneNode(true);
          copy.className = 'home-sponsors__copy';
          copy.setAttribute('aria-hidden', 'true');
          copy.inert = true;
          copies.push(copy);
          track.append(copy);
        }
        while (copies.length > needed) copies.pop().remove();
        track.style.setProperty('--sponsor-loop-width', `${loopWidth}px`);
        track.style.setProperty('--sponsor-duration', `${loopWidth / 24}s`);
      };
      const loopObserver = new ResizeObserver(syncLoop);
      loopObserver.observe(viewport);
      loopObserver.observe(list);
      syncLoop();
      // Focus stops the animation in CSS and reveals each original sponsor link.
      track.addEventListener('focusin', event => {
        event.target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      });
      track.addEventListener('focusout', () => {
        requestAnimationFrame(() => {
          if (!track.contains(document.activeElement)) viewport.scrollLeft = 0;
        });
      });
      // Scroll updates use the cached strip height and only move the navigation.
      const alignNavigation = mast => {
        let height = section.offsetHeight;
        let ticking = false;
        const updatePosition = () => {
          const top = `${Math.max(0, height - window.scrollY)}px`;
          if (mast.style.top !== top) mast.style.top = top;
          ticking = false;
        };
        const requestPosition = () => {
          if (ticking) return;
          ticking = true;
          requestAnimationFrame(updatePosition);
        };
        window.addEventListener('scroll', requestPosition, { passive: true });
        new ResizeObserver(() => {
          height = section.offsetHeight;
          document.documentElement.style.setProperty('--home-sponsor-height', `${height}px`);
          requestPosition();
        }).observe(section);
        document.documentElement.style.setProperty('--home-sponsor-height', `${height}px`);
        updatePosition();
      };
      const masthead = document.querySelector('.masthead');
      const headerHost = document.querySelector('#header');
      if (masthead) alignNavigation(masthead);
      else if (headerHost) {
        const observer = new MutationObserver(() => {
          const mast = headerHost.querySelector('.masthead');
          if (mast) { observer.disconnect(); alignNavigation(mast); }
        });
        observer.observe(headerHost, { childList: true, subtree: true });
      }
    })
    .catch(error => console.error('Could not load homepage sponsors:', error));
})();
