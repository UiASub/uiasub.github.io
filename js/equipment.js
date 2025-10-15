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
  window.location.href = '/src/pages/login.html';
}

const logoutBtn = document.getElementById("logout");
const managerBox = document.getElementById("managerBox");
const userInfo = document.getElementById("userInfo");
const equipmentList = document.getElementById("equipmentList");
const addEquipmentBtn = document.getElementById("addEquipmentBtn");
const newEquipmentName = document.getElementById("newEquipmentName");
const newEquipmentDesc = document.getElementById("newEquipmentDesc");
const assignModal = document.getElementById("assignModal");
const assignUserName = document.getElementById("assignUserName");
const cancelAssign = document.getElementById("cancelAssign");
const confirmAssign = document.getElementById("confirmAssign");
let currentEquipmentId = null;

logoutBtn.onclick = () => {
  window.localStorage.removeItem('access_token');
  window.location.href = '/src/pages/login.html';
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

// Display equipment cards
function displayEquipment(equipment) {
  equipmentList.innerHTML = equipment.length === 0
    ? '<div style="color:#b5bac1;text-align:center;padding:32px;">No equipment yet.</div>'
    : equipment.map(item => {
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
    const res = await callEdge('add_equipment', {
      name,
      description: newEquipmentDesc.value.trim() || null
    });
    if (!res.ok) throw new Error(res.error || 'Failed to add equipment');
  } catch (e) {
    alert(e.message);
  }
  newEquipmentName.value = '';
  newEquipmentDesc.value = '';
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
