// Header initialization and functionality
function parseHtmlFragment(html) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const bodyHtml = doc && doc.body ? doc.body.innerHTML : html;
    const headLinks = doc && doc.head ? Array.from(doc.head.querySelectorAll('link[rel="stylesheet"]')) : [];
    return { bodyHtml, headLinks };
  } catch (e) {
    return { bodyHtml: html, headLinks: [] };
  }
}

function ensureStyles(links) {
  if (!links || !links.length) return;
  links.forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) return;
    if (document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) return;
    const newLink = document.createElement('link');
    newLink.rel = 'stylesheet';
    newLink.href = href;
    document.head.appendChild(newLink);
  });
}

function initializeHeader() {
  // Prefer a single container id '#header' and detect locale by path.
  // Fallback: if '#header' is missing but legacy '#header-eng' exists, use it.
  const headerContainer = document.getElementById('header');
  const legacyEnglishHeader = document.getElementById('header-eng');

  let targetElement = headerContainer || legacyEnglishHeader;
  if (!targetElement) {
    console.error('No header element found');
    return;
  }

  // Determine locale: prefer pathname-based detection so English pages load /en/header.html
  let isEnglish = false;
  try {
    isEnglish = location && location.pathname && location.pathname.startsWith('/en');
  } catch (e) {
    isEnglish = !!legacyEnglishHeader; // fallback to legacy element presence
  }

  const headerPath = isEnglish ? '/en/header.html' : '/header.html';

  const cacheKey = isEnglish ? 'header-eng-html' : 'header-nb-html';
  const cached = sessionStorage.getItem(cacheKey);
  // If header was injected and contains a masthead, mark the document and set masthead height
  const markFixedHeader = () => {
    const mast = targetElement ? targetElement.querySelector('.masthead') : null;
    if (mast) {
      document.documentElement.classList.add('has-fixed-header');
      const h = mast.offsetHeight || 56;
      document.documentElement.style.setProperty('--masthead-height', h + 'px');
    }
  };
  const applyHeader = (data) => {
    const parsed = parseHtmlFragment(data);
    targetElement.innerHTML = parsed.bodyHtml;
    ensureStyles(parsed.headLinks);
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
    
    // Initialize scroll direction detection for header hide/show
    initializeScrollDirection();

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
      if (!document.querySelector('meta[name=\"theme-color\"]')) {
        const meta = document.createElement('meta');
        meta.name = 'theme-color';
        meta.content = '#003f7f';
        document.head.appendChild(meta);
      }
    } catch (e) {
      console.warn('Could not add manifest/meta to head:', e);
    }


  };

  if (cached) {
    try {
      applyHeader(cached);
      markFixedHeader();
      // run checkLoginStatus after a short timeout to ensure the DOM is ready
      setTimeout(() => checkLoginStatus(isEnglish), 0);
      return;
    } catch (e) {
      // if cached content fails for any reason fall through to fetch
      console.warn('Using cached header failed, refetching:', e);
    }
  }

  fetch(headerPath)
    .then(response => response.text())
    .then(data => {
      try {
        sessionStorage.setItem(cacheKey, data);
      } catch (e) {
        // ignore storage quota errors
      }
      applyHeader(data);
      markFixedHeader();
      // Post-insert login check
      setTimeout(() => checkLoginStatus(isEnglish), 0);
    }).catch(err => {
      console.warn('Failed to fetch header:', err);
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
    let lastFocusedElement = null;

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

      // Store the last focused element and move focus to first menu link
      lastFocusedElement = document.activeElement;
      const firstLink = menu.querySelector('a');
      if (firstLink) {
        setTimeout(() => firstLink.focus(), 0);
      }
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

      // Return focus to toggle button
      if (lastFocusedElement && lastFocusedElement === toggle) {
        toggle.focus();
      }
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

    // Keyboard navigation
    menu.addEventListener('keydown', (e) => {
      const menuLinks = Array.from(menu.querySelectorAll('a'));
      const currentIndex = menuLinks.indexOf(document.activeElement);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % menuLinks.length;
        menuLinks[nextIndex].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = currentIndex <= 0 ? menuLinks.length - 1 : currentIndex - 1;
        menuLinks[prevIndex].focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        menuLinks[0].focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        menuLinks[menuLinks.length - 1].focus();
      }
    });

    // Close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        if (isOpen) {
          closeMenu();
          toggle.focus();
        }
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
  const CACHE_KEY = 'loginStatusCache';
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  if (!loginLink) return;

  // Always point to the canonical login/equipment pages under /pages/ (no locale prefix).
  // The link text is localized, but the routes are centralized.
  if (!token) {
    // Not logged in
    loginLink.textContent = isEnglish ? ' Log In' : ' Logg Inn';
    loginLink.href = `/pages/login.html`;
    loginLink.style.color = '';
    sessionStorage.removeItem(CACHE_KEY); // Clear cache if no token
    return;
  }

  // Check cache first (DDOS protection lel)
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const { status, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;

      // Use cached status if less than 5 minutes old
      if (age < CACHE_DURATION) {
        if (status === 'logged_in') {
          loginLink.textContent = isEnglish ? ' Logged In' : ' Logget Inn';
          loginLink.href = `/pages/equipment.html`;
          loginLink.style.color = '#3ba55d';
        } else {
          loginLink.textContent = isEnglish ? ' Log In' : ' Logg Inn';
          loginLink.href = `/pages/login.html`;
          loginLink.style.color = '';
        }
        return; // Use cached status, skip API call
      }
    }
  } catch (e) {
    // Invalid cache, continue to API call
  }

  // No valid cache, make API call
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
      loginLink.href = `/pages/equipment.html`;
      loginLink.style.color = '#3ba55d';
      // Cache the logged-in status
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({
        status: 'logged_in',
        timestamp: Date.now()
      }));
    } else {
      loginLink.textContent = isEnglish ? ' Log In' : ' Logg Inn';
      loginLink.href = `/pages/login.html`;
      loginLink.style.color = '';
      // Cache the logged-out status
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({
        status: 'logged_out',
        timestamp: Date.now()
      }));
    }
  } catch (e) {
    loginLink.textContent = isEnglish ? ' Log In' : ' Logg Inn';
    loginLink.href = `/pages/login.html`;
    loginLink.style.color = '';
    // Don't cache errors, allow retry on next page
  }
}

// Scroll direction detection for header hide/show
function initializeScrollDirection() {
  const masthead = document.querySelector('.masthead');
  if (!masthead) return;

  let lastScrollY = window.scrollY;
  let ticking = false;
  const scrollThreshold = 5; // minimum scroll distance to trigger hide/show
  const topThreshold = 100; // pixels from top where header always shows

  function updateHeaderVisibility() {
    const currentScrollY = window.scrollY;
    const scrollDifference = currentScrollY - lastScrollY;

    // Add/remove scrolled class for background transitions
    if (currentScrollY > 50) {
      document.body.classList.add('scrolled');
    } else {
      document.body.classList.remove('scrolled');
    }

    // Always show header at the very top
    if (currentScrollY < topThreshold) {
      masthead.classList.remove('header-hidden');
      masthead.classList.add('at-top');
    } else {
      masthead.classList.remove('at-top');
      
      // Hide when scrolling down, show when scrolling up
      if (Math.abs(scrollDifference) > scrollThreshold) {
        if (scrollDifference > 0) {
          // Scrolling down - hide header
          masthead.classList.add('header-hidden');
        } else {
          // Scrolling up - show header
          masthead.classList.remove('header-hidden');
        }
      }
    }

    lastScrollY = currentScrollY;
    ticking = false;
  }

  function requestTick() {
    if (!ticking) {
      window.requestAnimationFrame(updateHeaderVisibility);
      ticking = true;
    }
  }

  // Listen for scroll events
  window.addEventListener('scroll', requestTick, { passive: true });
  
  // Initial check
  updateHeaderVisibility();
}


// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeHeader);
