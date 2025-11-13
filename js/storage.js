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
    window.location.href = '/pages/login.html';
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
      fileListDiv.innerHTML = '<p class="text-center text-white-50 py-4">Loading files...</p>'
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
        fileListDiv.innerHTML = '<p class="text-center text-white-50 py-4">No files uploaded yet.</p>'
        fileStats.innerHTML = ''
        return
      }
      applyFiltersAndSort()
      const totalSize = allFiles.reduce((sum, f) => sum + (f.metadata?.size || 0), 0)
      fileStats.innerHTML = `
        <div class="alert alert-info alert-sm mb-0 py-2">
          <small>
            <strong>${allFiles.length}</strong> files • 
            <strong>${(totalSize / 1024 / 1024).toFixed(2)} MB</strong> total
          </small>
        </div>
      `
      await displayCurrentPage()
    } catch (error) {
      fileListDiv.innerHTML = `<p class="text-center text-danger py-4">Error loading files: ${error.message}</p>`
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
      fileListDiv.innerHTML = '<p class="text-center text-white-50 py-4">No files match your search.</p>'
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
    
    // Render as Bootstrap table
    let html = '<table class="table table-sm table-dark table-hover mb-0">';
    html += '<thead class="table-secondary"><tr>';
    html += '<th class="small">File Name</th>';
    html += '<th class="small text-center d-none d-md-table-cell" style="width:120px;">Size</th>';
    html += '<th class="small text-center d-none d-lg-table-cell" style="width:140px;">Uploaded</th>';
    html += '<th class="small text-end" style="width:220px;">Actions</th>';
    html += '</tr></thead><tbody>';
    
    filesWithUrls.forEach(fileWithUrl => {
      if (!fileWithUrl) return;
      const file = fileWithUrl;
      const fileSize = file.metadata?.size ? `${(file.metadata.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown';
      const createdDate = new Date(file.created_at).toLocaleDateString();
      const fileExt = file.name.split('.').pop().toLowerCase();
      const fileType = getFileType(fileExt);
      
      html += '<tr>';
      html += '<td class="align-middle">';
      html += `<div class="d-flex align-items-center gap-2">`;
      html += `<span class="badge bg-secondary" style="width:45px;font-size:10px;">${fileType}</span>`;
      html += `<div>`;
      html += `<div class="fw-semibold text-white text-break">${escapeHtml(file.name)}</div>`;
      html += `<small class="text-white-50 d-md-none">${fileSize} • ${createdDate}</small>`;
      html += `</div></div></td>`;
      html += `<td class="align-middle text-center small text-white-50 d-none d-md-table-cell">${fileSize}</td>`;
      html += `<td class="align-middle text-center small text-white-50 d-none d-lg-table-cell">${createdDate}</td>`;
      html += '<td class="align-middle text-end">';
      html += '<div class="btn-group btn-group-sm" role="group">';
      html += `<button onclick="downloadFile('${escapeHtml(file.name)}')" class="btn btn-primary btn-sm" title="Download">Download</button>`;
      html += `<button onclick="openShareModal('${escapeHtml(file.name)}')" class="btn btn-info btn-sm" title="Share">Share</button>`;
      html += `<button onclick="deleteFile('${escapeHtml(file.name)}')" class="btn btn-danger btn-sm" title="Delete">Delete</button>`;
      html += '</div></td>';
      html += '</tr>';
    });
    
    html += '</tbody></table>';
    fileListDiv.innerHTML = html;
    updatePagination();
  }
  
  // Helper function to get file type badge text based on extension
  function getFileType(ext) {
    const types = {
      pdf: 'PDF', doc: 'DOC', docx: 'DOC', txt: 'TXT',
      jpg: 'IMG', jpeg: 'IMG', png: 'IMG', gif: 'IMG', svg: 'IMG', webp: 'IMG',
      mp4: 'VID', mov: 'VID', avi: 'VID', webm: 'VID',
      mp3: 'AUD', wav: 'AUD', ogg: 'AUD',
      zip: 'ZIP', rar: 'ZIP', '7z': 'ZIP', tar: 'ZIP', gz: 'ZIP',
      xls: 'XLS', xlsx: 'XLS', csv: 'CSV',
      ppt: 'PPT', pptx: 'PPT',
      html: 'HTML', css: 'CSS', js: 'JS', json: 'JSON', xml: 'XML',
      py: 'PY', java: 'JAVA', cpp: 'C++', c: 'C', sh: 'SH'
    };
    return types[ext] || 'FILE';
  }

  function updatePagination() {
    const paginationDiv = document.getElementById('pagination')
    const totalPages = Math.ceil(filteredFiles.length / filesPerPage)
    if (totalPages <= 1) {
      paginationDiv.innerHTML = ''
      return
    }
    
    // Bootstrap pagination
    let html = '<nav aria-label="File pagination"><ul class="pagination pagination-sm justify-content-center mb-0">';
    
    // Previous button
    html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">`;
    html += `<a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;" aria-label="Previous">`;
    html += '<span aria-hidden="true">&laquo;</span></a></li>';
    
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
    paginationDiv.innerHTML = html;
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
    document.getElementById('shareFileName').textContent = fileName
    document.getElementById('shareFileName').dataset.filename = fileName
    document.getElementById('shareResult').innerHTML = ''
    const modalEl = document.getElementById('shareModal')
    const modal = new bootstrap.Modal(modalEl)
    modal.show()
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
        <div class="alert alert-success alert-sm mb-0 mt-2">
          <strong>✓ Link copied to clipboard!</strong>
          <div class="small text-white-50 mt-1">Expires in ${expiryText}</div>
          <div class="mt-2 p-2 bg-black bg-opacity-25 rounded text-break small font-monospace">
            ${escapeHtml(signed)}
          </div>
        </div>
      `
    } catch (error) {
      document.getElementById('shareResult').innerHTML = `
        <div class="alert alert-danger alert-sm mb-0 mt-2">
          <strong>Error:</strong> ${escapeHtml(error.message)}
        </div>
      `
    }
  }

  window.closeShareModal = () => {
    const modalEl = document.getElementById('shareModal')
    const modal = bootstrap.Modal.getInstance(modalEl)
    if (modal) modal.hide()
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
        <div class="alert alert-warning alert-sm mb-0 py-2">
          <small><strong>Not Signed In</strong></small>
          <div class="small">You must sign in with Discord. <a href="/pages/login.html" class="alert-link">Sign in</a></div>
        </div>
      `
      authBanner.style.display = 'block'
      if (dragDropArea) {
        dragDropArea.style.opacity = '0.5'
        dragDropArea.style.pointerEvents = 'none'
      }
    } else {
      authBanner.innerHTML = `
        <div class="alert alert-success alert-sm mb-0 py-2">
          <small><strong>Signed In</strong></small>
          ${username ? `<div class="small text-truncate">${escapeHtml(username)}</div>` : ''}
        </div>
      `
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
      window.location.href = '/pages/login.html'
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
        document.body.innerHTML = '<div style="color:#f23f43;text-align:center;padding:32px;">Access denied: You do not have permission to view this page.<br><a href="/pages/login.html">Log in again</a></div>';
      }
    } catch (e) {
      showAuthStatus(false)
      document.body.innerHTML = '<div style="color:#f23f43;text-align:center;padding:32px;">Network error or authorization failed.<br><a href="/pages/login.html">Log in again</a></div>';
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