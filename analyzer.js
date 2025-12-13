// HAR Analyzer

const uploadArea = document.getElementById('uploadArea');
const uploadBox = document.getElementById('uploadBox');
const fileInput = document.getElementById('fileInput');
const loadFileBtn = document.getElementById('loadFileBtn');
const sessionReplayBtn = document.getElementById('sessionReplayBtn');
const mainContent = document.getElementById('mainContent');
const requestList = document.getElementById('requestList');
const detailPanel = document.getElementById('detailPanel');
const searchBox = document.getElementById('searchBox');
const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');
const exportFilteredBtn = document.getElementById('exportFilteredBtn');
const statsBar = document.getElementById('statsBar');
const totalRequests = document.getElementById('totalRequests');
const filteredRequests = document.getElementById('filteredRequests');
const totalSize = document.getElementById('totalSize');
const totalTime = document.getElementById('totalTime');

let harData = null;
let entries = [];
let selectedEntry = null;
let searchTerm = '';

// File upload handlers
uploadBox.addEventListener('click', () => fileInput.click());
loadFileBtn.addEventListener('click', () => fileInput.click());

// Session replay button
sessionReplayBtn.addEventListener('click', () => {
  chrome.windows.create({
    url: 'replay.html',
    type: 'popup',
    width: 1200,
    height: 800
  });
});

uploadBox.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadBox.classList.add('dragover');
});

uploadBox.addEventListener('dragleave', () => {
  uploadBox.classList.remove('dragover');
});

uploadBox.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadBox.classList.remove('dragover');
  
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    loadHARFile(files[0]);
  }
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    loadHARFile(e.target.files[0]);
  }
});

// Search handlers
searchInput.addEventListener('input', (e) => {
  searchTerm = e.target.value.toLowerCase();
  clearSearch.classList.toggle('visible', searchTerm.length > 0);
  performSearch();
});

clearSearch.addEventListener('click', () => {
  searchInput.value = '';
  searchTerm = '';
  clearSearch.classList.remove('visible');
  performSearch();
});

// Export filtered
exportFilteredBtn.addEventListener('click', () => {
  exportFiltered();
});

// Load HAR file
function loadHARFile(file) {
  const reader = new FileReader();
  
  reader.onload = (e) => {
    try {
      harData = JSON.parse(e.target.result);
      
      if (!harData.log || !harData.log.entries) {
        alert('Invalid HAR file format');
        return;
      }
      
      entries = harData.log.entries;
      
      // Show main interface
      uploadArea.style.display = 'none';
      mainContent.style.display = 'flex';
      searchBox.style.display = 'block';
      sessionReplayBtn.style.display = 'block';
      exportFilteredBtn.style.display = 'block';
      statsBar.style.display = 'flex';
      
      // Display entries
      displayEntries();
      updateStats();
      
    } catch (error) {
      alert('Error parsing HAR file: ' + error.message);
    }
  };
  
  reader.readAsText(file);
}

// Display entries in list
function displayEntries() {
  requestList.innerHTML = '';
  
  entries.forEach((entry, index) => {
    const item = document.createElement('div');
    item.className = 'request-item';
    item.dataset.index = index;
    
    const method = entry.request.method || 'GET';
    const url = entry.request.url || '';
    const status = entry.response.status || 0;
    
    let statusClass = '';
    if (status >= 200 && status < 300) statusClass = 'success';
    else if (status >= 400) statusClass = 'error';
    
    item.innerHTML = 
      '<div><span class="request-method ' + method + '">' + method + '</span></div>' +
      '<div class="request-url">' + escapeHtml(url) + '</div>' +
      '<div class="request-status ' + statusClass + '">Status: ' + status + '</div>';
    
    item.addEventListener('click', () => selectEntry(index));
    
    requestList.appendChild(item);
  });
}

// Select an entry
function selectEntry(index) {
  selectedEntry = entries[index];
  
  // Update selection UI
  document.querySelectorAll('.request-item').forEach((item, i) => {
    item.classList.toggle('selected', i === index);
  });
  
  // Display details
  displayEntryDetails(selectedEntry);
}

// Display entry details
function displayEntryDetails(entry) {
  const tabs = ['General', 'Request Headers', 'Response Headers', 'Request Body', 'Response Body', 'Cookies', 'Timing'];
  
  let html = '<div class="tabs">';
  tabs.forEach((tab, i) => {
    html += '<button class="tab' + (i === 0 ? ' active' : '') + '" data-tab="' + i + '">' + tab + '</button>';
  });
  html += '</div>';
  
  // Tab contents
  html += '<div class="tab-content active" data-content="0">' + getGeneralTab(entry) + '</div>';
  html += '<div class="tab-content" data-content="1">' + getHeadersTab(entry.request.headers) + '</div>';
  html += '<div class="tab-content" data-content="2">' + getHeadersTab(entry.response.headers) + '</div>';
  html += '<div class="tab-content" data-content="3">' + getRequestBodyTab(entry) + '</div>';
  html += '<div class="tab-content" data-content="4">' + getResponseBodyTab(entry) + '</div>';
  html += '<div class="tab-content" data-content="5">' + getCookiesTab(entry) + '</div>';
  html += '<div class="tab-content" data-content="6">' + getTimingTab(entry) + '</div>';
  
  detailPanel.innerHTML = html;
  
  // Add tab click handlers
  detailPanel.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const tabIndex = e.target.dataset.tab;
      
      detailPanel.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      detailPanel.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      e.target.classList.add('active');
      detailPanel.querySelector('[data-content="' + tabIndex + '"]').classList.add('active');
    });
  });
}

// Tab content generators
function getGeneralTab(entry) {
  let html = '<div class="detail-section">';
  html += '<div class="detail-row"><div class="detail-label">URL</div><div class="detail-value">' + escapeHtml(entry.request.url) + '</div></div>';
  html += '<div class="detail-row"><div class="detail-label">Method</div><div class="detail-value">' + entry.request.method + '</div></div>';
  html += '<div class="detail-row"><div class="detail-label">Status</div><div class="detail-value">' + entry.response.status + ' ' + entry.response.statusText + '</div></div>';
  html += '<div class="detail-row"><div class="detail-label">Protocol</div><div class="detail-value">' + (entry.response.httpVersion || 'HTTP/1.1') + '</div></div>';
  
  if (entry.response.content.compression) {
    html += '<div class="detail-row"><div class="detail-label">Content Encoding</div><div class="detail-value">' + entry.response.content.compression + '</div></div>';
  }
  
  if (entry.response.content.encoding === 'base64') {
    html += '<div class="detail-row"><div class="detail-label">Response Encoding</div><div class="detail-value">Base64 (binary content)</div></div>';
  }
  
  html += '<div class="detail-row"><div class="detail-label">MIME Type</div><div class="detail-value">' + (entry.response.content.mimeType || 'unknown') + '</div></div>';
  html += '<div class="detail-row"><div class="detail-label">Started</div><div class="detail-value">' + entry.startedDateTime + '</div></div>';
  html += '<div class="detail-row"><div class="detail-label">Time</div><div class="detail-value">' + Math.round(entry.time) + ' ms</div></div>';
  html += '<div class="detail-row"><div class="detail-label">Size</div><div class="detail-value">' + formatBytes(entry.response.content.size || 0) + '</div></div>';
  
  if (entry.request.postData) {
    html += '<div class="detail-row"><div class="detail-label">Request Body Size</div><div class="detail-value">' + formatBytes(entry.request.bodySize || 0) + '</div></div>';
    html += '<div class="detail-row"><div class="detail-label">Request Content-Type</div><div class="detail-value">' + escapeHtml(entry.request.postData.mimeType || 'unknown') + '</div></div>';
  }
  
  if (entry.serverIPAddress) {
    html += '<div class="detail-row"><div class="detail-label">Server IP</div><div class="detail-value">' + entry.serverIPAddress + '</div></div>';
  }
  
  if (entry._resourceType) {
    html += '<div class="detail-row"><div class="detail-label">Resource Type</div><div class="detail-value">' + entry._resourceType + '</div></div>';
  }
  
  if (entry._priority) {
    html += '<div class="detail-row"><div class="detail-label">Priority</div><div class="detail-value">' + entry._priority + '</div></div>';
  }
  
  if (entry._error) {
    html += '<div class="detail-row"><div class="detail-label">Error</div><div class="detail-value" style="color: #d93025;">' + escapeHtml(entry._error) + '</div></div>';
  }
  
  if (entry._canceled) {
    html += '<div class="detail-row"><div class="detail-label">Canceled</div><div class="detail-value">Yes</div></div>';
  }
  
  html += '</div>';
  return html;
}

function getHeadersTab(headers) {
  let html = '<div class="detail-section">';
  if (headers && headers.length > 0) {
    headers.forEach(header => {
      html += '<div class="detail-row"><div class="detail-label">' + escapeHtml(header.name) + '</div><div class="detail-value">' + escapeHtml(header.value) + '</div></div>';
    });
  } else {
    html += '<div>No headers</div>';
  }
  html += '</div>';
  return html;
}

function getRequestBodyTab(entry) {
  if (entry.request.postData && entry.request.postData.text) {
    let body = entry.request.postData.text;
    const mimeType = entry.request.postData.mimeType || '';
    
    // Check if it's binary data indicator
    if (body.includes('[Binary or unavailable POST data]')) {
      return '<div style="padding: 12px; color: #5f6368;">Binary POST data (not captured)</div>';
    }
    
    // Try to format JSON
    if (mimeType.includes('json')) {
      try {
        const json = JSON.parse(body);
        body = JSON.stringify(json, null, 2);
      } catch (e) {
        // Not JSON, use as-is
      }
    }
    
    // Show info for multipart
    if (mimeType.includes('multipart')) {
      const lines = body.split('\n');
      const preview = lines.slice(0, 50).join('\n');
      return '<div style="padding: 12px; margin-bottom: 12px; background: #e8f0fe; border-left: 3px solid #1a73e8;">' +
             '<strong>Multipart Form Data</strong><br>' +
             'Content-Type: ' + escapeHtml(mimeType) + '<br>' +
             'Size: ' + formatBytes(body.length) + 
             (lines.length > 50 ? ' (showing first 50 lines)' : '') +
             '</div>' +
             '<div class="code-block">' + escapeHtml(preview) + 
             (lines.length > 50 ? '\n\n... ' + (lines.length - 50) + ' more lines ...' : '') +
             '</div>';
    }
    
    return '<div class="code-block">' + escapeHtml(body) + '</div>';
  }
  
  return '<div style="padding: 12px; color: #5f6368;">No request body</div>';
}

function getResponseBodyTab(entry) {
  if (entry.response.content && entry.response.content.text) {
    let body = entry.response.content.text;
    const mimeType = entry.response.content.mimeType || '';
    const encoding = entry.response.content.encoding;
    const compression = entry.response.content.compression;
    
    // Check if base64 encoded
    if (encoding === 'base64') {
      const size = formatBytes(body.length);
      return '<div style="padding: 12px; background: #fef7e0; border-left: 3px solid #fbbc04;">' +
             '<strong>Binary Content (Base64 Encoded)</strong><br>' +
             'MIME Type: ' + escapeHtml(mimeType) + '<br>' +
             'Encoded Size: ' + size + '<br>' +
             (compression ? 'Compression: ' + compression + '<br>' : '') +
             '</div>' +
             '<div style="padding: 12px; margin-top: 12px;">' +
             '<button onclick="decodeBase64()" style="padding: 6px 12px; background: #1a73e8; color: white; border: none; border-radius: 4px; cursor: pointer;">Decode as Text</button> ' +
             '<button onclick="downloadBinary()" style="padding: 6px 12px; background: #1a73e8; color: white; border: none; border-radius: 4px; cursor: pointer;">Download Binary</button>' +
             '</div>' +
             '<div class="code-block" style="max-height: 200px;">' + escapeHtml(body.substring(0, 500)) + 
             (body.length > 500 ? '... (truncated, ' + formatBytes(body.length) + ' total)' : '') +
             '</div>';
    }
    
    // Show compression info
    let infoBox = '';
    if (compression) {
      infoBox = '<div style="padding: 8px 12px; margin-bottom: 12px; background: #e8f0fe; border-left: 3px solid #1a73e8;">' +
                'Compression: ' + compression + ' (showing decoded content)' +
                '</div>';
    }
    
    // Try to format JSON
    if (mimeType.includes('json')) {
      try {
        const json = JSON.parse(body);
        body = JSON.stringify(json, null, 2);
      } catch (e) {
        // Not valid JSON
      }
    }
    
    // Truncate very large responses
    if (body.length > 100000) {
      body = body.substring(0, 100000) + '\n\n... (truncated, total size: ' + formatBytes(body.length) + ')';
    }
    
    return infoBox + '<div class="code-block">' + escapeHtml(body) + '</div>';
  }
  
  return '<div style="padding: 12px; color: #5f6368;">No response body</div>';
}

function getCookiesTab(entry) {
  let html = '<div class="detail-section"><h3>Request Cookies</h3>';
  if (entry.request.cookies && entry.request.cookies.length > 0) {
    entry.request.cookies.forEach(cookie => {
      html += '<div class="detail-row"><div class="detail-label">' + escapeHtml(cookie.name) + '</div><div class="detail-value">' + escapeHtml(cookie.value) + '</div></div>';
    });
  } else {
    html += '<div>No request cookies</div>';
  }
  html += '</div>';
  
  html += '<div class="detail-section"><h3>Response Cookies</h3>';
  if (entry.response.cookies && entry.response.cookies.length > 0) {
    entry.response.cookies.forEach(cookie => {
      html += '<div class="detail-row"><div class="detail-label">' + escapeHtml(cookie.name) + '</div><div class="detail-value">' + escapeHtml(cookie.value) + '</div></div>';
    });
  } else {
    html += '<div>No response cookies</div>';
  }
  html += '</div>';
  
  return html;
}

function getTimingTab(entry) {
  const timings = entry.timings || {};
  let html = '<div class="detail-section">';
  html += '<div class="detail-row"><div class="detail-label">Blocked</div><div class="detail-value">' + formatTime(timings.blocked) + '</div></div>';
  html += '<div class="detail-row"><div class="detail-label">DNS</div><div class="detail-value">' + formatTime(timings.dns) + '</div></div>';
  html += '<div class="detail-row"><div class="detail-label">Connect</div><div class="detail-value">' + formatTime(timings.connect) + '</div></div>';
  html += '<div class="detail-row"><div class="detail-label">SSL</div><div class="detail-value">' + formatTime(timings.ssl) + '</div></div>';
  html += '<div class="detail-row"><div class="detail-label">Send</div><div class="detail-value">' + formatTime(timings.send) + '</div></div>';
  html += '<div class="detail-row"><div class="detail-label">Wait</div><div class="detail-value">' + formatTime(timings.wait) + '</div></div>';
  html += '<div class="detail-row"><div class="detail-label">Receive</div><div class="detail-value">' + formatTime(timings.receive) + '</div></div>';
  html += '<div class="detail-row"><div class="detail-label">Total</div><div class="detail-value">' + formatTime(entry.time) + '</div></div>';
  html += '</div>';
  return html;
}

// Search functionality
function performSearch() {
  const items = document.querySelectorAll('.request-item');
  let visibleCount = 0;
  
  items.forEach((item, index) => {
    const entry = entries[index];
    const matches = searchEntry(entry, searchTerm);
    
    if (!searchTerm || matches) {
      item.classList.remove('filtered');
      item.classList.toggle('highlight', searchTerm && matches);
      visibleCount++;
    } else {
      item.classList.add('filtered');
      item.classList.remove('highlight');
    }
  });
  
  filteredRequests.textContent = visibleCount;
}

function searchEntry(entry, term) {
  if (!term) return true;
  
  // Search URL
  if (entry.request.url.toLowerCase().includes(term)) return true;
  
  // Search method
  if (entry.request.method.toLowerCase().includes(term)) return true;
  
  // Search headers
  if (entry.request.headers) {
    for (const header of entry.request.headers) {
      if (header.name.toLowerCase().includes(term) || header.value.toLowerCase().includes(term)) {
        return true;
      }
    }
  }
  
  if (entry.response.headers) {
    for (const header of entry.response.headers) {
      if (header.name.toLowerCase().includes(term) || header.value.toLowerCase().includes(term)) {
        return true;
      }
    }
  }
  
  // Search request body
  if (entry.request.postData && entry.request.postData.text) {
    if (entry.request.postData.text.toLowerCase().includes(term)) return true;
  }
  
  // Search response body
  if (entry.response.content && entry.response.content.text && entry.response.content.encoding !== 'base64') {
    if (entry.response.content.text.toLowerCase().includes(term)) return true;
  }
  
  // Search status
  if (entry.response.status.toString().includes(term)) return true;
  
  return false;
}

// Update statistics
function updateStats() {
  totalRequests.textContent = entries.length;
  filteredRequests.textContent = entries.length;
  
  let size = 0;
  let time = 0;
  
  entries.forEach(entry => {
    size += entry.response.bodySize || 0;
    time += entry.time || 0;
  });
  
  totalSize.textContent = formatBytes(size);
  totalTime.textContent = Math.round(time) + ' ms';
}

// Export filtered results
function exportFiltered() {
  const visibleItems = document.querySelectorAll('.request-item:not(.filtered)');
  const filteredEntries = Array.from(visibleItems).map(item => entries[parseInt(item.dataset.index)]);
  
  const filteredHAR = {
    log: {
      version: harData.log.version,
      creator: harData.log.creator,
      browser: harData.log.browser,
      pages: harData.log.pages || [],
      entries: filteredEntries
    }
  };
  
  const blob = new Blob([JSON.stringify(filteredHAR, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'filtered-' + new Date().toISOString().replace(/[:.]/g, '-') + '.har';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Utility functions
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function formatTime(ms) {
  if (ms < 0) return 'N/A';
  if (ms < 1) return ms.toFixed(3) + ' ms';
  return Math.round(ms) + ' ms';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
