(() => {
  const section = document.querySelector('.home-sponsors');
  if (!section) return;
  const list = section.querySelector('.home-sponsors__logos');
  const english = document.documentElement.lang === 'en';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

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
      const toggle = section.querySelector('[data-sponsor-toggle]');
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
      let paused = reducedMotion.matches;
      const updateToggle = () => {
        track.classList.toggle('is-paused', paused);
        toggle.textContent = paused ? '▶' : 'Ⅱ';
        toggle.setAttribute('aria-pressed', String(paused));
        toggle.setAttribute('aria-label', english ? (paused ? 'Play sponsor ticker' : 'Pause sponsor ticker') : (paused ? 'Spill sponsorlinjen' : 'Sett sponsorlinjen på pause'));
      };
      toggle.addEventListener('click', () => { paused = !paused; updateToggle(); });
      // Keyboard users get a stationary list that scrolls each focused logo into view.
      track.addEventListener('focusin', event => {
        paused = true;
        updateToggle();
        event.target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      });
      reducedMotion.addEventListener('change', () => { paused = reducedMotion.matches; updateToggle(); });
      const attachToHeader = mast => {
        mast.classList.add('masthead--sponsors-above');
        mast.prepend(section);
      };
      const masthead = document.querySelector('.masthead');
      const headerHost = document.querySelector('#header');
      if (masthead) attachToHeader(masthead);
      else if (headerHost) {
        const observer = new MutationObserver(() => {
          const mast = headerHost.querySelector('.masthead');
          if (mast) { observer.disconnect(); attachToHeader(mast); }
        });
        observer.observe(headerHost, { childList: true, subtree: true });
      }
      updateToggle();
    })
    .catch(error => console.error('Could not load homepage sponsors:', error));
})();
