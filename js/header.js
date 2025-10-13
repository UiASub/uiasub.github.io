// Header initialization and functionality
function initializeHeader() {
  // Check which header element exists to determine language
  const norwegianHeader = document.getElementById('header');
  const englishHeader = document.getElementById('header-eng');
  
  let targetElement, headerPath, isEnglish;
  
  if (englishHeader) {
    targetElement = englishHeader;
    headerPath = '/src/en/header.html';
    isEnglish = true;
  } else if (norwegianHeader) {
    targetElement = norwegianHeader;
    headerPath = '/header.html';
    isEnglish = false;
  } else {
    console.error('No header element found');
    return;
  }
  
  fetch(headerPath)
    .then(response => response.text())
    .then(data => { 
      targetElement.innerHTML = data;
      
      // Fade in header to prevent FOUC
      requestAnimationFrame(() => {
        targetElement.style.opacity = '1';
        targetElement.style.transition = 'opacity 0.2s ease-in';
      });
      
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

      // Initialize hamburger menu
      initializeHamburgerMenu();

      // Wait for DOM update, then check login status and update link
      setTimeout(() => {
        checkLoginStatus(isEnglish);
      }, 0);
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

function initializeHamburgerMenu() {
  const hamburger = document.querySelector('.hamburger-menu');
  const navigation = document.querySelector('.navigation');
  
  if (hamburger && navigation) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navigation.classList.toggle('active');
    });
    
    // Close menu when clicking a navigation link
    const navLinks = navigation.querySelectorAll('a');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navigation.classList.remove('active');
      });
    });
  }
}

// Check if user is logged in and update header link
async function checkLoginStatus(isEnglish) {
  const loginLink = document.getElementById('loginLink');
  const EDGE_FUNCTION_URL = "https://iiauxyfisphubpsaffag.supabase.co/functions/v1/discord-role-sync";
  const token = window.localStorage.getItem('access_token');
  if (!loginLink) return;
  if (!token) {
    // Not logged in
    loginLink.textContent = isEnglish ? ' Log Inn' : ' Logg Inn';
    loginLink.href = '/src/pages/login.html';
    loginLink.style.color = '';
    return;
  }
  try {
    const res = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ check: true })
    });
    const payload = await res.json().catch(() => null);
    if (res.status === 200 && payload && payload.ok === true) {
      loginLink.textContent = isEnglish ? ' Logged In' : ' Logget Inn';
      loginLink.href = '/src/pages/equipment.html';
      loginLink.style.color = '#3ba55d';
    } else {
      loginLink.textContent = isEnglish ? ' Log Inn' : ' Logg Inn';
      loginLink.href = '/src/pages/login.html';
      loginLink.style.color = '';
    }
  } catch (e) {
    loginLink.textContent = isEnglish ? ' Log Inn' : ' Logg Inn';
    loginLink.href = '/src/pages/login.html';
    loginLink.style.color = '';
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeHeader);