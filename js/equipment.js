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
    const data = res.data ?? [];
    displayEquipment(data || []);
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

// Display equipment: if rows include expanded schema render a table, otherwise show cards
function displayEquipment(equipment) {
  if (!equipment || equipment.length === 0) {
    equipmentList.innerHTML = '<div style="color:#b5bac1;text-align:center;padding:32px;">No equipment yet.</div>';
    return;
  }

  const esc = s => (s === null || s === undefined) ? '' : String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  // Detect expanded Supabase rows (objects with these keys)
  const expandedKeys = ['name','number','where','number_in_storage','loaned_to','description','loaned_at','created_at'];
  const isExpanded = equipment.every(it => it && typeof it === 'object' && expandedKeys.every(k => k in it || k === 'created_at'));

  if (isExpanded) {
    // render table with columns matching schema
    let html = '<table style="width:100%;border-collapse:collapse;color:#e6eaee;">';
    html += '<thead><tr>';
    const headers = ['name','number','where','number_in_storage','loaned_to','description','loaned_at','created_at'];
    headers.forEach(h => {
      html += `<th style="text-align:left;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.06);">${esc(h)}</th>`;
    });
    html += '<th style="text-align:left;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.06);">Actions</th>';
    html += '</tr></thead><tbody>';

    equipment.forEach(row => {
      html += '<tr>';
      const fmtDate = v => {
        if (!v) return '';
        const d = new Date(v);
        return isNaN(d.getTime()) ? esc(v) : esc(d.toLocaleString());
      };
      html += `<td style="padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.03);">${esc(row.name)}</td>`;
      html += `<td style="padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.03);">${esc(row.number)}</td>`;
      html += `<td style="padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.03);">${esc(row.where)}</td>`;
      html += `<td style="padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.03);">${esc(row.number_in_storage)}</td>`;
      html += `<td style="padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.03);">${esc(row.loaned_to)}</td>`;
      html += `<td style="padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.03);">${esc(row.description)}</td>`;
      html += `<td style="padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.03);">${fmtDate(row.loaned_at)}</td>`;
      html += `<td style="padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.03);">${fmtDate(row.created_at)}</td>`;
      // actions
      const id = row.id ?? '';
      const isLoaned = row.loaned_to && String(row.loaned_to).trim() !== '';
      let actions = '';
      if (id) {
        actions += isLoaned ? `<button class='btn-small btn-return' onclick='returnEquipment("${esc(id)}")'>Return</button> ` : `<button class='btn-small btn-assign' onclick='openAssignModal("${esc(id)}")'>Assign</button> `;
        actions += `<button class='btn-small btn-delete' onclick='deleteEquipment("${esc(id)}","${esc(row.name)}")'>Delete</button>`;
      }
      html += `<td style="padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.03);">${actions}</td>`;
      html += '</tr>';
    });

    html += '</tbody></table>';
    equipmentList.innerHTML = html;
    return;
  }

  // fallback: original card rendering
  equipmentList.innerHTML = equipment.map(item => {
    const isLoaned = item.loaned_to && item.loaned_to.trim() !== '';
    return `<div class="equipment-card ${isLoaned ? 'loaned':'available'}">
      <div class="equipment-name">${item.name}</div>
      ${item.description ? `<div style='color:#b5bac1;font-size:14px;'>${item.description}</div>` : ''}
      <div class="equipment-status">${isLoaned ? '🔴 Loaned Out':'🟢 Available'}</div>
      ${isLoaned ? `<div class='loaned-to'>👤 ${item.loaned_to}${item.loaned_at ? `<div style='font-size:12px;color:#949ba4;'>Since: ${new Date(item.loaned_at).toLocaleDateString()}</div>` : ''}</div>` : ''}
      <div class="equipment-actions">
        ${isLoaned ? `<button class='btn-small btn-return' onclick='returnEquipment("${item.id}")'>Return</button>` : `<button class='btn-small btn-assign' onclick='openAssignModal("${item.id}")'>Assign</button>`}
        <button class='btn-small btn-delete' onclick='deleteEquipment("${item.id}","${item.name}")'>Delete</button>
      </div>
    </div>`;
  }).join('');
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
  assignModal.classList.add('active');
};

// Close modal
cancelAssign.onclick = () => {
  assignModal.classList.remove('active');
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
  assignModal.classList.remove('active');
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

// Minimal startup
(async () => {
  managerBox.style.display = "block";
  setTimeout(() => managerBox.classList.add('show'), 50);
  userInfo.innerHTML = `<div style='background:rgba(43,45,49,0.8);padding:16px;border-radius:8px;margin:0 auto 24px;max-width:400px;color:#fff;text-align:center;'>Equipment Manager</div>`;
  loadEquipment();
})();
