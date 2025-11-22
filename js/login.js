// Only keep strict OAuth redirect logic
const EDGE_FUNCTION_URL = "https://iiauxyfisphubpsaffag.supabase.co/functions/v1/discord-role-sync";
const errorMessage = document.getElementById("errorMessage");

// Small sanitizer to avoid injecting raw server text into HTML
function sanitize(text) {
  return String(text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function showError(message) {
  hideLoading(); // Hide loading when showing error
  if (!errorMessage) return;
  const safe = sanitize(message || "You don't have access to this site.");
  errorMessage.innerHTML = `
    <div style="max-width:760px;margin:16px auto;padding:16px;border-radius:10px;background:linear-gradient(180deg, rgba(34,34,34,0.75), rgba(10,10,10,0.7));border:1px solid rgba(242,63,67,0.25);box-shadow:0 6px 20px rgba(0,0,0,0.5);color:#ffffff;">
      <strong style="display:block;font-size:16px;margin-bottom:6px;color:#ffd6d8;">Access restricted</strong>
      <div style="font-size:14px;color:#e6eef6;line-height:1.4;">${safe}</div>
    </div>
  `;
  errorMessage.style.display = 'block';
}

function showLoading() {
  if (!errorMessage) return;
  errorMessage.innerHTML = `
    <div style="max-width:760px;margin:16px auto;padding:24px;border-radius:10px;background:linear-gradient(180deg, rgba(34,34,34,0.75), rgba(10,10,10,0.7));border:1px solid rgba(66,135,245,0.3);box-shadow:0 6px 20px rgba(0,0,0,0.5);color:#ffffff;text-align:center;">
      <div style="display:inline-block;width:40px;height:40px;border:4px solid rgba(66,135,245,0.3);border-top-color:#4287f5;border-radius:50%;animation:spin 1s linear infinite;margin-bottom:12px;"></div>
      <div style="font-size:16px;color:#e6eef6;">Authenticating with Discord...</div>
    </div>
    <style>
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    </style>
  `;
  errorMessage.style.display = 'block';
}

function hideLoading() {
  if (!errorMessage) return;
  errorMessage.innerHTML = '';
  errorMessage.style.display = 'none';
}
// Supabase Discord OAuth login

// Process OAuth redirect - can be called even if not on login page
function processOAuthRedirect() {
  const hash = window.location.hash;
  if (hash && hash.includes('access_token')) {
    const params = new URLSearchParams(hash.slice(1));
    const accessToken = params.get('access_token');
    if (accessToken) {
      showLoading(); // Show loading during authorization
      // 1) Role check
      fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ check: true })
      })
        .then(res => res.json().catch(() => null))
        .then(async rolePayload => {
          if (!rolePayload || rolePayload.ok !== true) {
            // Not authorized for role
            window.localStorage.removeItem('access_token');
            window.location.hash = '';
            const msg = rolePayload && rolePayload.error ? `Access Denied: ${rolePayload.error}` : "You don't have access to this site.";
            showError(msg);
            return;
          }

          // 2) Minimal table access check - attempt to list equipment via Edge Function
          try {
            const tableRes = await fetch(EDGE_FUNCTION_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
              },
              body: JSON.stringify({ action: 'get_equipment', payload: {} })
            });
            const tablePayload = await tableRes.json().catch(() => null);
            if (!tableRes.ok || !tablePayload || tablePayload.error) {
              // Forbidden to access tables
              window.localStorage.removeItem('access_token');
              window.location.hash = '';
              const msg = tablePayload && tablePayload.error ? `Access Denied: ${tablePayload.error}` : "You don't have access to this site.";
              showError(msg);
              return;
            }

            // Both checks passed — save token and redirect
            window.localStorage.setItem('access_token', accessToken);
            window.location.hash = '';
            window.location.href = '/pages/equipment.html';
          } catch (e) {
            window.localStorage.removeItem('access_token');
            window.location.hash = '';
            showError('Authorization table access check failed. Try again later.');
          }
        })
        .catch(() => {
          window.localStorage.removeItem('access_token');
          window.location.hash = '';
          showError('Authorization check failed (network/CORS). Try again or contact the admins.');
        });
    }
  }
}

const loginBtn = document.getElementById("loginBtn");

// Exit early if we're not on the login page
if (!loginBtn) {
  console.debug('login.js: Not on login page, skipping initialization');
  // Still process OAuth redirect if present
  processOAuthRedirect();
} else {
  // Show error if redirected with ?error=unauthorized
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('error') === 'unauthorized' && errorMessage) {
    errorMessage.innerHTML = `<div style="background: rgba(242, 63, 67, 0.15); border: 2px solid #f23f43; border-radius: 8px; padding: 16px; margin: 16px 0; color: #f23f43; text-align: left;"><strong style="display: block; margin-bottom: 8px;">Access Denied</strong><span style="font-size: 14px; color: #dbdee1;">You don't have the required Discord role to access this area. Please contact UiASub leadership if you believe this is an error.</span></div>`;
    errorMessage.style.display = 'block';
  }

  // Discord OAuth login button
  loginBtn.onclick = () => {
    showLoading(); // Show loading immediately
    const redirectTo = window.location.origin + '/pages/login.html';
    const oauthUrl = `https://iiauxyfisphubpsaffag.supabase.co/auth/v1/authorize?provider=discord&redirect_to=${encodeURIComponent(redirectTo)}`;
    console.log('OAuth Flow Starting:', {
      redirectTo,
      oauthUrl
    });
    window.location.href = oauthUrl;
  };

  // Also process OAuth redirects on the login page
  processOAuthRedirect();
}
