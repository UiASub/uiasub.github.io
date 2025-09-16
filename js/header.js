document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.dropdown-toggle');
  const menu = document.querySelector('.dropdown-menu');

  toggle.addEventListener('click', () => {
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
  });

  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !menu.contains(e.target)) {
      menu.style.display = 'none';
    }
  });
});