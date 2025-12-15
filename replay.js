// Session Replay Tool

const loadHarBtn = document.getElementById('loadHarBtn');
const harFileInput = document.getElementById('harFileInput');
const sessionsList = document.getElementById('sessionsList');
const sessionSearchInput = document.getElementById('sessionSearchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const urlInput = document.getElementById('urlInput');
const bodyInput = document.getElementById('bodyInput');
const sendBtn = document.getElementById('sendBtn');
const responsePanel = document.getElementById('responsePanel');
const launchIncognitoBtn = document.getElementById('launchIncognitoBtn');
const incognitoCheckbox = document.getElementById('incognitoCheckbox');
const regularModeWarning = document.getElementById('regularModeWarning');
const viewCookiesBtn = document.getElementById('viewCookiesBtn');
const exportCookiesBtn = document.getElementById('exportCookiesBtn');
const exportMenu = document.getElementById('exportMenu');
const exportOurFormatBtn = document.getElementById('exportOurFormatBtn');
const exportCookieEditorBtn = document.getElementById('exportCookieEditorBtn');
const exportEditThisCookieBtn = document.getElementById('exportEditThisCookieBtn');
const importCookiesBtn = document.getElementById('importCookiesBtn');
const cookiesFileInput = document.getElementById('cookiesFileInput');
const cookieSelectionList = document.getElementById('cookieSelectionList');
const selectAllCookiesBtn = document.getElementById('selectAllCookiesBtn');
const deselectAllCookiesBtn = document.getElementById('deselectAllCookiesBtn');

let harData = null;
let sessions = [];
let cookies = [];
let cookieSelection = new Set(); // Track selected cookie indices
let selectedSession = null;
let selectedMethod = 'GET';
let searchFilter = ''; // Search filter for sessions

// Load HAR file
loadHarBtn.addEventListener('click', () => {
  harFileInput.click();
});

harFileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    loadHARFile(e.target.files[0]);
  }
});

// Launch incognito session
launchIncognitoBtn.addEventListener('click', async () => {
  await launchIncognitoSession();
});

// View cookies
viewCookiesBtn.addEventListener('click', () => {
  displayCookieList();
  exportMenu.style.display = 'none';
});

// Export cookies - toggle menu
exportCookiesBtn.addEventListener('click', () => {
  exportMenu.style.display = exportMenu.style.display === 'none' ? 'block' : 'none';
});

// Export in our format
exportOurFormatBtn.addEventListener('click', () => {
  exportCookies('our');
  exportMenu.style.display = 'none';
});

// Export in Cookie-Editor format
exportCookieEditorBtn.addEventListener('click', () => {
  exportCookies('cookie-editor');
  exportMenu.style.display = 'none';
});

// Export in EditThisCookie format
exportEditThisCookieBtn.addEventListener('click', () => {
  exportCookies('editthiscookie');
  exportMenu.style.display = 'none';
});

// Import cookies
importCookiesBtn.addEventListener('click', () => {
  cookiesFileInput.click();
});

cookiesFileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    importCookies(e.target.files[0]);
  }
});

// Update button text when checkbox changes
incognitoCheckbox.addEventListener('change', () => {
  updateIncognitoButton();
  // Show warning if regular mode selected
  regularModeWarning.style.display = incognitoCheckbox.checked ? 'none' : 'block';
});

// Close export menu when clicking outside
document.addEventListener('click', (e) => {
  if (!exportCookiesBtn.contains(e.target) && !exportMenu.contains(e.target)) {
    exportMenu.style.display = 'none';
  }
});

// Search sessions
sessionSearchInput.addEventListener('input', (e) => {
  searchFilter = e.target.value.toLowerCase().trim();
  clearSearchBtn.style.display = searchFilter ? 'block' : 'none';
  displaySessions();
});

// Clear search
clearSearchBtn.addEventListener('click', () => {
  sessionSearchInput.value = '';
  searchFilter = '';
  clearSearchBtn.style.display = 'none';
  displaySessions();
});

// Select/Deselect all cookies
selectAllCookiesBtn.addEventListener('click', () => {
  cookieSelection.clear();
  for (let i = 0; i < cookies.length; i++) {
    cookieSelection.add(i);
  }
  displayCookieSelection();
  updateIncognitoButton();
});

deselectAllCookiesBtn.addEventListener('click', () => {
  cookieSelection.clear();
  displayCookieSelection();
  updateIncognitoButton();
});

// Method selector
document.querySelectorAll('.method-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.method-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    selectedMethod = e.target.dataset.method;
  });
});

// Send request
sendBtn.addEventListener('click', async () => {
  await sendRequest();
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
      
      extractSessions();
      extractCookies();
      
      // Select all cookies by default
      cookieSelection.clear();
      for (let i = 0; i < cookies.length; i++) {
        cookieSelection.add(i);
      }
      
      displaySessions();
      displayCookieSelection();
      updateIncognitoButton();
      
    } catch (error) {
      alert('Error parsing HAR file: ' + error.message);
    }
  };
  
  reader.readAsText(file);
}

// Extract cookies from HAR
function extractCookies() {
  cookies = [];
  const cookieMap = new Map();
  
  harData.log.entries.forEach((entry, index) => {
    // Extract request cookies
    if (entry.request.cookies) {
      entry.request.cookies.forEach(cookie => {
        const key = cookie.name + ':' + cookie.value;
        if (!cookieMap.has(key)) {
          cookieMap.set(key, true);
          
          // Try to determine domain from URL
          let domain = '';
          try {
            const url = new URL(entry.request.url);
            domain = url.hostname;
          } catch (e) {
            domain = 'unknown';
          }
          
          cookies.push({
            name: cookie.name,
            value: cookie.value,
            domain: domain,
            path: '/',
            url: entry.request.url,
            secure: entry.request.url.startsWith('https'),
            httpOnly: false,
            sameSite: 'no_restriction',
            sourceRequest: index
          });
        }
      });
    }
    
    // Extract response cookies (Set-Cookie)
    if (entry.response.cookies) {
      entry.response.cookies.forEach(cookie => {
        const key = cookie.name + ':' + cookie.value;
        if (!cookieMap.has(key)) {
          cookieMap.set(key, true);
          
          let domain = cookie.domain || '';
          let url = entry.request.url;
          
          // If no domain in cookie, extract from URL
          if (!domain) {
            try {
              const urlObj = new URL(entry.request.url);
              domain = urlObj.hostname;
            } catch (e) {
              domain = 'unknown';
            }
          }
          
          cookies.push({
            name: cookie.name,
            value: cookie.value,
            domain: domain,
            path: cookie.path || '/',
            url: url,
            secure: cookie.secure || entry.request.url.startsWith('https'),
            httpOnly: cookie.httpOnly || false,
            sameSite: cookie.sameSite ? cookie.sameSite.toLowerCase().replace('-', '_') : 'no_restriction',
            expirationDate: cookie.expires ? new Date(cookie.expires).getTime() / 1000 : undefined,
            sourceRequest: index
          });
        }
      });
    }
  });
}

// Update incognito button state
function updateIncognitoButton() {
  const isIncognito = incognitoCheckbox.checked;
  const mode = isIncognito ? 'Incognito' : 'Regular';
  const selectedCount = cookieSelection.size;
  
  if (selectedCount > 0) {
    launchIncognitoBtn.disabled = false;
    launchIncognitoBtn.textContent = '🕵️ Launch ' + mode + ' with ' + selectedCount + ' Cookie' + (selectedCount !== 1 ? 's' : '');
  } else {
    launchIncognitoBtn.disabled = true;
    launchIncognitoBtn.textContent = '🕵️ No cookies selected';
  }
}

// Display cookie selection list with checkboxes
function displayCookieSelection() {
  if (cookies.length === 0) {
    cookieSelectionList.innerHTML = 
      '<div style="padding: 12px; color: #5f6368; text-align: center; font-size: 11px;">No cookies loaded</div>';
    return;
  }
  
  // Group cookies by domain
  const byDomain = {};
  cookies.forEach((cookie, index) => {
    if (!byDomain[cookie.domain]) {
      byDomain[cookie.domain] = [];
    }
    byDomain[cookie.domain].push({cookie, index});
  });
  
  let html = '';
  
  for (const [domain, domainCookies] of Object.entries(byDomain)) {
    const allSelected = domainCookies.every(item => cookieSelection.has(item.index));
    const someSelected = domainCookies.some(item => cookieSelection.has(item.index));
    
    // Domain header with checkbox
    html += '<div style="margin-bottom: 8px; border-bottom: 1px solid #e8eaed; padding-bottom: 4px;">';
    html += '<label style="display: flex; align-items: center; cursor: pointer; font-weight: 500; font-size: 11px; color: #202124;">';
    html += '<input type="checkbox" class="domain-checkbox" data-domain="' + escapeHtml(domain) + '" ' + 
            (allSelected ? 'checked' : '') + 
            ' style="margin-right: 6px;">';
    html += '<span>' + escapeHtml(domain) + ' (' + domainCookies.length + ')</span>';
    html += '</label>';
    html += '</div>';
    
    // Individual cookies
    html += '<div style="margin-left: 20px; margin-bottom: 12px;">';
    domainCookies.forEach(({cookie, index}) => {
      const isSelected = cookieSelection.has(index);
      const truncatedValue = cookie.value.length > 40 
        ? cookie.value.substring(0, 40) + '...' 
        : cookie.value;
      
      html += '<label style="display: flex; align-items: start; cursor: pointer; padding: 4px 0; font-size: 10px; color: #5f6368;">';
      html += '<input type="checkbox" class="cookie-checkbox" data-index="' + index + '" ' + 
              (isSelected ? 'checked' : '') + 
              ' style="margin-right: 6px; margin-top: 2px; flex-shrink: 0;">';
      html += '<div style="flex: 1; overflow: hidden;">';
      html += '<div style="font-weight: 500; color: #202124;">' + escapeHtml(cookie.name) + '</div>';
      html += '<div style="font-family: monospace; word-break: break-all; color: #5f6368;">' + escapeHtml(truncatedValue) + '</div>';
      html += '</div>';
      html += '</label>';
    });
    html += '</div>';
  }
  
  cookieSelectionList.innerHTML = html;
  
  // Add event listeners for domain checkboxes
  cookieSelectionList.querySelectorAll('.domain-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const domain = e.target.dataset.domain;
      const checked = e.target.checked;
      
      // Find all cookies for this domain and update selection
      cookies.forEach((cookie, index) => {
        if (cookie.domain === domain) {
          if (checked) {
            cookieSelection.add(index);
          } else {
            cookieSelection.delete(index);
          }
        }
      });
      
      displayCookieSelection();
      updateIncognitoButton();
    });
  });
  
  // Add event listeners for individual cookie checkboxes
  cookieSelectionList.querySelectorAll('.cookie-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const index = parseInt(e.target.dataset.index);
      
      if (e.target.checked) {
        cookieSelection.add(index);
      } else {
        cookieSelection.delete(index);
      }
      
      displayCookieSelection();
      updateIncognitoButton();
    });
  });
}

// Extract sessions and tokens from HAR
function extractSessions() {
  sessions = [];
  const seen = new Set();
  
  harData.log.entries.forEach((entry, index) => {
    // Extract from request headers
    if (entry.request.headers) {
      entry.request.headers.forEach(header => {
        const name = header.name.toLowerCase();
        const value = header.value;
        
        // Authorization header
        if (name === 'authorization') {
          const key = 'auth:' + value;
          if (!seen.has(key)) {
            seen.add(key);
            
            let type = 'Authorization Header';
            if (value.startsWith('Bearer ')) {
              type = 'Bearer Token';
            } else if (value.startsWith('Basic ')) {
              type = 'Basic Auth';
            }
            
            sessions.push({
              type: type,
              headerName: 'Authorization',
              value: value,
              source: 'Request #' + (index + 1) + ': ' + entry.request.url.substring(0, 50),
              requestIndex: index
            });
          }
        }
        
        // API Key headers
        if (name.includes('api') && name.includes('key')) {
          const key = 'apikey:' + value;
          if (!seen.has(key)) {
            seen.add(key);
            sessions.push({
              type: 'API Key',
              headerName: header.name,
              value: value,
              source: 'Request #' + (index + 1) + ': ' + entry.request.url.substring(0, 50),
              requestIndex: index
            });
          }
        }
        
        // X-Auth-Token, X-API-Token, etc.
        if (name.startsWith('x-') && (name.includes('token') || name.includes('auth'))) {
          const key = 'xtoken:' + value;
          if (!seen.has(key)) {
            seen.add(key);
            sessions.push({
              type: 'Auth Token',
              headerName: header.name,
              value: value,
              source: 'Request #' + (index + 1) + ': ' + entry.request.url.substring(0, 50),
              requestIndex: index
            });
          }
        }
      });
    }
    
    // Extract from cookies
    if (entry.request.cookies) {
      entry.request.cookies.forEach(cookie => {
        const name = cookie.name.toLowerCase();
        
        // Session cookies
        if (name.includes('session') || name.includes('sid') || name.includes('auth')) {
          const key = 'cookie:' + cookie.name + ':' + cookie.value;
          if (!seen.has(key)) {
            seen.add(key);
            sessions.push({
              type: 'Session Cookie',
              cookieName: cookie.name,
              value: cookie.value,
              source: 'Request #' + (index + 1) + ': ' + entry.request.url.substring(0, 50),
              requestIndex: index
            });
          }
        }
      });
    }
    
    // Extract from response bodies (OAuth tokens)
    if (entry.response.content && entry.response.content.text) {
      try {
        const text = entry.response.content.text;
        
        // Check if it's JSON
        if (entry.response.content.mimeType && entry.response.content.mimeType.includes('json')) {
          const json = JSON.parse(text);
          
          // Access token
          if (json.access_token) {
            const key = 'oauth:access:' + json.access_token;
            if (!seen.has(key)) {
              seen.add(key);
              sessions.push({
                type: 'OAuth Access Token',
                headerName: 'Authorization',
                value: 'Bearer ' + json.access_token,
                source: 'Response #' + (index + 1) + ': ' + entry.request.url.substring(0, 50),
                requestIndex: index,
                metadata: {
                  expires_in: json.expires_in,
                  token_type: json.token_type,
                  scope: json.scope
                }
              });
            }
          }
          
          // Refresh token
          if (json.refresh_token) {
            const key = 'oauth:refresh:' + json.refresh_token;
            if (!seen.has(key)) {
              seen.add(key);
              sessions.push({
                type: 'OAuth Refresh Token',
                value: json.refresh_token,
                source: 'Response #' + (index + 1) + ': ' + entry.request.url.substring(0, 50),
                requestIndex: index
              });
            }
          }
          
          // ID token (OpenID Connect)
          if (json.id_token) {
            const key = 'oauth:id:' + json.id_token;
            if (!seen.has(key)) {
              seen.add(key);
              sessions.push({
                type: 'OpenID ID Token',
                value: json.id_token,
                source: 'Response #' + (index + 1) + ': ' + entry.request.url.substring(0, 50),
                requestIndex: index
              });
            }
          }
        }
      } catch (e) {
        // Not JSON or parse error, skip
      }
    }
    
    // Extract from query parameters
    if (entry.request.queryString) {
      entry.request.queryString.forEach(param => {
        const name = param.name.toLowerCase();
        
        // API keys in query params
        if (name.includes('api') && name.includes('key')) {
          const key = 'qparam:apikey:' + param.value;
          if (!seen.has(key)) {
            seen.add(key);
            sessions.push({
              type: 'API Key (Query)',
              queryParam: param.name,
              value: param.value,
              source: 'Request #' + (index + 1) + ': ' + entry.request.url.substring(0, 50),
              requestIndex: index
            });
          }
        }
        
        // Access tokens in query params
        if (name === 'access_token' || name === 'token') {
          const key = 'qparam:token:' + param.value;
          if (!seen.has(key)) {
            seen.add(key);
            sessions.push({
              type: 'Access Token (Query)',
              queryParam: param.name,
              value: param.value,
              source: 'Request #' + (index + 1) + ': ' + entry.request.url.substring(0, 50),
              requestIndex: index
            });
          }
        }
      });
    }
  });
}

// Display sessions
function displaySessions() {
  if (sessions.length === 0) {
    sessionsList.innerHTML = '<div style="padding: 12px; color: #5f6368; text-align: center;">No sessions or tokens found in HAR file</div>';
    return;
  }
  
  // Filter sessions based on search
  const filteredSessions = sessions.filter((session, index) => {
    if (!searchFilter) return true;
    
    // Search in type, value, source, URL, headers
    const searchableText = [
      session.type,
      session.value,
      session.source,
      session.headerName || '',
      session.metadata ? JSON.stringify(session.metadata) : ''
    ].join(' ').toLowerCase();
    
    // Also search in original request if available
    if (session.requestIndex !== undefined && harData) {
      const entry = harData.log.entries[session.requestIndex];
      if (entry) {
        const requestText = [
          entry.request.url,
          entry.request.method,
          JSON.stringify(entry.request.queryString),
          JSON.stringify(entry.request.headers),
          entry.request.postData ? entry.request.postData.text : ''
        ].join(' ').toLowerCase();
        return searchableText.includes(searchFilter) || requestText.includes(searchFilter);
      }
    }
    
    return searchableText.includes(searchFilter);
  });
  
  if (filteredSessions.length === 0) {
    sessionsList.innerHTML = 
      '<div style="padding: 12px; color: #5f6368; text-align: center;">' +
      'No sessions match "' + escapeHtml(searchFilter) + '"<br>' +
      '<span style="font-size: 11px;">Found ' + sessions.length + ' total sessions</span>' +
      '</div>';
    return;
  }
  
  sessionsList.innerHTML = '';
  
  // Show search results count if filtering
  if (searchFilter) {
    const countDiv = document.createElement('div');
    countDiv.style.padding = '8px 12px';
    countDiv.style.fontSize = '11px';
    countDiv.style.color = '#5f6368';
    countDiv.style.background = '#fff';
    countDiv.style.borderRadius = '4px';
    countDiv.style.marginBottom = '8px';
    countDiv.textContent = 'Showing ' + filteredSessions.length + ' of ' + sessions.length + ' sessions';
    sessionsList.appendChild(countDiv);
  }
  
  filteredSessions.forEach((session) => {
    const index = sessions.indexOf(session); // Get original index
    const card = document.createElement('div');
    card.className = 'session-card';
    card.dataset.index = index;
    
    const truncatedValue = session.value.length > 50 
      ? session.value.substring(0, 50) + '...' 
      : session.value;
    
    let metadataHtml = '';
    if (session.metadata) {
      if (session.metadata.expires_in) {
        metadataHtml += '<div class="session-source">Expires in: ' + session.metadata.expires_in + 's</div>';
      }
      if (session.metadata.scope) {
        metadataHtml += '<div class="session-source">Scope: ' + session.metadata.scope + '</div>';
      }
    }
    
    card.innerHTML = 
      '<div class="session-type">' + escapeHtml(session.type) + '</div>' +
      '<div class="session-value">' + escapeHtml(truncatedValue) + '</div>' +
      '<div class="session-source">' + escapeHtml(session.source) + '</div>' +
      metadataHtml +
      '<div style="margin-top: 8px; font-size: 10px; color: #1a73e8; cursor: pointer;">👁️ View Details</div>';
    
    card.addEventListener('click', () => selectSession(index));
    
    sessionsList.appendChild(card);
  });
}

// Select a session
function selectSession(index) {
  selectedSession = sessions[index];
  
  // Update UI
  document.querySelectorAll('.session-card').forEach((card, i) => {
    card.classList.toggle('selected', i === index);
  });
  
  // Populate URL from the original request if available
  if (selectedSession.requestIndex !== undefined && harData) {
    const entry = harData.log.entries[selectedSession.requestIndex];
    if (entry) {
      urlInput.value = entry.request.url;
    }
  }
  
  // Show info
  showSessionInfo();
}

// Show session info
function showSessionInfo() {
  if (!selectedSession) return;
  
  let detailHtml = '<div class="info-box">' +
    '<strong>Selected:</strong> ' + escapeHtml(selectedSession.type) + '<br>' +
    '<strong>Value:</strong> <code>' + escapeHtml(selectedSession.value) + '</code><br>';
  
  if (selectedSession.headerName) {
    detailHtml += '<strong>Header:</strong> <code>' + escapeHtml(selectedSession.headerName) + '</code><br>';
  }
  
  detailHtml += '</div>';
  
  // Show full request details if available
  if (selectedSession.requestIndex !== undefined && harData) {
    const entry = harData.log.entries[selectedSession.requestIndex];
    if (entry) {
      const request = entry.request;
      const response = entry.response;
      
      detailHtml += '<div style="margin-top: 16px;">';
      detailHtml += '<div style="font-weight: 500; margin-bottom: 8px; font-size: 14px;">📋 Request Details</div>';
      
      // Request summary
      detailHtml += '<div class="info-box" style="margin-bottom: 12px;">';
      detailHtml += '<strong>Method:</strong> ' + escapeHtml(request.method) + '<br>';
      detailHtml += '<strong>URL:</strong> <code style="word-break: break-all;">' + escapeHtml(request.url) + '</code><br>';
      if (request.httpVersion) {
        detailHtml += '<strong>HTTP Version:</strong> ' + escapeHtml(request.httpVersion) + '<br>';
      }
      detailHtml += '</div>';
      
      // Query Parameters
      if (request.queryString && request.queryString.length > 0) {
        detailHtml += '<div style="margin-bottom: 12px;">';
        detailHtml += '<div style="font-weight: 500; margin-bottom: 4px; font-size: 12px;">🔍 Query Parameters (' + request.queryString.length + ')</div>';
        detailHtml += '<div class="headers-list">';
        request.queryString.forEach(param => {
          detailHtml += '<div class="header-row">';
          detailHtml += '<div class="header-name">' + escapeHtml(param.name) + '</div>';
          detailHtml += '<div class="header-value">' + escapeHtml(param.value) + '</div>';
          detailHtml += '</div>';
        });
        detailHtml += '</div></div>';
      }
      
      // Request Headers
      if (request.headers && request.headers.length > 0) {
        detailHtml += '<div style="margin-bottom: 12px;">';
        detailHtml += '<div style="font-weight: 500; margin-bottom: 4px; font-size: 12px;">📨 Request Headers (' + request.headers.length + ')</div>';
        detailHtml += '<div class="headers-list">';
        request.headers.forEach(header => {
          // Highlight auth headers
          const isAuthHeader = header.name.toLowerCase().includes('auth') || 
                                header.name.toLowerCase() === 'cookie' ||
                                header.name.toLowerCase().includes('token');
          const headerClass = isAuthHeader ? 'style="background: #fef7e0;"' : '';
          
          detailHtml += '<div class="header-row" ' + headerClass + '>';
          detailHtml += '<div class="header-name">' + escapeHtml(header.name) + '</div>';
          detailHtml += '<div class="header-value">' + escapeHtml(header.value) + '</div>';
          detailHtml += '</div>';
        });
        detailHtml += '</div></div>';
      }
      
      // Request Cookies
      if (request.cookies && request.cookies.length > 0) {
        detailHtml += '<div style="margin-bottom: 12px;">';
        detailHtml += '<div style="font-weight: 500; margin-bottom: 4px; font-size: 12px;">🍪 Request Cookies (' + request.cookies.length + ')</div>';
        detailHtml += '<div class="headers-list">';
        request.cookies.forEach(cookie => {
          detailHtml += '<div class="header-row">';
          detailHtml += '<div class="header-name">' + escapeHtml(cookie.name) + '</div>';
          detailHtml += '<div class="header-value">' + escapeHtml(cookie.value) + '</div>';
          detailHtml += '</div>';
        });
        detailHtml += '</div></div>';
      }
      
      // Request Body
      if (request.postData && request.postData.text) {
        detailHtml += '<div style="margin-bottom: 12px;">';
        detailHtml += '<div style="font-weight: 500; margin-bottom: 4px; font-size: 12px;">📦 Request Body</div>';
        
        // Try to format as JSON
        let bodyText = request.postData.text;
        try {
          const parsed = JSON.parse(bodyText);
          bodyText = JSON.stringify(parsed, null, 2);
        } catch (e) {
          // Not JSON, use as-is
        }
        
        detailHtml += '<div class="code-block">' + escapeHtml(bodyText) + '</div>';
        detailHtml += '</div>';
      }
      
      // Response Info
      if (response) {
        detailHtml += '<div style="margin-top: 16px;">';
        detailHtml += '<div style="font-weight: 500; margin-bottom: 8px; font-size: 14px;">📬 Response Details</div>';
        
        detailHtml += '<div class="info-box" style="margin-bottom: 12px;">';
        detailHtml += '<strong>Status:</strong> ' + response.status + ' ' + escapeHtml(response.statusText) + '<br>';
        if (response.httpVersion) {
          detailHtml += '<strong>HTTP Version:</strong> ' + escapeHtml(response.httpVersion) + '<br>';
        }
        if (response.redirectURL) {
          detailHtml += '<strong>Redirect URL:</strong> <code>' + escapeHtml(response.redirectURL) + '</code><br>';
        }
        detailHtml += '</div>';
        
        // Response Headers
        if (response.headers && response.headers.length > 0) {
          detailHtml += '<div style="margin-bottom: 12px;">';
          detailHtml += '<div style="font-weight: 500; margin-bottom: 4px; font-size: 12px;">📨 Response Headers (' + response.headers.length + ')</div>';
          detailHtml += '<div class="headers-list">';
          response.headers.forEach(header => {
            detailHtml += '<div class="header-row">';
            detailHtml += '<div class="header-name">' + escapeHtml(header.name) + '</div>';
            detailHtml += '<div class="header-value">' + escapeHtml(header.value) + '</div>';
            detailHtml += '</div>';
          });
          detailHtml += '</div></div>';
        }
        
        // Response Cookies
        if (response.cookies && response.cookies.length > 0) {
          detailHtml += '<div style="margin-bottom: 12px;">';
          detailHtml += '<div style="font-weight: 500; margin-bottom: 4px; font-size: 12px;">🍪 Response Cookies (' + response.cookies.length + ')</div>';
          detailHtml += '<div class="headers-list">';
          response.cookies.forEach(cookie => {
            detailHtml += '<div class="header-row">';
            detailHtml += '<div class="header-name">' + escapeHtml(cookie.name) + '</div>';
            detailHtml += '<div class="header-value">' + escapeHtml(cookie.value) + '</div>';
            detailHtml += '</div>';
          });
          detailHtml += '</div></div>';
        }
        
        // Response Body (if available and not too large)
        if (response.content && response.content.text && response.content.text.length < 50000) {
          detailHtml += '<div style="margin-bottom: 12px;">';
          detailHtml += '<div style="font-weight: 500; margin-bottom: 4px; font-size: 12px;">📦 Response Body</div>';
          
          let bodyText = response.content.text;
          const mimeType = response.content.mimeType || '';
          
          // Try to format as JSON
          if (mimeType.includes('json')) {
            try {
              const parsed = JSON.parse(bodyText);
              bodyText = JSON.stringify(parsed, null, 2);
            } catch (e) {
              // Not valid JSON
            }
          }
          
          detailHtml += '<div class="code-block">' + escapeHtml(bodyText.substring(0, 10000)) + '</div>';
          if (bodyText.length > 10000) {
            detailHtml += '<div style="font-size: 11px; color: #5f6368; margin-top: 4px;">Truncated (showing first 10,000 characters)</div>';
          }
          detailHtml += '</div>';
        }
        
        detailHtml += '</div>';
      }
      
      detailHtml += '</div>';
    }
  }
  
  detailHtml += '<div style="margin-top: 16px; color: #5f6368;">Configure the request above and click "Send Request" to test this session.</div>';
  
  responsePanel.innerHTML = detailHtml;
}

// Send request with selected session
async function sendRequest() {
  if (!selectedSession) {
    alert('Please select a session/token first');
    return;
  }
  
  const url = urlInput.value.trim();
  if (!url) {
    alert('Please enter a URL');
    return;
  }
  
  sendBtn.disabled = true;
  sendBtn.textContent = 'Sending...';
  
  try {
    // Build headers
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add authentication
    if (selectedSession.headerName) {
      headers[selectedSession.headerName] = selectedSession.value;
    }
    
    // Build request options
    const options = {
      method: selectedMethod,
      headers: headers,
      mode: 'cors'
    };
    
    // Add body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(selectedMethod) && bodyInput.value.trim()) {
      options.body = bodyInput.value.trim();
    }
    
    // Add cookies if it's a cookie-based session
    if (selectedSession.cookieName) {
      options.credentials = 'include';
      // Note: We can't set cookies via fetch, this would need to be done at browser level
      responsePanel.innerHTML = 
        '<div class="warning-box">' +
        '<strong>Note:</strong> Cookie-based sessions require the cookie to be set in your browser. ' +
        'Use browser DevTools to set the cookie manually:<br><br>' +
        '<code>document.cookie = "' + escapeHtml(selectedSession.cookieName) + '=' + escapeHtml(selectedSession.value) + '; path=/; domain=..."</code>' +
        '</div>';
    }
    
    // Add query param if it's a query-based auth
    let finalUrl = url;
    if (selectedSession.queryParam) {
      const separator = url.includes('?') ? '&' : '?';
      finalUrl = url + separator + encodeURIComponent(selectedSession.queryParam) + '=' + encodeURIComponent(selectedSession.value);
    }
    
    // Send request
    const response = await fetch(finalUrl, options);
    
    // Get response data
    const responseText = await response.text();
    const responseHeaders = {};
    response.headers.forEach((value, name) => {
      responseHeaders[name] = value;
    });
    
    // Display response
    displayResponse(response.status, response.statusText, responseHeaders, responseText);
    
  } catch (error) {
    displayError(error);
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = 'Send Request';
  }
}

// Display response
function displayResponse(status, statusText, headers, body) {
  const statusClass = status >= 200 && status < 300 ? 'success' : 'error';
  
  let formattedBody = body;
  try {
    const json = JSON.parse(body);
    formattedBody = JSON.stringify(json, null, 2);
  } catch (e) {
    // Not JSON
  }
  
  const html = 
    '<div class="response-status ' + statusClass + '">' + status + ' ' + escapeHtml(statusText) + '</div>' +
    '<div class="tabs">' +
    '<button class="tab active" data-tab="body">Response Body</button>' +
    '<button class="tab" data-tab="headers">Response Headers</button>' +
    '<button class="tab" data-tab="request">Request Sent</button>' +
    '</div>' +
    '<div class="tab-content active" data-content="body">' +
    '<div class="code-block">' + escapeHtml(formattedBody) + '</div>' +
    '</div>' +
    '<div class="tab-content" data-content="headers">' +
    '<div class="headers-list">' + formatHeaders(headers) + '</div>' +
    '</div>' +
    '<div class="tab-content" data-content="request">' +
    '<div class="code-block">' + 
    selectedMethod + ' ' + urlInput.value + '\n\n' +
    'Headers:\n' + formatHeadersText(getRequestHeaders()) + '\n\n' +
    (bodyInput.value.trim() ? 'Body:\n' + bodyInput.value : 'No body') +
    '</div>' +
    '</div>';
  
  responsePanel.innerHTML = html;
  
  // Add tab functionality
  responsePanel.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const tabName = e.target.dataset.tab;
      
      responsePanel.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      responsePanel.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      e.target.classList.add('active');
      responsePanel.querySelector('[data-content="' + tabName + '"]').classList.add('active');
    });
  });
}

// Display error
function displayError(error) {
  responsePanel.innerHTML = 
    '<div class="response-status error">Request Failed</div>' +
    '<div class="warning-box">' +
    '<strong>Error:</strong> ' + escapeHtml(error.message) + '<br><br>' +
    '<strong>Common issues:</strong><br>' +
    '• CORS policy blocking the request<br>' +
    '• Invalid URL or network error<br>' +
    '• Token expired or invalid<br>' +
    '• Server is down or unreachable' +
    '</div>';
}

// Get request headers
function getRequestHeaders() {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (selectedSession && selectedSession.headerName) {
    headers[selectedSession.headerName] = selectedSession.value;
  }
  
  return headers;
}

// Format headers for display
function formatHeaders(headers) {
  let html = '';
  for (const [name, value] of Object.entries(headers)) {
    html += 
      '<div class="header-row">' +
      '<div class="header-name">' + escapeHtml(name) + '</div>' +
      '<div class="header-value">' + escapeHtml(value) + '</div>' +
      '</div>';
  }
  return html;
}

// Format headers as text
function formatHeadersText(headers) {
  let text = '';
  for (const [name, value] of Object.entries(headers)) {
    text += name + ': ' + value + '\n';
  }
  return text;
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Launch incognito session with cookies
async function launchIncognitoSession() {
  if (cookieSelection.size === 0) {
    alert('No cookies selected. Please select cookies to import.');
    return;
  }
  
  // Get only selected cookies
  const selectedCookies = cookies.filter((cookie, index) => cookieSelection.has(index));
  
  const useIncognito = incognitoCheckbox.checked;
  const mode = useIncognito ? 'incognito' : 'regular';
  
  // Show confirmation with cookie details
  const domainCount = {};
  selectedCookies.forEach(cookie => {
    const domain = cookie.domain;
    domainCount[domain] = (domainCount[domain] || 0) + 1;
  });
  
  const domainList = Object.entries(domainCount)
    .map(([domain, count]) => domain + ' (' + count + ' cookie' + (count !== 1 ? 's' : '') + ')')
    .join('\n');
  
  const modeText = useIncognito ? 'incognito/private' : 'regular';
  const confirmed = confirm(
    'Launch ' + modeText + ' window with ' + selectedCookies.length + ' selected cookie(s)?\n\n' +
    'Domains:\n' + domainList + '\n\n' +
    'You will browse as the user from the HAR file.\n' +
    (useIncognito ? 'Incognito mode: Session isolated from normal browsing.\n' : 'Regular mode: Cookies will be in your main browser profile.\n') +
    'Only use this in authorized test environments.'
  );
  
  if (!confirmed) return;
  
  // Get the primary domain (most common domain in cookies)
  let primaryDomain = '';
  let maxCount = 0;
  for (const [domain, count] of Object.entries(domainCount)) {
    if (count > maxCount) {
      maxCount = count;
      primaryDomain = domain;
    }
  }
  
  // Remove leading dot if present for URL
  const cleanDomain = primaryDomain.startsWith('.') ? primaryDomain.substring(1) : primaryDomain;
  
  // Determine protocol (prefer https)
  const hasHttps = cookies.some(c => c.secure);
  const protocol = hasHttps ? 'https://' : 'http://';
  const startUrl = protocol + cleanDomain;
  
  try {
    launchIncognitoBtn.disabled = true;
    launchIncognitoBtn.textContent = 'Launching...';
    
    // Create window (incognito or regular based on checkbox)
    const newWindow = await chrome.windows.create({
      url: 'about:blank',
      incognito: useIncognito,
      focused: true,
      width: 1200,
      height: 800
    });
    
    // Get the tab
    const tabs = await chrome.tabs.query({ windowId: newWindow.id });
    const newTab = tabs[0];
    
    // Wait for window to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get all cookie stores to find the correct one
    const allStores = await chrome.cookies.getAllCookieStores();
    const targetStore = allStores.find(store => 
      store.tabIds.includes(newTab.id)
    );
    
    if (!targetStore) {
      throw new Error('Could not find cookie store for ' + mode + ' window');
    }
    
    console.log('=== Cookie Import Debug ===');
    console.log('Window mode:', mode);
    console.log('Window ID:', newWindow.id);
    console.log('Tab ID:', newTab.id);
    console.log('Cookie store ID:', targetStore.id);
    console.log('Total cookies to import:', cookies.length);
    
    // Set all cookies
    let successCount = 0;
    let failCount = 0;
    let verifiedCount = 0;
    const errors = [];
    
    console.log('=== Cookie Import Debug ===');
    console.log('Window mode:', mode);
    console.log('Window ID:', newWindow.id);
    console.log('Tab ID:', newTab.id);
    console.log('Cookie store ID:', targetStore.id);
    console.log('Total cookies selected:', selectedCookies.length);
    console.log('Total cookies available:', cookies.length);
    
    for (const cookie of selectedCookies) {
      try {
        // Clean up domain - Chrome cookies API is picky
        let cookieDomain = cookie.domain;
        
        // Remove leading dot for URL construction but keep for domain parameter
        const urlDomain = cookieDomain.startsWith('.') ? cookieDomain.substring(1) : cookieDomain;
        
        // Build cookie URL - must be valid URL for the domain
        const cookieProtocol = cookie.secure ? 'https://' : 'http://';
        const cookieUrl = cookieProtocol + urlDomain + (cookie.path || '/');
        
        // Build cookie details for Chrome API
        const cookieDetails = {
          url: cookieUrl,
          name: cookie.name,
          value: cookie.value,
          path: cookie.path || '/',
          secure: cookie.secure || false,
          httpOnly: cookie.httpOnly || false,
          sameSite: cookie.sameSite || 'no_restriction',
          storeId: targetStore.id
        };
        
        // Only set domain if it starts with dot (domain cookie)
        if (cookie.domain.startsWith('.')) {
          cookieDetails.domain = cookie.domain;
        }
        
        // Add expiration if present and not expired
        if (cookie.expirationDate) {
          const now = Date.now() / 1000;
          if (cookie.expirationDate > now) {
            cookieDetails.expirationDate = cookie.expirationDate;
          } else {
            console.warn('Skipping expired cookie:', cookie.name, 'expired at', new Date(cookie.expirationDate * 1000));
          }
        }
        
        console.log('Setting cookie:', cookie.name, 'for domain:', cookieDomain);
        console.log('Cookie details:', cookieDetails);
        
        // Set the cookie
        const result = await chrome.cookies.set(cookieDetails);
        
        if (result) {
          console.log('✓ Cookie set successfully:', cookie.name);
          successCount++;
        } else {
          console.error('✗ Cookie set returned null:', cookie.name);
          failCount++;
          errors.push({
            cookie: cookie.name,
            domain: cookie.domain,
            error: 'chrome.cookies.set returned null'
          });
        }
        
      } catch (error) {
        failCount++;
        errors.push({
          cookie: cookie.name,
          domain: cookie.domain,
          error: error.message
        });
        console.error('✗ Failed to set cookie:', cookie.name, 'Error:', error.message);
        console.error('Cookie data:', cookie);
      }
    }
    
    console.log('=== Cookie Import Complete ===');
    console.log('Success:', successCount, 'Failed:', failCount);
    if (errors.length > 0) {
      console.error('Errors:', errors);
    }
    
    // Wait a moment for cookies to propagate
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verify cookies were set by reading them back
    console.log('=== Verifying Cookies ===');
    verifiedCount = 0;
    for (const cookie of selectedCookies) {
      try {
        const urlDomain = cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain;
        const cookieProtocol = cookie.secure ? 'https://' : 'http://';
        const cookieUrl = cookieProtocol + urlDomain + (cookie.path || '/');
        
        const readCookies = await chrome.cookies.getAll({
          url: cookieUrl,
          name: cookie.name,
          storeId: targetStore.id
        });
        
        if (readCookies && readCookies.length > 0) {
          console.log('✓ Verified cookie:', cookie.name, readCookies[0]);
          verifiedCount++;
        } else {
          console.warn('✗ Cookie not found after setting:', cookie.name);
        }
      } catch (error) {
        console.error('Error verifying cookie:', cookie.name, error);
      }
    }
    console.log('Verified:', verifiedCount, '/', selectedCookies.length, 'cookies');
    
    // Navigate to start URL after cookies are set and verified
    await chrome.tabs.update(newTab.id, { url: startUrl });
    
    // Show results
    const windowType = useIncognito ? 'Incognito' : 'Regular';
    const resultHtml = 
      '<div class="info-box">' +
      '<strong>✅ ' + windowType + ' Session Launched</strong><br><br>' +
      'Window mode: ' + windowType + '<br>' +
      'Cookies selected: ' + selectedCookies.length + ' / ' + cookies.length + '<br>' +
      'Cookies imported: ' + successCount + ' / ' + selectedCookies.length + '<br>' +
      'Cookies verified: ' + verifiedCount + ' / ' + successCount + '<br>' +
      'URL: <code>' + escapeHtml(startUrl) + '</code><br><br>' +
      '<strong>What now?</strong><br>' +
      '1. The ' + windowType.toLowerCase() + ' window has opened<br>' +
      '2. Selected cookies are set - you should be logged in<br>' +
      '3. Navigate to reproduce the issue<br>' +
      '4. Close the window when done<br><br>' +
      '<strong>Debug Info:</strong><br>' +
      'Check browser console (F12) for detailed cookie logs.<br><br>' +
      '⚠️ <strong>Remember:</strong> You are acting as the user - any actions you take will be as them!' +
      '</div>';
    
    if (failCount > 0) {
      const errorHtml = 
        '<div class="warning-box" style="margin-top: 12px;">' +
        '<strong>⚠️ Warning:</strong> ' + failCount + ' cookie(s) failed to import<br>' +
        'Successful: ' + successCount + '<br>' +
        'Failed cookies may affect functionality.<br><br>' +
        '<strong>Common reasons:</strong><br>' +
        '• Expired cookies<br>' +
        '• Invalid domain format<br>' +
        '• Secure flag on HTTP domain<br><br>' +
        'Check browser console for details.' +
        '</div>';
      responsePanel.innerHTML = resultHtml + errorHtml;
      console.error('Cookie import errors:', errors);
    } else {
      responsePanel.innerHTML = resultHtml;
    }
    
    updateIncognitoButton();
    
  } catch (error) {
    console.error('Session launch error:', error);
    alert('Failed to launch session: ' + error.message);
    updateIncognitoButton();
  }
}

// Display cookie list
function displayCookieList() {
  if (cookies.length === 0) {
    responsePanel.innerHTML = 
      '<div class="empty-state">' +
      '<div class="empty-icon">🍪</div>' +
      '<div>No cookies found in HAR file</div>' +
      '</div>';
    return;
  }
  
  const selectedCookies = cookies.filter((cookie, index) => cookieSelection.has(index));
  
  // Group cookies by domain
  const byDomain = {};
  cookies.forEach((cookie, index) => {
    if (!byDomain[cookie.domain]) {
      byDomain[cookie.domain] = [];
    }
    byDomain[cookie.domain].push({cookie, index});
  });
  
  let html = '<div class="info-box">' +
    '<strong>Cookie List</strong><br>' +
    'Total cookies: ' + cookies.length + '<br>' +
    'Selected: ' + selectedCookies.length + '<br><br>' +
    'Use the Cookie Selection panel on the left to choose which cookies to import.' +
    '</div>';
  
  for (const [domain, domainCookies] of Object.entries(byDomain)) {
    const selectedInDomain = domainCookies.filter(item => cookieSelection.has(item.index)).length;
    
    html += '<div style="margin-top: 16px; margin-bottom: 8px;">' +
            '<strong style="color: #1a73e8;">' + escapeHtml(domain) + '</strong> ' +
            '<span style="color: #5f6368; font-size: 11px;">(' + selectedInDomain + ' / ' + domainCookies.length + ' selected)</span>' +
            '</div>';
    
    html += '<div class="headers-list">';
    
    domainCookies.forEach(({cookie, index}) => {
      const isSelected = cookieSelection.has(index);
      const flags = [];
      if (cookie.secure) flags.push('Secure');
      if (cookie.httpOnly) flags.push('HttpOnly');
      if (cookie.sameSite !== 'no_restriction') flags.push('SameSite=' + cookie.sameSite);
      
      const truncatedValue = cookie.value.length > 60 
        ? cookie.value.substring(0, 60) + '...' 
        : cookie.value;
      
      const selectionBadge = isSelected 
        ? '<span style="background: #e8f0fe; color: #1a73e8; padding: 2px 6px; border-radius: 3px; font-size: 9px; margin-left: 6px;">SELECTED</span>'
        : '<span style="background: #f1f3f4; color: #5f6368; padding: 2px 6px; border-radius: 3px; font-size: 9px; margin-left: 6px;">NOT SELECTED</span>';
      
      html += '<div class="header-row">' +
              '<div class="header-name">' + escapeHtml(cookie.name) + selectionBadge + '</div>' +
              '<div class="header-value">' + 
              escapeHtml(truncatedValue) +
              (flags.length > 0 ? '<br><span style="color: #5f6368; font-size: 10px;">' + flags.join(', ') + '</span>' : '') +
              '</div>' +
              '</div>';
    });
    
    html += '</div>';
  }
  
  responsePanel.innerHTML = html;
}

// Export cookies to JSON file
function exportCookies(format = 'our') {
  if (cookieSelection.size === 0) {
    alert('No cookies selected. Please select cookies to export.');
    return;
  }
  
  // Get only selected cookies
  const selectedCookies = cookies.filter((cookie, index) => cookieSelection.has(index));
  
  let exportData;
  let filename;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  
  if (format === 'cookie-editor') {
    // Cookie-Editor format: array of cookies with their format
    exportData = selectedCookies.map(cookie => {
      const cookieEditorFormat = {
        domain: cookie.domain,
        hostOnly: !cookie.domain.startsWith('.'),
        httpOnly: cookie.httpOnly || false,
        name: cookie.name,
        path: cookie.path || '/',
        sameSite: convertSameSiteToCookieEditor(cookie.sameSite || 'no_restriction'),
        secure: cookie.secure || false,
        session: !cookie.expirationDate,
        value: cookie.value
      };
      
      // Add expiration if not a session cookie
      if (cookie.expirationDate) {
        cookieEditorFormat.expirationDate = cookie.expirationDate;
      }
      
      // Add storeId if present
      if (cookie.storeId) {
        cookieEditorFormat.storeId = cookie.storeId;
      }
      
      return cookieEditorFormat;
    });
    
    filename = 'cookies-' + timestamp + '.json';
  } else if (format === 'editthiscookie') {
    // EditThisCookie format: array similar to Cookie-Editor but different sameSite values
    exportData = selectedCookies.map((cookie, index) => {
      const editThisCookieFormat = {
        domain: cookie.domain,
        expirationDate: cookie.expirationDate,
        hostOnly: !cookie.domain.startsWith('.'),
        httpOnly: cookie.httpOnly || false,
        name: cookie.name,
        path: cookie.path || '/',
        sameSite: convertSameSiteToEditThisCookie(cookie.sameSite || 'no_restriction'),
        secure: cookie.secure || false,
        session: !cookie.expirationDate,
        storeId: cookie.storeId || '0',
        value: cookie.value,
        id: index + 1
      };
      
      return editThisCookieFormat;
    });
    
    filename = 'cookies-' + timestamp + '.json';
  } else {
    // Our format: object with metadata
    exportData = {
      version: '1.0',
      exported: new Date().toISOString(),
      totalCookies: selectedCookies.length,
      totalAvailable: cookies.length,
      cookies: selectedCookies
    };
    
    filename = 'session-cookies-' + timestamp + '.json';
  }
  
  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  const formatNames = {
    'cookie-editor': 'Cookie-Editor',
    'editthiscookie': 'EditThisCookie',
    'our': 'Our Format'
  };
  const formatName = formatNames[format] || 'Our Format';
  
  responsePanel.innerHTML = 
    '<div class="info-box">' +
    '<strong>✅ Selected Cookies Exported</strong><br><br>' +
    'Format: ' + formatName + '<br>' +
    'File: <code>' + filename + '</code><br>' +
    'Cookies exported: ' + selectedCookies.length + ' (selected)<br>' +
    'Total available: ' + cookies.length + '<br><br>' +
    (format === 'cookie-editor' 
      ? 'This file can be imported directly into Cookie-Editor extension.<br><br>'
      : '') +
    (format === 'editthiscookie' 
      ? 'This file can be imported directly into EditThisCookie extension.<br><br>'
      : '') +
    'You can now:<br>' +
    '1. Review the JSON structure<br>' +
    '2. Import into ' + (format === 'our' ? 'Session Replay' : 'cookie extension') + '<br>' +
    '3. Share cookies securely (if authorized)' +
    '</div>';
}

// Convert sameSite values between formats
function convertSameSiteToCookieEditor(sameSite) {
  const map = {
    'no_restriction': 'no_restriction',
    'lax': 'lax',
    'strict': 'strict',
    'none': 'no_restriction',
    'unspecified': 'no_restriction'
  };
  return map[sameSite] || 'no_restriction';
}

function convertSameSiteFromCookieEditor(sameSite) {
  // Cookie-Editor uses same values, but just in case
  const map = {
    'no_restriction': 'no_restriction',
    'lax': 'lax',
    'strict': 'strict',
    'none': 'no_restriction',
    'unspecified': 'no_restriction'
  };
  return map[sameSite] || 'no_restriction';
}

function convertSameSiteToEditThisCookie(sameSite) {
  const map = {
    'no_restriction': 'unspecified',
    'lax': 'lax',
    'strict': 'strict',
    'none': 'unspecified'
  };
  return map[sameSite] || 'unspecified';
}

function convertSameSiteFromEditThisCookie(sameSite) {
  const map = {
    'unspecified': 'no_restriction',
    'lax': 'lax',
    'strict': 'strict',
    'no_restriction': 'no_restriction'
  };
  return map[sameSite] || 'no_restriction';
}

// Import cookies from JSON file
function importCookies(file) {
  const reader = new FileReader();
  
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      
      let importedCookies;
      let formatDetected = 'unknown';
      
      // Detect format
      if (Array.isArray(data)) {
        // Array format - could be Cookie-Editor or EditThisCookie
        // EditThisCookie uses "unspecified" for sameSite, Cookie-Editor uses "no_restriction"
        const hasUnspecified = data.some(c => c.sameSite === 'unspecified');
        const hasId = data.some(c => c.id !== undefined);
        
        if (hasUnspecified || hasId) {
          formatDetected = 'editthiscookie';
          importedCookies = data.map(convertFromEditThisCookieFormat);
        } else {
          formatDetected = 'cookie-editor';
          importedCookies = data.map(convertFromCookieEditorFormat);
        }
      } else if (data.cookies && Array.isArray(data.cookies)) {
        // Our format: object with cookies array
        formatDetected = 'our';
        importedCookies = data.cookies;
      } else {
        alert('Invalid cookie file format. Expected either:\n' +
              '1. Cookie-Editor format (array of cookies)\n' +
              '2. EditThisCookie format (array of cookies)\n' +
              '3. Our format (object with "cookies" array)');
        return;
      }
      
      // Load cookies
      cookies = importedCookies;
      
      // Select all imported cookies by default
      cookieSelection.clear();
      for (let i = 0; i < cookies.length; i++) {
        cookieSelection.add(i);
      }
      
      // Clear sessions since we're not loading from HAR
      sessions = [];
      harData = null;
      
      // Update UI
      displaySessions();
      displayCookieSelection();
      updateIncognitoButton();
      
      const formatNames = {
        'cookie-editor': 'Cookie-Editor',
        'editthiscookie': 'EditThisCookie',
        'our': 'Our Format'
      };
      const formatName = formatNames[formatDetected] || 'Unknown';
      
      responsePanel.innerHTML = 
        '<div class="info-box">' +
        '<strong>✅ Cookies Imported</strong><br><br>' +
        'Format detected: ' + formatName + '<br>' +
        'Loaded: ' + cookies.length + ' cookie(s)<br>' +
        'Selected: ' + cookieSelection.size + ' (all by default)<br>' +
        'Source: ' + escapeHtml(file.name) + '<br>' +
        (data.exported ? 'Exported: ' + data.exported + '<br>' : '') +
        '<br>' +
        'Use the Cookie Selection panel to choose which cookies to import.' +
        '</div>';
      
    } catch (error) {
      alert('Error parsing cookie file: ' + error.message);
    }
  };
  
  reader.readAsText(file);
}

// Convert Cookie-Editor format to our internal format
function convertFromCookieEditorFormat(cookieEditorCookie) {
  const ourFormat = {
    name: cookieEditorCookie.name,
    value: cookieEditorCookie.value,
    domain: cookieEditorCookie.domain,
    path: cookieEditorCookie.path || '/',
    secure: cookieEditorCookie.secure || false,
    httpOnly: cookieEditorCookie.httpOnly || false,
    sameSite: convertSameSiteFromCookieEditor(cookieEditorCookie.sameSite || 'no_restriction')
  };
  
  // Add expiration if present
  if (cookieEditorCookie.expirationDate) {
    ourFormat.expirationDate = cookieEditorCookie.expirationDate;
  }
  
  // Build URL for this cookie
  const protocol = ourFormat.secure ? 'https://' : 'http://';
  const urlDomain = ourFormat.domain.startsWith('.') ? ourFormat.domain.substring(1) : ourFormat.domain;
  ourFormat.url = protocol + urlDomain + ourFormat.path;
  
  return ourFormat;
}

// Convert EditThisCookie format to our internal format
function convertFromEditThisCookieFormat(editThisCookie) {
  const ourFormat = {
    name: editThisCookie.name,
    value: editThisCookie.value,
    domain: editThisCookie.domain,
    path: editThisCookie.path || '/',
    secure: editThisCookie.secure || false,
    httpOnly: editThisCookie.httpOnly || false,
    sameSite: convertSameSiteFromEditThisCookie(editThisCookie.sameSite || 'unspecified')
  };
  
  // Add expiration if present
  if (editThisCookie.expirationDate) {
    ourFormat.expirationDate = editThisCookie.expirationDate;
  }
  
  // Build URL for this cookie
  const protocol = ourFormat.secure ? 'https://' : 'http://';
  const urlDomain = ourFormat.domain.startsWith('.') ? ourFormat.domain.substring(1) : ourFormat.domain;
  ourFormat.url = protocol + urlDomain + ourFormat.path;
  
  return ourFormat;
}
