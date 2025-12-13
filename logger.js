// Live network logger

const emptyState = document.getElementById('emptyState');
const requestTable = document.getElementById('requestTable');
const requestTableBody = document.getElementById('requestTableBody');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const clearLogBtn = document.getElementById('clearLogBtn');
const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');
const totalRequests = document.getElementById('totalRequests');
const totalSize = document.getElementById('totalSize');
const totalTime = document.getElementById('totalTime');

let displayedRequests = new Map();
let stats = {
  count: 0,
  totalSize: 0,
  totalTime: 0
};
let searchTerm = '';

// Initialize
async function initialize() {
  updateStatus();
  startPolling();
}

// Search input handler
searchInput.addEventListener('input', (e) => {
  searchTerm = e.target.value.toLowerCase();
  clearSearch.classList.toggle('visible', searchTerm.length > 0);
  performSearch();
});

// Clear search
clearSearch.addEventListener('click', () => {
  searchInput.value = '';
  searchTerm = '';
  clearSearch.classList.remove('visible');
  performSearch();
});

// Perform search
async function performSearch() {
  if (!searchTerm) {
    // Show all requests
    for (const row of requestTableBody.rows) {
      row.classList.remove('filtered', 'highlight');
    }
    return;
  }

  // Search through requests
  for (const [requestId, request] of displayedRequests.entries()) {
    const row = document.getElementById('req-' + requestId);
    if (!row) continue;

    const matches = await searchRequest(request, searchTerm);
    
    if (matches) {
      row.classList.remove('filtered');
      row.classList.add('highlight');
    } else {
      row.classList.add('filtered');
      row.classList.remove('highlight');
    }
  }
}

// Search within a request
async function searchRequest(request, term) {
  // Search URL
  if (request.request?.url?.toLowerCase().includes(term)) {
    return true;
  }

  // Search method
  if (request.request?.method?.toLowerCase().includes(term)) {
    return true;
  }

  // Search request headers
  if (request.request?.headers) {
    for (const [key, value] of Object.entries(request.request.headers)) {
      if (key.toLowerCase().includes(term) || value.toLowerCase().includes(term)) {
        return true;
      }
    }
  }

  // Search response headers
  if (request.response?.headers) {
    for (const [key, value] of Object.entries(request.response.headers)) {
      if (key.toLowerCase().includes(term) || value.toLowerCase().includes(term)) {
        return true;
      }
    }
  }

  // Search POST data
  if (request.request?.postData) {
    if (request.request.postData.toLowerCase().includes(term)) {
      return true;
    }
  }

  // Search response body
  if (request.responseBody && !request.responseBodyIsBase64) {
    if (request.responseBody.toLowerCase().includes(term)) {
      return true;
    }
  }

  // Search status
  if (request.response?.status?.toString().includes(term)) {
    return true;
  }

  return false;
}

// Clear log
clearLogBtn.addEventListener('click', () => {
  displayedRequests.clear();
  requestTableBody.innerHTML = '';
  stats = { count: 0, totalSize: 0, totalTime: 0 };
  updateStats();
  showEmptyState();
});

// Update status from background
async function updateStatus() {
  const state = await sendMessage({ action: 'getState' });
  
  if (state.isRecording) {
    statusDot.classList.add('recording');
    statusText.textContent = 'Recording';
  } else {
    statusDot.classList.remove('recording');
    statusText.textContent = 'Not recording';
  }
}

// Poll for new requests
function startPolling() {
  setInterval(async () => {
    await updateStatus();
    await fetchRequests();
  }, 500); // Poll every 500ms for real-time feel
}

// Fetch requests from background
async function fetchRequests() {
  const result = await sendMessage({ action: 'getRequests' });
  
  if (result.success && result.requests) {
    for (const [requestId, request] of Object.entries(result.requests)) {
      if (!displayedRequests.has(requestId)) {
        addRequest(requestId, request);
        displayedRequests.set(requestId, request);
      } else {
        // Update existing request if it changed
        updateRequest(requestId, request);
      }
    }
  }
}

// Add request to table
function addRequest(requestId, request) {
  hideEmptyState();
  
  const row = document.createElement('tr');
  row.id = 'req-' + requestId;
  
  const method = request.request?.method || 'GET';
  const url = request.request?.url || '';
  const status = request.response?.status || '...';
  const type = request.type || 'other';
  
  // Calculate size
  let size = request.encodedDataLength || 0;
  const sizeText = formatBytes(size);
  
  // Calculate time
  let time = 0;
  if (request.finishedTimestamp && request.timestamp) {
    time = (request.finishedTimestamp - request.timestamp) * 1000;
  }
  const timeText = time > 0 ? Math.round(time) + ' ms' : '...';
  
  // Status class
  let statusClass = 'pending';
  if (status >= 200 && status < 300) statusClass = 'success';
  else if (status >= 300 && status < 400) statusClass = 'redirect';
  else if (status >= 400) statusClass = 'error';
  
  row.innerHTML = '<td><span class="method ' + method + '">' + method + '</span></td>' +
                  '<td><span class="status ' + statusClass + '">' + status + '</span></td>' +
                  '<td class="url" title="' + escapeHtml(url) + '">' + escapeHtml(url) + '</td>' +
                  '<td class="type">' + escapeHtml(type) + '</td>' +
                  '<td class="size">' + sizeText + '</td>' +
                  '<td class="time">' + timeText + '</td>';
  
  requestTableBody.appendChild(row);
  
  // Update stats
  stats.count++;
  stats.totalSize += size;
  if (time > 0) stats.totalTime += time;
  updateStats();
  
  // Auto-scroll to bottom
  requestTable.scrollTop = requestTable.scrollHeight;
}

// Update existing request
function updateRequest(requestId, request) {
  const row = document.getElementById('req-' + requestId);
  if (!row) return;
  
  const oldRequest = displayedRequests.get(requestId);
  
  // Check if status changed
  const newStatus = request.response?.status;
  const oldStatus = oldRequest.response?.status;
  
  if (newStatus && newStatus !== oldStatus) {
    const statusCell = row.cells[1];
    let statusClass = 'pending';
    if (newStatus >= 200 && newStatus < 300) statusClass = 'success';
    else if (newStatus >= 300 && newStatus < 400) statusClass = 'redirect';
    else if (newStatus >= 400) statusClass = 'error';
    
    statusCell.innerHTML = '<span class="status ' + statusClass + '">' + newStatus + '</span>';
  }
  
  // Update size if changed
  const newSize = request.encodedDataLength || 0;
  const oldSize = oldRequest.encodedDataLength || 0;
  if (newSize !== oldSize) {
    row.cells[4].textContent = formatBytes(newSize);
    stats.totalSize += (newSize - oldSize);
  }
  
  // Update time if finished
  if (request.finishedTimestamp && !oldRequest.finishedTimestamp) {
    const time = (request.finishedTimestamp - request.timestamp) * 1000;
    row.cells[5].textContent = Math.round(time) + ' ms';
    stats.totalTime += time;
  }
  
  updateStats();
  displayedRequests.set(requestId, request);
}

// Update stats bar
function updateStats() {
  totalRequests.textContent = stats.count;
  totalSize.textContent = formatBytes(stats.totalSize);
  totalTime.textContent = Math.round(stats.totalTime) + ' ms';
}

// Show empty state
function showEmptyState() {
  emptyState.style.display = 'flex';
  requestTable.style.display = 'none';
}

// Hide empty state
function hideEmptyState() {
  emptyState.style.display = 'none';
  requestTable.style.display = 'table';
}

// Format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Send message to background
function sendMessage(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      resolve(response || {});
    });
  });
}

// Initialize
initialize();
