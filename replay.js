// Session Replay Tool

const loadHarBtn = document.getElementById('loadHarBtn');
const harFileInput = document.getElementById('harFileInput');
const sessionsList = document.getElementById('sessionsList');
const urlInput = document.getElementById('urlInput');
const bodyInput = document.getElementById('bodyInput');
const sendBtn = document.getElementById('sendBtn');
const responsePanel = document.getElementById('responsePanel');

let harData = null;
let sessions = [];
let selectedSession = null;
let selectedMethod = 'GET';

// Load HAR file
loadHarBtn.addEventListener('click', () => {
  harFileInput.click();
});

harFileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    loadHARFile(e.target.files[0]);
  }
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
      displaySessions();
      
    } catch (error) {
      alert('Error parsing HAR file: ' + error.message);
    }
  };
  
  reader.readAsText(file);
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
  
  sessionsList.innerHTML = '';
  
  sessions.forEach((session, index) => {
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
      metadataHtml;
    
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
  
  responsePanel.innerHTML = 
    '<div class="info-box">' +
    '<strong>Selected:</strong> ' + escapeHtml(selectedSession.type) + '<br>' +
    '<strong>Value:</strong> <code>' + escapeHtml(selectedSession.value) + '</code>' +
    '</div>' +
    '<div style="color: #5f6368;">Configure the request above and click "Send Request" to test this session.</div>';
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
