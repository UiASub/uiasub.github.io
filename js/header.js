// Header initialization and functionality
function initializeHeader() {
  // Check which header element exists to determine language
  const norwegianHeader = document.getElementById('header');
  const englishHeader = document.getElementById('header-eng');
  
  let targetElement, headerPath;
  
  if (englishHeader) {
    targetElement = englishHeader;
    headerPath = '/src/en/header.html';
  } else if (norwegianHeader) {
    targetElement = norwegianHeader;
    headerPath = '/header.html';
  } else {
    console.error('No header element found');
    return;
  }
  
  fetch(headerPath)
    .then(response => response.text())
    .then(data => { 
      targetElement.innerHTML = data;
      
      // Initialize scroll functionality after header is loaded
      const logo = document.getElementById('logo');
      if (logo) {
        window.addEventListener('scroll', function() {
          if (window.scrollY > 50) {
            logo.style.maxWidth = '180px';
          } else {
            logo.style.maxWidth = '280px';
          }
        });
      }
      
      // Initialize dropdown functionality
      initializeDropdown();
    });
}

function initializeDropdown() {
  const toggle = document.querySelector('.dropdown-toggle');
  const menu = document.querySelector('.dropdown-menu');
  
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', (e) => {
      if (!toggle.contains(e.target) && !menu.contains(e.target)) {
        menu.style.display = 'none';
      }
    });
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeHeader);