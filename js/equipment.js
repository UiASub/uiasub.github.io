// Equipment manager using server-side auth only
const SUPABASE_URL = "https://iiauxyfisphubpsaffag.supabase.co";
const EDGE_FUNCTION_URL = "https://iiauxyfisphubpsaffag.supabase.co/functions/v1/discord-role-sync";

// Get access token from URL fragment or storage
function getAccessToken() {
  // Try hash first (after login)
  const hash = window.location.hash;
  if (hash && hash.includes('access_token')) {
    const params = new URLSearchParams(hash.slice(1));
    const token = params.get('access_token');
    if (token) {
      window.localStorage.setItem('access_token', token);
      window.location.hash = '';
      return token;
    }
  }
  // Try localStorage
  return window.localStorage.getItem('access_token');
}

// Render the current page of equipment
async function displayCurrentPage() {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageEquipment = filteredEquipment.slice(startIndex, endIndex);
  if (!pageEquipment || pageEquipment.length === 0) {
    equipmentList.innerHTML = '<div style="color:#b5bac1;text-align:center;padding:32px;">No equipment found.</div>';
    updatePagination();
    return;
  }
  const html = displayEquipment(pageEquipment);
  equipmentList.innerHTML = html;
  updatePagination();
}

function updatePagination() {
  let container = document.getElementById('pagination');
  if (!container) {
    container = document.createElement('div');
    container.id = 'pagination';
    if (equipmentList && equipmentList.parentNode) {
      equipmentList.parentNode.insertBefore(container, equipmentList.nextSibling);
    }
  }
  const totalPages = Math.ceil(filteredEquipment.length / itemsPerPage) || 1;
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }
  
  // Bootstrap pagination
  let html = '<nav aria-label="Equipment pagination"><ul class="pagination pagination-sm justify-content-center mb-0">';
  
  // Previous button
  html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">`;
  html += `<a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;" aria-label="Previous">`;
  html += '<span aria-hidden="true">&laquo;</span></a></li>';
  
  // Page numbers
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  
  if (startPage > 1) {
    html += `<li class="page-item"><a class="page-link" href="#" onclick="changePage(1); return false;">1</a></li>`;
    if (startPage > 2) html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
  }
  
  for (let i = startPage; i <= endPage; i++) {
    html += `<li class="page-item ${i === currentPage ? 'active' : ''}">`;
    html += `<a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a></li>`;
  }
  
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    html += `<li class="page-item"><a class="page-link" href="#" onclick="changePage(${totalPages}); return false;">${totalPages}</a></li>`;
  }
  
  // Next button
  html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">`;
  html += `<a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;" aria-label="Next">`;
  html += '<span aria-hidden="true">&raquo;</span></a></li>';
  
  html += '</ul></nav>';
  container.innerHTML = html;
}

window.changePage = async (page) => {
  const totalPages = Math.ceil(filteredEquipment.length / itemsPerPage) || 1;
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  await displayCurrentPage();
  if (document.getElementById('equipmentList')) {
    document.getElementById('equipmentList').scrollIntoView({ behavior: 'smooth' });
  }
}

const accessToken = getAccessToken();
if (!accessToken) {
  window.location.href = '/pages/login.html';
}

const logoutBtn = document.getElementById("logout");
const managerBox = document.getElementById("managerBox");
const userInfo = document.getElementById("userInfo");
const equipmentList = document.getElementById("equipmentList");
const addEquipmentBtn = document.getElementById("addEquipmentBtn");
const newEquipmentName = document.getElementById("newEquipmentName");
const newEquipmentDesc = document.getElementById("newEquipmentDesc");
const newEquipmentNumber = document.getElementById("newEquipmentNumber");
const newEquipmentWhere = document.getElementById("newEquipmentWhere");
const newEquipmentNumberInStorage = document.getElementById("newEquipmentNumberInStorage");
const assignModal = document.getElementById("assignModal");
const assignUserName = document.getElementById("assignUserName");
const cancelAssign = document.getElementById("cancelAssign");
const confirmAssign = document.getElementById("confirmAssign");
let currentEquipmentId = null;

// Pagination / data state (module-level)
let currentPage = 1;
let itemsPerPage = 20;
let allEquipment = [];
let filteredEquipment = [];

logoutBtn.onclick = () => {
  window.localStorage.removeItem('access_token');
  window.location.href = '/pages/login.html';
};


async function loadEquipment() {
  equipmentList.innerHTML = '<div style="color:#b5bac1;text-align:center;padding:32px;">Loading...</div>';
  try {
    // Use server-side Edge Function proxy to fetch equipment (Server-Side Auth)
    const res = await callEdge('get_equipment', {});
    if (!res.ok) throw new Error(res.error || 'Failed to load equipment');
    // Normalize response shapes (accept multiple possible payload shapes similar to storage.js)
    let data = [];
    if (Array.isArray(res.data)) {
      data = res.data;
    } else if (Array.isArray(res.rows)) {
      data = res.rows;
    } else if (Array.isArray(res.payload?.data)) {
      data = res.payload.data;
    } else if (Array.isArray(res.payload?.rows)) {
      data = res.payload.rows;
    } else if (Array.isArray(res.payload)) {
      data = res.payload;
    } else if (Array.isArray(res)) {
      data = res;
    } else {
      data = [];
    }
    allEquipment = Array.isArray(data) ? data : [];
    filteredEquipment = allEquipment.slice();
    currentPage = 1;
    await displayCurrentPage();
  } catch (e) {
    equipmentList.innerHTML = `<div style='color:#f23f43;'>Error: ${e.message}</div>`;
  }
}

// Helper: call the Edge Function which performs server-side requests using the
// service role key. This keeps secrets off the client and implements SSA.
async function callEdge(action, payload = {}) {
  try {
    const res = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ action, payload })
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, status: res.status, error: json?.error || res.statusText };
    return { ok: true, status: res.status, ...json };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// Show authentication status in the auth banner (equipment.html has #authStatus)
function showAuthStatus(isAuthenticated, username = '') {
  const authBanner = document.getElementById('authStatus');
  if (!authBanner) return;
  if (!isAuthenticated) {
    authBanner.innerHTML = `
      <div class="alert alert-warning alert-sm mb-0 py-2">
        <small><strong>Not Signed In</strong></small>
        <div class="small">You must sign in with Discord. <a href="/pages/login.html" class="alert-link">Sign in</a></div>
      </div>
    `;
    authBanner.style.display = 'block';
    return;
  }
  authBanner.innerHTML = `
    <div class="alert alert-success alert-sm mb-0 py-2">
      <small><strong>Signed In</strong></small>
      ${username ? `<div class="small text-truncate">${escapeHtml(username)}</div>` : ''}
    </div>
  `;
  authBanner.style.display = 'block';
}

// Simple HTML escape helper (same as storage.js)
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

// Display equipment: if rows include expanded schema render a table, otherwise show cards
function displayEquipment(equipment) {
  if (!equipment || equipment.length === 0) {
    return '<div class="text-center text-white-50 py-4">No equipment yet.</div>';
  }

  const esc = s => escapeHtml(s === null || s === undefined ? '' : String(s));

  // Always render as compact Bootstrap table
  let html = '<table class="table table-sm table-dark table-hover mb-0">';
  html += '<thead class="table-secondary"><tr>';
  html += '<th class="small">Name</th>';
  html += '<th class="small d-none d-md-table-cell">Description</th>';
  html += '<th class="small text-center" style="width:80px;">Total</th>';
  html += '<th class="small text-center" style="width:80px;">In Stock</th>';
  html += '<th class="small d-none d-lg-table-cell">Location</th>';
  html += '<th class="small">Status</th>';
  html += '<th class="small text-end" style="width:140px;">Actions</th>';
  html += '</tr></thead><tbody>';

  equipment.forEach(row => {
    const isLoaned = row.loaned_to && String(row.loaned_to).trim() !== '';
    const statusClass = isLoaned ? 'text-danger' : 'text-success';
    const statusBadge = isLoaned 
      ? '<span class="badge bg-danger">Loaned</span>' 
      : '<span class="badge bg-success">Available</span>';
    
    html += '<tr>';
    
    // Name (with description on mobile as subtitle)
    html += '<td class="align-middle">';
    html += `<div class="fw-semibold text-white">${esc(row.name)}</div>`;
    if (row.description) {
      html += `<small class="text-white-50 d-md-none">${esc(row.description)}</small>`;
    }
    if (isLoaned) {
      html += `<small class="text-white-50 d-block">Loaned to: ${esc(row.loaned_to)}</small>`;
    }
    html += '</td>';
    
    // Description (desktop only)
    html += `<td class="align-middle small text-white-50 d-none d-md-table-cell">${esc(row.description)}</td>`;
    
    // Total quantity
    html += `<td class="align-middle text-center">${esc(row.number ?? '-')}</td>`;
    
    // In storage (with color coding)
    const inStock = Number(row.number_in_storage ?? 0);
    const stockClass = inStock === 0 ? 'text-danger' : inStock <= 2 ? 'text-warning' : 'text-success';
    html += `<td class="align-middle text-center ${stockClass} fw-bold">${esc(row.number_in_storage ?? '-')}</td>`;
    
    // Location (desktop only)
    html += `<td class="align-middle small text-white-50 d-none d-lg-table-cell">${esc(row.where ?? '-')}</td>`;
    
    // Status
    html += `<td class="align-middle">${statusBadge}</td>`;
    
    // Actions
    const id = row.id ?? '';
    html += '<td class="align-middle text-end">';
    html += '<div class="btn-group btn-group-sm" role="group">';
    if (id) {
      if (isLoaned) {
        html += `<button class="btn btn-success btn-sm" onclick='returnEquipment("${esc(id)}")' title="Return">Return</button>`;
      } else {
        html += `<button class="btn btn-primary btn-sm" onclick='openAssignModal("${esc(id)}")' title="Assign">Assign</button>`;
      }
      html += `<button class="btn btn-danger btn-sm" onclick='deleteEquipment("${esc(id)}","${esc(row.name)}")' title="Delete">Delete</button>`;
    }
    html += '</div></td>';
    
    html += '</tr>';
  });

  html += '</tbody></table>';
  return html;
}

// Add new equipment
addEquipmentBtn.onclick = async () => {
  const name = newEquipmentName.value.trim();
  if (!name) return alert('Enter equipment name');
  try {
    const payload = {
      name,
      description: newEquipmentDesc.value.trim() || null
    };
    const num = newEquipmentNumber && newEquipmentNumber.value ? Number(newEquipmentNumber.value) : null;
    if (num !== null && !isNaN(num)) payload.number = num;
    if (newEquipmentWhere && newEquipmentWhere.value.trim()) payload.where = newEquipmentWhere.value.trim();
    const nis = newEquipmentNumberInStorage && newEquipmentNumberInStorage.value ? Number(newEquipmentNumberInStorage.value) : null;
    if (nis !== null && !isNaN(nis)) payload.number_in_storage = nis;

    const res = await callEdge('add_equipment', payload);
    if (!res.ok) throw new Error(res.error || 'Failed to add equipment');
  } catch (e) {
    alert(e.message);
  }
  newEquipmentName.value = '';
  newEquipmentDesc.value = '';
  if (newEquipmentNumber) newEquipmentNumber.value = '';
  if (newEquipmentWhere) newEquipmentWhere.value = '';
  if (newEquipmentNumberInStorage) newEquipmentNumberInStorage.value = '';
  loadEquipment();
};

// Open assign modal
window.openAssignModal = equipmentId => {
  currentEquipmentId = equipmentId;
  assignUserName.value = '';
  // Use Bootstrap 5 modal API
  const modalEl = document.getElementById('assignModal');
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
};

// Close modal
cancelAssign.onclick = () => {
  const modalEl = document.getElementById('assignModal');
  const modal = bootstrap.Modal.getInstance(modalEl);
  if (modal) modal.hide();
  currentEquipmentId = null;
};

confirmAssign.onclick = async () => {
  const userName = assignUserName.value.trim();
  if (!userName) return alert('Enter username');
  try {
    const res = await callEdge('assign_equipment', {
      id: currentEquipmentId,
      loaned_to: userName
    });
    if (!res.ok) throw new Error(res.error || 'Failed to assign equipment');
  } catch (e) {
    alert(e.message);
  }
  const modalEl = document.getElementById('assignModal');
  const modal = bootstrap.Modal.getInstance(modalEl);
  if (modal) modal.hide();
  currentEquipmentId = null;
  loadEquipment();
};

// Return equipment
window.returnEquipment = async equipmentId => {
  if (!confirm('Mark as returned?')) return;
  try {
    const res = await callEdge('return_equipment', { id: equipmentId });
    if (!res.ok) throw new Error(res.error || 'Failed to return equipment');
  } catch (e) {
    alert(e.message);
  }
  loadEquipment();
};

// Delete equipment
window.deleteEquipment = async (equipmentId, equipmentName) => {
  if (!confirm(`Delete "${equipmentName}"?`)) return;
  try {
    const res = await callEdge('delete_equipment', { id: equipmentId });
    if (!res.ok) throw new Error(res.error || 'Failed to delete equipment');
  } catch (e) {
    alert(e.message);
  }
  loadEquipment();
};

// Startup: verify auth with Edge Function and show auth banner, then load equipment
document.addEventListener('DOMContentLoaded', async () => {
  if (managerBox) {
    managerBox.style.display = 'block';
    setTimeout(() => managerBox.classList.add('show'), 50);
  }
  if (!accessToken) {
    showAuthStatus(false);
    window.location.href = '/pages/login.html';
    return;
  }
  try {
    const res = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ check: true })
    });
    const payload = await res.json().catch(() => null);
    let username = '';
    if (payload) {
      username = payload.name || (payload.row && payload.row.name) || payload.full_name || payload.email || (payload.user && payload.user.email) || '';
    }
    if (res.status === 200 && payload && payload.ok === true) {
      showAuthStatus(true, username);
      await loadEquipment();
    } else {
      showAuthStatus(false);
      document.body.innerHTML = '<div style="color:#f23f43;text-align:center;padding:32px;">Access denied: You do not have permission to view this page.<br><a href="/pages/login.html">Log in again</a></div>';
    }
  } catch (e) {
    showAuthStatus(false);
    document.body.innerHTML = '<div style="color:#f23f43;text-align:center;padding:32px;">Network error or authorization failed.<br><a href="/pages/login.html">Log in again</a></div>';
  }
});
