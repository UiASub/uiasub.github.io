  import {
      Uppy,
      Dashboard,
      XHRUpload,
    } from 'https://releases.transloadit.com/uppy/v3.6.1/uppy.min.mjs'

  const SUPABASE_PROJECT_ID = 'iiauxyfisphubpsaffag'
  const STORAGE_BUCKET = 'Files'
  const SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`

  // Get access token from URL fragment or storage
  function getAccessToken() {
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
    return window.localStorage.getItem('access_token');
  }

  const accessToken = getAccessToken();
  if (!accessToken) {
    window.location.href = '/src/pages/login.html';
  }
  const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/discord-role-sync`;
  // Helper: call the Edge Function proxy for storage operations
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
      if (!res.ok) return { ok: false, status: res.status, error: json?.error || res.statusText, payload: json };
      return { ok: true, status: res.status, payload: json };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  }

  // === Uppy setup (XHR upload proxied through Edge Function for SSA) ===
  // We proxy uploads through the Edge Function so the service role key is never
  // exposed to the client. The Edge Function will accept multipart/form-data
  // and forward the file to Supabase Storage using the service role key.
  const uppy = new Uppy()
    .use(Dashboard, {
      inline: true,
      limit: 10,
      target: '#drag-drop-area',
      showProgressDetails: true,
    })
    // XHRUpload is used to POST the file to our Edge Function which will
    // proxy it to Supabase Storage. The `fieldName` is 'file'.
    .use(XHRUpload, {
      endpoint: EDGE_FUNCTION_URL,
      method: 'POST',
      formData: true,
      fieldName: 'file',
      bundle: true,
      headers: {
        // Include the user's access token so the Edge Function can validate
        // the user and their roles.
        Authorization: `Bearer ${accessToken}`,
      },
      // We attach the action and bucket via meta so the Edge Function can
      // route the request appropriately.
      allowedMetaFields: ['action', 'bucket', 'name']
    })

  // Before upload, set the required meta fields for each file
  uppy.on('upload', async (data) => {
    try {
      data.fileIDs.forEach(id => {
        const file = uppy.getFile(id)
        // action tells the edge function what to do
        uppy.setMeta({ action: 'upload_file', bucket: STORAGE_BUCKET, name: file.name })
      })
    } catch (e) {
      uppy.cancelAll()
      alert(e.message || 'Please sign in to upload.')
      throw e
    }
  })

  uppy.on('complete', (result) => {
    // result.successful contains uploaded files
    loadFiles()
  })

  let currentPage = 1
  let filesPerPage = 20
  let allFiles = []
  let filteredFiles = []
  let currentSort = 'created_at_desc'

  async function loadFiles(showLoading = true) {
    const fileListDiv = document.getElementById('file-list')
    const fileStats = document.getElementById('file-stats')
    if (showLoading) {
      fileListDiv.innerHTML = '<p style="color: #b5bac1; text-align: center;">Loading files...</p>'
    }
    try {
        // Use Edge Function to list files (server-side auth)
        const listRes = await callEdge('list_files', { bucket: STORAGE_BUCKET, prefix: '' });
      console.debug('list_files response', listRes);
      if (!listRes.ok) {
        throw new Error(listRes.error || `Storage API error: ${listRes.status}`)
      }
      // Prefer explicit `files` key returned by the Edge Function, then common shapes
      const data = listRes.payload?.files ?? listRes.payload?.data ?? listRes.payload?.rows ?? listRes.payload;
      if (Array.isArray(data)) {
        allFiles = data;
      } else if (Array.isArray(listRes.payload)) {
        // payload might itself be an array
        allFiles = listRes.payload;
      } else if (Array.isArray(data?.data)) {
        allFiles = data.data;
      } else {
        allFiles = [];
      }
      console.debug('parsed allFiles', allFiles);
      if (!allFiles || allFiles.length === 0) {
        fileListDiv.innerHTML = '<p style="color: #b5bac1; text-align: center;">No files uploaded yet.</p>'
        fileStats.innerHTML = ''
        return
      }
      applyFiltersAndSort()
      const totalSize = allFiles.reduce((sum, f) => sum + (f.metadata?.size || 0), 0)
      fileStats.innerHTML = `
        <div style="color: #b5bac1; font-size: 14px; margin-bottom: 16px;">
          <strong>${allFiles.length}</strong> files • 
          <strong>${(totalSize / 1024 / 1024).toFixed(2)} MB</strong> total
        </div>
      `
      await displayCurrentPage()
    } catch (error) {
      fileListDiv.innerHTML = `<p style="color: #f23f43; text-align: center;">Error loading files: ${error.message}</p>`
      fileStats.innerHTML = ''
    }
  }

  function applyFiltersAndSort() {
    const searchTerm = document.getElementById('searchFiles')?.value.toLowerCase() || ''
    filteredFiles = allFiles.filter(file => 
      file.name.toLowerCase().includes(searchTerm)
    )
    const [sortKey, sortOrder] = currentSort.split('_')
    filteredFiles.sort((a, b) => {
      let aVal = sortKey === 'name' ? a.name : a.created_at
      let bVal = sortKey === 'name' ? b.name : b.created_at
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })
    currentPage = 1
  }

  async function displayCurrentPage() {
    const fileListDiv = document.getElementById('file-list')
    const startIndex = (currentPage - 1) * filesPerPage
    const endIndex = startIndex + filesPerPage
    const pageFiles = filteredFiles.slice(startIndex, endIndex)
    if (pageFiles.length === 0) {
      fileListDiv.innerHTML = '<p style="color: #b5bac1; text-align: center;">No files match your search.</p>'
      updatePagination()
      return
    }
    // Generate signed URLs only for files on current page
    const filesWithUrls = await Promise.all(pageFiles.map(async (file) => {
      try {
        const signRes = await callEdge('sign_file', { bucket: STORAGE_BUCKET, file: file.name, expiresIn: 3600 });
        if (!signRes.ok) return null;
        const urlData = signRes.payload || signRes.payload?.data || signRes.payload;
        // Accept multiple possible key names from the Edge Function
        let signedString = urlData?.signedUrl ?? urlData?.signed_url ?? urlData?.signedURL ?? urlData?.url ?? urlData;
        if (typeof signedString === 'string' && signedString.startsWith('/')) {
          // Supabase may return a relative path like '/object/sign/...'. The correct full
          // path on the REST host is '/storage/v1/object/...'. Normalize that here.
          if (signedString.startsWith('/object/')) {
            signedString = SUPABASE_URL + '/storage/v1' + signedString;
          } else {
            signedString = SUPABASE_URL + signedString;
          }
        }
        return {
          ...file,
          signedUrl: signedString
        }
      } catch {
        return null;
      }
    }))
    fileListDiv.innerHTML = filesWithUrls.map(fileWithUrl => {
      if (!fileWithUrl) return ''
      const file = fileWithUrl
      const fileSize = file.metadata?.size ? `${(file.metadata.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown'
      const createdDate = new Date(file.created_at).toLocaleDateString()
      return `
        <div class="file-item">
          <div class="file-info">
            <div class="file-name">${escapeHtml(file.name)}</div>
            <div class="file-meta">${fileSize} • ${createdDate}</div>
          </div>
          <div class="file-actions">
            <button onclick="downloadFile('${escapeHtml(file.name)}')" class="btn-small btn-primary">Download</button>
            <button onclick="openShareModal('${escapeHtml(file.name)}')" class="btn-small btn-secondary">Share</button>
            <button onclick="deleteFile('${escapeHtml(file.name)}')" class="btn-small btn-danger">Delete</button>
          </div>
        </div>
      `
    }).join('')
    updatePagination()
  }

  function updatePagination() {
    const paginationDiv = document.getElementById('pagination')
    const totalPages = Math.ceil(filteredFiles.length / filesPerPage)
    if (totalPages <= 1) {
      paginationDiv.innerHTML = ''
      return
    }
    let paginationHTML = '<div class="pagination-controls">'
    paginationHTML += `<button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>← Prev</button>`
    const startPage = Math.max(1, currentPage - 2)
    const endPage = Math.min(totalPages, currentPage + 2)
    if (startPage > 1) {
      paginationHTML += `<button onclick="changePage(1)">1</button>`
      if (startPage > 2) paginationHTML += '<span>...</span>'
    }
    for (let i = startPage; i <= endPage; i++) {
      paginationHTML += `<button onclick="changePage(${i})" ${i === currentPage ? 'class="active"' : ''}>${i}</button>`
    }
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) paginationHTML += '<span>...</span>'
      paginationHTML += `<button onclick="changePage(${totalPages})">${totalPages}</button>`
    }
    paginationHTML += `<button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next →</button>`
    paginationHTML += '</div>'
    paginationDiv.innerHTML = paginationHTML
  }

  window.changePage = async (page) => {
    const totalPages = Math.ceil(filteredFiles.length / filesPerPage)
    if (page < 1 || page > totalPages) return
    currentPage = page
    await displayCurrentPage()
    document.getElementById('file-list-container').scrollIntoView({ behavior: 'smooth' })
  }

  function escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  window.downloadFile = async (fileName) => {
    try {
        // Use Edge Function to download file (server-side proxy)
        const dlRes = await callEdge('download_file', { bucket: STORAGE_BUCKET, file: fileName });
        if (!dlRes.ok) throw new Error(dlRes.error || 'Error downloading file');
    const data = dlRes.payload || dlRes.payload?.data || dlRes.payload;
  let signed = data?.signedUrl ?? data?.signed_url ?? data?.signedURL ?? data?.url ?? data;
  if (typeof signed === 'string' && signed.startsWith('/')) {
    if (signed.startsWith('/object/')) signed = SUPABASE_URL + '/storage/v1' + signed;
    else signed = SUPABASE_URL + signed;
  }
        if (!signed) throw new Error('No signed URL from server');
        const a = document.createElement('a')
        a.href = signed
        a.target = '_blank'
        a.click()
    } catch (error) {
      alert('Error downloading file: ' + error.message)
    }
  }

  window.openShareModal = (fileName) => {
    const modal = document.getElementById('shareModal')
    document.getElementById('shareFileName').textContent = fileName
    document.getElementById('shareFileName').dataset.filename = fileName
    document.getElementById('shareResult').innerHTML = ''
    modal.classList.add('active')
  }

  window.generateShareLink = async () => {
    const fileName = document.getElementById('shareFileName').dataset.filename
    const expiresIn = parseInt(document.getElementById('shareExpiry').value)
    try {
  const signRes = await callEdge('sign_file', { bucket: STORAGE_BUCKET, file: fileName, expiresIn });
  if (!signRes.ok) throw new Error(signRes.error || 'Error generating share link');
  const data = signRes.payload || signRes.payload?.data || signRes.payload;
  let signed = data?.signedUrl ?? data?.signed_url ?? data?.signedURL ?? data?.url ?? data;
      if (typeof signed === 'string' && signed.startsWith('/')) {
        if (signed.startsWith('/object/')) signed = SUPABASE_URL + '/storage/v1' + signed;
        else signed = SUPABASE_URL + signed;
      }
  await navigator.clipboard.writeText(signed)
      const expiryText = expiresIn >= 86400 
        ? `${expiresIn / 86400} day${expiresIn > 86400 ? 's' : ''}`
        : `${expiresIn / 3600} hour${expiresIn > 3600 ? 's' : ''}`
      document.getElementById('shareResult').innerHTML = `
        <div style="background: rgba(29, 209, 161, 0.15); border: 2px solid #1dd1a1; border-radius: 8px; padding: 16px; margin-top: 16px; color: #1dd1a1;">
          <strong>✓ Link copied to clipboard!</strong>
          <p style="margin: 8px 0 0 0; font-size: 14px; color: #b5bac1;">Expires in ${expiryText}</p>
          <div style="margin-top: 12px; padding: 8px; background: rgba(0, 0, 0, 0.3); border-radius: 4px; word-break: break-all; font-size: 12px; font-family: monospace;">
            ${data.signedUrl}
          </div>
        </div>
      `
    } catch (error) {
      document.getElementById('shareResult').innerHTML = `
        <div style="background: rgba(242, 63, 67, 0.15); border: 2px solid #f23f43; border-radius: 8px; padding: 16px; margin-top: 16px; color: #f23f43;">
          <strong>Error:</strong> ${error.message}
        </div>
      `
    }
  }

  window.closeShareModal = () => {
    document.getElementById('shareModal').classList.remove('active')
  }

  window.deleteFile = async (fileName) => {
    if (!confirm(`Are you sure you want to delete ${fileName}?`)) return
    try {
  const delRes = await callEdge('delete_file', { bucket: STORAGE_BUCKET, file: fileName });
      if (!delRes.ok) throw new Error(delRes.error || 'Error deleting file');
      alert('File deleted successfully!')
      loadFiles()
    } catch (error) {
      alert('Error deleting file: ' + error.message)
    }
  }

  function showAuthStatus(isAuthenticated, username = '') {
    const authBanner = document.getElementById('authStatus')
    const dragDropArea = document.getElementById('drag-drop-area')
    if (!isAuthenticated) {
      authBanner.innerHTML = `
        <div class="auth-warning">
          <strong>Not Signed In</strong>
          <p>You must sign in with Discord to upload files. <a href="/src/pages/login.html">Sign in here</a></p>
        </div>
      `
      authBanner.className = 'auth-banner warning'
      authBanner.style.display = 'block'
      if (dragDropArea) {
        dragDropArea.style.opacity = '0.5'
        dragDropArea.style.pointerEvents = 'none'
      }
    } else {
      authBanner.innerHTML = `
        <div class="auth-success">
          <strong>✓ Signed In</strong>
          ${username ? `<span style="font-size:14px;color:#b5bac1;">${escapeHtml(username)}</span>` : ''}
        </div>
      `
      authBanner.className = 'auth-banner success'
      authBanner.style.display = 'block'
      if (dragDropArea) {
        dragDropArea.style.opacity = '1'
        dragDropArea.style.pointerEvents = 'auto'
      }
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    if (!accessToken) {
      showAuthStatus(false)
      window.location.href = '/src/pages/login.html'
      return
    }
    // Verify token with Edge Function
    try {
      const res = await fetch('https://iiauxyfisphubpsaffag.supabase.co/functions/v1/discord-role-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ check: true })
      });
        const payload = await res.json().catch(() => null);
        console.debug('edge check payload', payload);
        // Try several places for a friendly display name
        let username = '';
        if (payload) {
          username = payload.name || (payload.row && payload.row.name) || payload.full_name || payload.email || (payload.user && payload.user.email) || '';
        }
      if (res.status === 200 && payload && payload.ok === true) {
        showAuthStatus(true, username)
        loadFiles()
      } else {
        showAuthStatus(false)
        document.body.innerHTML = '<div style="color:#f23f43;text-align:center;padding:32px;">Access denied: You do not have permission to view this page.<br><a href="/src/pages/login.html">Log in again</a></div>';
      }
    } catch (e) {
      showAuthStatus(false)
      document.body.innerHTML = '<div style="color:#f23f43;text-align:center;padding:32px;">Network error or authorization failed.<br><a href="/src/pages/login.html">Log in again</a></div>';
    }
    document.getElementById('refreshFiles')?.addEventListener('click', () => loadFiles())
    document.getElementById('searchFiles')?.addEventListener('input', (e) => {
      applyFiltersAndSort()
      displayCurrentPage()
    })
    document.getElementById('sortFiles')?.addEventListener('change', (e) => {
      currentSort = e.target.value
      applyFiltersAndSort()
      displayCurrentPage()
    })
  })