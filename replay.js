// Session Replay Tool

const loadHarBtn = document.getElementById('loadHarBtn');
const harFileInput = document.getElementById('harFileInput');
const sessionsList = document.getElementById('sessionsList');
const urlInput = document.getElementById('urlInput');
const bodyInput = document.getElementById('bodyInput');
const sendBtn = document.getElementById('sendBtn');
const responsePanel = document.getElementById('responsePanel');
const launchIncognitoBtn = document.getElementById('launchIncognitoBtn');
const viewCookiesBtn = document.getElementById('viewCookiesBtn');
const exportCookiesBtn = document.getElementById('exportCookiesBtn');
const importCookiesBtn = document.getElementById('importCookiesBtn');
const cookiesFileInput = document.getElementById('cookiesFileInput');

let harData = null;
let sessions = [];
let cookies = [];
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

// Launch incognito session
launchIncognitoBtn.addEventListener('click', async () => {
  await launchIncognitoSession();
});

// View cookies
viewCookiesBtn.addEventListener('click', () => {
  displayCookieList();
});

// Export cookies
exportCookiesBtn.addEventListener('click', () => {
  exportCookies();
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
      displaySessions();
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
  if (cookies.length > 0) {
    launchIncognitoBtn.disabled = false;
    launchIncognitoBtn.textContent = '🕵️ Launch Incognito with ' + cookies.length + ' Cookie' + (cookies.length !== 1 ? 's' : '');
  } else {
    launchIncognitoBtn.disabled = true;
    launchIncognitoBtn.textContent = '🕵️ No cookies found in HAR';
  }
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

// Launch incognito session with cookies
async function launchIncognitoSession() {
  if (cookies.length === 0) {
    alert('No cookies found in HAR file');
    return;
  }
  
  // Show confirmation with cookie details
  const domainCount = {};
  cookies.forEach(cookie => {
    const domain = cookie.domain;
    domainCount[domain] = (domainCount[domain] || 0) + 1;
  });
  
  const domainList = Object.entries(domainCount)
    .map(([domain, count]) => domain + ' (' + count + ' cookie' + (count !== 1 ? 's' : '') + ')')
    .join('\n');
  
  const confirmed = confirm(
    'Launch incognito session with ' + cookies.length + ' cookie(s)?\n\n' +
    'Domains:\n' + domainList + '\n\n' +
    'You will browse as the user from the HAR file.\n' +
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
    
    // Create incognito window
    const incognitoWindow = await chrome.windows.create({
      url: 'about:blank',
      incognito: true,
      focused: true,
      width: 1200,
      height: 800
    });
    
    // Get the incognito tab
    const tabs = await chrome.tabs.query({ windowId: incognitoWindow.id });
    const incognitoTab = tabs[0];
    
    // Wait for window to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get all cookie stores to find the incognito one
    const allStores = await chrome.cookies.getAllCookieStores();
    const incognitoStore = allStores.find(store => 
      store.tabIds.includes(incognitoTab.id)
    );
    
    if (!incognitoStore) {
      throw new Error('Could not find incognito cookie store');
    }
    
    // Set all cookies
    let successCount = 0;
    let failCount = 0;
    let verifiedCount = 0;
    const errors = [];
    
    console.log('=== Cookie Import Debug ===');
    console.log('Total cookies to import:', cookies.length);
    console.log('Incognito store ID:', incognitoStore.id);
    
    for (const cookie of cookies) {
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
          storeId: incognitoStore.id
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
    for (const cookie of cookies) {
      try {
        const urlDomain = cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain;
        const cookieProtocol = cookie.secure ? 'https://' : 'http://';
        const cookieUrl = cookieProtocol + urlDomain + (cookie.path || '/');
        
        const readCookies = await chrome.cookies.getAll({
          url: cookieUrl,
          name: cookie.name,
          storeId: incognitoStore.id
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
    console.log('Verified:', verifiedCount, '/', cookies.length, 'cookies');
    
    // Navigate to start URL after cookies are set and verified
    await chrome.tabs.update(incognitoTab.id, { url: startUrl });
    
    // Show results
    const resultHtml = 
      '<div class="info-box">' +
      '<strong>✅ Incognito Session Launched</strong><br><br>' +
      'Cookies imported: ' + successCount + ' / ' + cookies.length + '<br>' +
      'Cookies verified: ' + verifiedCount + ' / ' + successCount + '<br>' +
      'URL: <code>' + escapeHtml(startUrl) + '</code><br><br>' +
      '<strong>What now?</strong><br>' +
      '1. The incognito window has opened<br>' +
      '2. Cookies are set - you should be logged in<br>' +
      '3. Navigate to reproduce the issue<br>' +
      '4. Close the incognito window when done<br><br>' +
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
    
    launchIncognitoBtn.textContent = '🕵️ Launch Another Session';
    launchIncognitoBtn.disabled = false;
    
  } catch (error) {
    console.error('Incognito session error:', error);
    alert('Failed to launch incognito session: ' + error.message);
    launchIncognitoBtn.textContent = '🕵️ Launch Incognito with Cookies';
    launchIncognitoBtn.disabled = false;
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
  
  // Group cookies by domain
  const byDomain = {};
  cookies.forEach(cookie => {
    if (!byDomain[cookie.domain]) {
      byDomain[cookie.domain] = [];
    }
    byDomain[cookie.domain].push(cookie);
  });
  
  let html = '<div class="info-box">' +
    '<strong>Cookies to Import (' + cookies.length + ' total)</strong><br>' +
    'These will be set in the incognito session' +
    '</div>';
  
  for (const [domain, domainCookies] of Object.entries(byDomain)) {
    html += '<div style="margin-top: 16px; margin-bottom: 8px;">' +
            '<strong style="color: #1a73e8;">' + escapeHtml(domain) + '</strong> ' +
            '<span style="color: #5f6368; font-size: 11px;">(' + domainCookies.length + ' cookie' + (domainCookies.length !== 1 ? 's' : '') + ')</span>' +
            '</div>';
    
    html += '<div class="headers-list">';
    
    domainCookies.forEach(cookie => {
      const flags = [];
      if (cookie.secure) flags.push('Secure');
      if (cookie.httpOnly) flags.push('HttpOnly');
      if (cookie.sameSite !== 'no_restriction') flags.push('SameSite=' + cookie.sameSite);
      
      const truncatedValue = cookie.value.length > 60 
        ? cookie.value.substring(0, 60) + '...' 
        : cookie.value;
      
      html += '<div class="header-row">' +
              '<div class="header-name">' + escapeHtml(cookie.name) + '</div>' +
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
function exportCookies() {
  if (cookies.length === 0) {
    alert('No cookies to export. Load a HAR file first.');
    return;
  }
  
  const exportData = {
    version: '1.0',
    exported: new Date().toISOString(),
    totalCookies: cookies.length,
    cookies: cookies
  };
  
  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const filename = 'session-cookies-' + timestamp + '.json';
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  responsePanel.innerHTML = 
    '<div class="info-box">' +
    '<strong>✅ Cookies Exported</strong><br><br>' +
    'File: <code>' + filename + '</code><br>' +
    'Cookies: ' + cookies.length + '<br><br>' +
    'You can now:<br>' +
    '1. Review the JSON structure<br>' +
    '2. Test cookie import functionality<br>' +
    '3. Share cookies securely (if authorized)' +
    '</div>';
}

// Import cookies from JSON file
function importCookies(file) {
  const reader = new FileReader();
  
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      
      // Validate format
      if (!data.cookies || !Array.isArray(data.cookies)) {
        alert('Invalid cookie file format. Expected "cookies" array.');
        return;
      }
      
      // Load cookies
      cookies = data.cookies;
      
      // Clear sessions since we're not loading from HAR
      sessions = [];
      harData = null;
      
      // Update UI
      displaySessions();
      updateIncognitoButton();
      
      responsePanel.innerHTML = 
        '<div class="info-box">' +
        '<strong>✅ Cookies Imported</strong><br><br>' +
        'Loaded: ' + cookies.length + ' cookie(s)<br>' +
        'Source: ' + escapeHtml(file.name) + '<br>' +
        (data.exported ? 'Exported: ' + data.exported + '<br>' : '') +
        '<br>' +
        'Click "View Cookies" to review or "Launch Incognito" to test.' +
        '</div>';
      
    } catch (error) {
      alert('Error parsing cookie file: ' + error.message);
    }
  };
  
  reader.readAsText(file);
}
