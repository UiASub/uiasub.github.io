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
    })
    .catch(error => console.error('Could not load homepage sponsors:', error));
})();
