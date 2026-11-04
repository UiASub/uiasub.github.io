(() => {
  const section = document.querySelector('.home-sponsors');
  if (!section) return;
  const list = section.querySelector('.home-sponsors__logos');

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
      // A second, inert copy makes the loop seamless without duplicate tab stops.
      const duplicate = list.cloneNode(true);
      duplicate.setAttribute('aria-hidden', 'true');
      duplicate.inert = true;
      duplicate.className = 'home-sponsors__copy';
      const track = document.createElement('div');
      track.className = 'home-sponsors__logos';
      list.className = 'home-sponsors__group';
      track.append(list, duplicate);
      viewport.replaceChildren(track);
      // Focus stops the animation in CSS and reveals each original sponsor link.
      track.addEventListener('focusin', event => {
        event.target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      });
      // The sponsor strip stays in document flow; only the existing navigation is fixed.
      const alignNavigation = mast => {
        let ticking = false;
        const updatePosition = () => {
          mast.style.top = `${Math.max(0, section.getBoundingClientRect().bottom)}px`;
          document.documentElement.style.setProperty('--home-sponsor-height', `${section.offsetHeight}px`);
          ticking = false;
        };
        const requestPosition = () => {
          if (ticking) return;
          ticking = true;
          requestAnimationFrame(updatePosition);
        };
        window.addEventListener('scroll', requestPosition, { passive: true });
        new ResizeObserver(requestPosition).observe(section);
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
