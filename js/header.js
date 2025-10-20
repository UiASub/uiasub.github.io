// Header initialization and functionality
function initializeHeader() {
  // Check which header element exists to determine language
  const norwegianHeader = document.getElementById('header');
  const englishHeader = document.getElementById('header-eng');
  
  let targetElement, headerPath, isEnglish;
  
  if (englishHeader) {
    targetElement = englishHeader;
    headerPath = '/en/header.html';
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
      // Logo sizing is controlled by CSS to preserve original layout and dropdown behavior.
      // Leave JS out of sizing changes to avoid conflicts or unexpected height shifts.
      const logo = document.getElementById('logo');
      if (logo) {
        // Optional: keep a class-based small-on-scroll behavior if desired later.
        // No inline style changes here to let CSS determine dimensions.
      }

      // Initialize dropdown functionality
      initializeDropdown();

      // Initialize theme toggle if present
      try {
        initThemeToggle();
      } catch (e) {
        // ignore if toggle not present yet
      }

      // Initialize hamburger menu
      initializeHamburgerMenu();

      // Wait for DOM update, then check login status and update link
      setTimeout(() => {
        checkLoginStatus(isEnglish);
      }, 0);
      // Ensure manifest and theme-color meta exist in document head (useful when header.html is injected into body)
      try {
        if (!document.querySelector('link[rel="manifest"]')) {
          const m = document.createElement('link');
          m.rel = 'manifest';
          m.href = '/manifest.webmanifest';
          document.head.appendChild(m);
        }
        if (!document.querySelector('meta[name="theme-color"]')) {
          const meta = document.createElement('meta');
          meta.name = 'theme-color';
          meta.content = '#003f7f';
          document.head.appendChild(meta);
        }
      } catch (e) {
        console.warn('Could not add manifest/meta to head:', e);
      }

      // Register service worker from header code to ensure registration on pages using header injection.
      // Register as early as possible and request root scope so the SW can control top-level pages.
      if ('serviceWorker' in navigator) {
        const registerSW = () => {
          navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
            .then(function(reg) {
              console.log('ServiceWorker registered from header.js with scope:', reg.scope);
              // Check whether the service worker is controlling the page
              if (navigator.serviceWorker.controller) {
                console.log('ServiceWorker is controlling the page.');
              } else {
                // Wait until ready and then report
                navigator.serviceWorker.ready.then(() => {
                  console.log('ServiceWorker ready. Controller:', navigator.serviceWorker.controller);
                });
              }
            }).catch(function(err) {
              console.warn('ServiceWorker registration from header.js failed:', err);
            });
        };

        if (document.readyState === 'complete' || document.readyState === 'interactive') {
          // register immediately if DOM is already interactive
          registerSW();
        } else {
          window.addEventListener('load', registerSW);
        }
      }
  });
}

function initializeDropdown() {
  const toggle = document.querySelector('.dropdown-toggle');
  const menu = document.querySelector('.dropdown-menu');

  if (toggle && menu) {
    // Keep a reference to the original parent so we can restore the menu
    const originalParent = menu.parentNode;
    const originalNext = menu.nextSibling;

    let isOpen = false;

    function openMenu() {
      // move menu to body and position it fixed so it floats above all content
      const rect = toggle.getBoundingClientRect();
      if (menu.parentNode !== document.body) {
        document.body.appendChild(menu);
      }
      menu.style.display = 'block';
      menu.style.position = 'fixed';
      menu.style.left = Math.max(8, rect.left) + 'px';
      // align the menu's top to the toggle bottom, with small gap
      menu.style.top = (rect.bottom + 8) + 'px';
      menu.style.right = 'auto';
      // ensure menu width is at least toggle width
      const minW = Math.max(menu.offsetWidth || 0, rect.width);
      menu.style.minWidth = Math.max(120, rect.width) + 'px';
      menu.style.zIndex = 2000;
      isOpen = true;
      toggle.setAttribute('aria-expanded', 'true');
    }

    function closeMenu() {
      // Restore menu into original DOM place to keep markup predictable
      if (originalParent && menu.parentNode !== originalParent) {
        if (originalNext) originalParent.insertBefore(menu, originalNext);
        else originalParent.appendChild(menu);
      }
      menu.style.display = 'none';
      // clear fixed positioning styles we set when opened
      menu.style.position = '';
      menu.style.left = '';
      menu.style.top = '';
      menu.style.right = '';
      menu.style.minWidth = '';
      menu.style.zIndex = '';
      isOpen = false;
      toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isOpen) closeMenu();
      else openMenu();
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!toggle.contains(e.target) && !menu.contains(e.target)) {
        if (isOpen) closeMenu();
      }
    });

    // Close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        if (isOpen) closeMenu();
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
  const pagesPrefix = isEnglish ? '/en' : '';
  if (!token) {
    // Not logged in
    loginLink.textContent = isEnglish ? ' Log In' : ' Logg Inn';
    loginLink.href = `${pagesPrefix}/pages/login.html`;
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
      loginLink.href = `${pagesPrefix}/pages/equipment.html`;
      loginLink.style.color = '#3ba55d';
    } else {
      loginLink.textContent = isEnglish ? ' Log In' : ' Logg Inn';
      loginLink.href = `${pagesPrefix}/pages/login.html`;
      loginLink.style.color = '';
    }
  } catch (e) {
    loginLink.textContent = isEnglish ? ' Log In' : ' Logg Inn';
    loginLink.href = `${pagesPrefix}/pages/login.html`;
    loginLink.style.color = '';
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeHeader);