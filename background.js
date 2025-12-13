// Background service worker for automatic HAR capture

let isRecording = false;
let attachedTabId = null;
let capturedData = {
  requests: new Map(),
  startTime: null
};

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getState') {
    sendResponse({
      isRecording: isRecording,
      requestCount: capturedData.requests.size,
      startTime: capturedData.startTime
    });
  } else if (request.action === 'getRequests') {
    // Convert Map to object for transmission
    const requestsObj = {};
    for (const [key, value] of capturedData.requests.entries()) {
      requestsObj[key] = value;
    }
    sendResponse({
      success: true,
      requests: requestsObj
    });
  } else if (request.action === 'startRecording') {
    startRecording().then(result => {
      sendResponse(result);
    });
    return true; // Keep channel open for async response
  } else if (request.action === 'stopRecording') {
    stopRecording().then(result => {
      sendResponse(result);
    });
    return true;
  } else if (request.action === 'exportHAR') {
    exportHAR().then(result => {
      sendResponse(result);
    });
    return true;
  } else if (request.action === 'clearData') {
    capturedData.requests.clear();
    sendResponse({ success: true });
  }
});

// Start recording network traffic
async function startRecording() {
  try {
    // Get current active tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) {
      return { success: false, error: 'No active tab found' };
    }

    const tabId = tabs[0].id;
    attachedTabId = tabId;

    // Attach debugger to the tab
    await chrome.debugger.attach({ tabId: tabId }, '1.3');

    // Enable Network domain
    await chrome.debugger.sendCommand({ tabId: tabId }, 'Network.enable');

    // Clear previous data
    capturedData.requests.clear();
    capturedData.startTime = new Date().toISOString();
    isRecording = true;

    // Update icon to show recording state
    chrome.action.setIcon({ path: 'icon-recording.png' });
    chrome.action.setBadgeText({ text: 'REC' });
    chrome.action.setBadgeBackgroundColor({ color: '#ff0000' });

    return { success: true };
  } catch (error) {
    console.error('Error starting recording:', error);
    return { success: false, error: error.message };
  }
}

// Stop recording
async function stopRecording() {
  try {
    if (attachedTabId !== null) {
      await chrome.debugger.detach({ tabId: attachedTabId });
      attachedTabId = null;
    }

    isRecording = false;

    // Reset icon
    chrome.action.setIcon({ path: 'icon128.png' });
    chrome.action.setBadgeText({ text: '' });

    return { success: true };
  } catch (error) {
    console.error('Error stopping recording:', error);
    return { success: false, error: error.message };
  }
}

// Listen to Network events from debugger
chrome.debugger.onEvent.addListener((source, method, params) => {
  if (!isRecording) return;

  if (method === 'Network.requestWillBeSent') {
    // Store request info
    const requestId = params.requestId;
    capturedData.requests.set(requestId, {
      requestId: requestId,
      request: params.request,
      initiator: params.initiator,
      timestamp: params.timestamp,
      wallTime: params.wallTime,
      type: params.type,
      frameId: params.frameId
    });
  } else if (method === 'Network.requestWillBeSentExtraInfo') {
    // Additional request info (headers, cookies)
    const requestId = params.requestId;
    const entry = capturedData.requests.get(requestId);
    if (entry) {
      entry.extraRequestInfo = params;
    }
  } else if (method === 'Network.responseReceived') {
    // Add response info
    const requestId = params.requestId;
    const entry = capturedData.requests.get(requestId);
    if (entry) {
      entry.response = params.response;
      entry.responseTimestamp = params.timestamp;
    }
  } else if (method === 'Network.responseReceivedExtraInfo') {
    // Additional response info (headers, cookies)
    const requestId = params.requestId;
    const entry = capturedData.requests.get(requestId);
    if (entry) {
      entry.extraResponseInfo = params;
    }
  } else if (method === 'Network.loadingFinished') {
    // Mark as finished
    const requestId = params.requestId;
    const entry = capturedData.requests.get(requestId);
    if (entry) {
      entry.loadingFinished = true;
      entry.encodedDataLength = params.encodedDataLength;
      entry.finishedTimestamp = params.timestamp;

      // Get response body - ALWAYS attempt to get it
      if (attachedTabId !== null) {
        chrome.debugger.sendCommand(
          { tabId: attachedTabId },
          'Network.getResponseBody',
          { requestId: requestId }
        ).then(result => {
          if (result && entry) {
            entry.responseBody = result.body;
            entry.responseBodyIsBase64 = result.base64Encoded || false;
          }
        }).catch(error => {
          // Some requests don't have response bodies (redirects, 204s, etc.)
          // This is expected, not an error
        });

        // Also try to get request POST data if this was a POST/PUT/PATCH
        if (entry.request && ['POST', 'PUT', 'PATCH'].includes(entry.request.method)) {
          chrome.debugger.sendCommand(
            { tabId: attachedTabId },
            'Network.getRequestPostData',
            { requestId: requestId }
          ).then(result => {
            if (result && result.postData && entry) {
              entry.requestPostData = result.postData;
            }
          }).catch(error => {
            // No POST data or unavailable
          });
        }
      }
    }
  } else if (method === 'Network.loadingFailed') {
    // Mark as failed
    const requestId = params.requestId;
    const entry = capturedData.requests.get(requestId);
    if (entry) {
      entry.loadingFailed = true;
      entry.errorText = params.errorText;
      entry.canceled = params.canceled;
    }
  } else if (method === 'Network.dataReceived') {
    // Track data chunks received
    const requestId = params.requestId;
    const entry = capturedData.requests.get(requestId);
    if (entry) {
      if (!entry.dataChunks) {
        entry.dataChunks = [];
      }
      entry.dataChunks.push({
        dataLength: params.dataLength,
        encodedDataLength: params.encodedDataLength,
        timestamp: params.timestamp
      });
    }
  } else if (method === 'Network.requestServedFromCache') {
    // Mark as served from cache
    const requestId = params.requestId;
    const entry = capturedData.requests.get(requestId);
    if (entry) {
      entry.servedFromCache = true;
    }
  }
});

// Handle debugger detach
chrome.debugger.onDetach.addListener((source, reason) => {
  if (source.tabId === attachedTabId) {
    isRecording = false;
    attachedTabId = null;
    chrome.action.setBadgeText({ text: '' });
  }
});

// Export HAR file
async function exportHAR() {
  try {
    const har = {
      log: {
        version: '1.2',
        creator: {
          name: 'Network Support Extension',
          version: '1.0.0'
        },
        browser: {
          name: 'Chrome',
          version: navigator.userAgent
        },
        pages: [],
        entries: []
      }
    };

    // Convert captured data to HAR format
    for (const [requestId, entry] of capturedData.requests.entries()) {
      if (!entry.request) continue;

      // Get request headers - merge all sources
      const requestHeaders = [];
      if (entry.request.headers) {
        for (const [name, value] of Object.entries(entry.request.headers)) {
          requestHeaders.push({ name: name, value: value });
        }
      }
      if (entry.extraRequestInfo && entry.extraRequestInfo.headers) {
        for (const [name, value] of Object.entries(entry.extraRequestInfo.headers)) {
          if (!requestHeaders.find(h => h.name.toLowerCase() === name.toLowerCase())) {
            requestHeaders.push({ name: name, value: value });
          }
        }
      }

      // Get response headers - merge all sources
      const responseHeaders = [];
      if (entry.response && entry.response.headers) {
        for (const [name, value] of Object.entries(entry.response.headers)) {
          responseHeaders.push({ name: name, value: value });
        }
      }
      if (entry.extraResponseInfo && entry.extraResponseInfo.headers) {
        for (const [name, value] of Object.entries(entry.extraResponseInfo.headers)) {
          if (!responseHeaders.find(h => h.name.toLowerCase() === name.toLowerCase())) {
            responseHeaders.push({ name: name, value: value });
          }
        }
      }

      // Get cookies from extra info (more complete)
      let requestCookies = [];
      if (entry.extraRequestInfo && entry.extraRequestInfo.associatedCookies) {
        requestCookies = entry.extraRequestInfo.associatedCookies.map(c => ({
          name: c.cookie.name,
          value: c.cookie.value
        }));
      } else {
        requestCookies = parseCookies(entry.request.headers);
      }

      let responseCookies = [];
      if (entry.extraResponseInfo && entry.extraResponseInfo.cookies) {
        responseCookies = entry.extraResponseInfo.cookies.map(c => ({
          name: c.name,
          value: c.value,
          path: c.path || '',
          domain: c.domain || '',
          expires: c.expires ? new Date(c.expires * 1000).toISOString() : '',
          httpOnly: c.httpOnly || false,
          secure: c.secure || false,
          sameSite: c.sameSite || ''
        }));
      } else if (entry.response) {
        responseCookies = parseSetCookies(entry.response.headers);
      }

      // Parse query string
      const queryString = parseQueryString(entry.request.url);

      // Get POST data comprehensively
      let postData = null;
      let requestBodySize = 0;
      
      if (entry.requestPostData) {
        // Got POST data from Network.getRequestPostData
        const contentType = entry.request.headers['content-type'] || '';
        postData = {
          mimeType: contentType,
          text: entry.requestPostData,
          params: []
        };
        requestBodySize = entry.requestPostData.length;

        // Try to parse form parameters
        if (contentType.includes('application/x-www-form-urlencoded')) {
          try {
            const params = new URLSearchParams(entry.requestPostData);
            params.forEach((value, name) => {
              postData.params.push({ name: name, value: value });
            });
          } catch (e) {
            // Not parseable
          }
        }
      } else if (entry.request.postData) {
        // Fallback to postData from request
        postData = {
          mimeType: entry.request.headers['content-type'] || 'application/octet-stream',
          text: entry.request.postData,
          params: []
        };
        requestBodySize = entry.request.postData.length;
      } else if (entry.request.hasPostData) {
        // There is POST data but we couldn't get it
        postData = {
          mimeType: entry.request.headers['content-type'] || 'application/octet-stream',
          text: '[Binary or unavailable POST data]',
          params: []
        };
      }

      const harEntry = {
        startedDateTime: new Date(entry.wallTime * 1000).toISOString(),
        time: 0,
        request: {
          method: entry.request.method || 'GET',
          url: entry.request.url || '',
          httpVersion: entry.response?.protocol || 'HTTP/1.1',
          cookies: requestCookies,
          headers: requestHeaders,
          queryString: queryString,
          headersSize: -1,
          bodySize: requestBodySize
        },
        response: {
          status: entry.response?.status || 0,
          statusText: entry.response?.statusText || '',
          httpVersion: entry.response?.protocol || 'HTTP/1.1',
          cookies: responseCookies,
          headers: responseHeaders,
          content: {
            size: entry.encodedDataLength || 0,
            mimeType: entry.response?.mimeType || 'application/octet-stream',
            text: entry.responseBody || '',
            encoding: entry.responseBodyIsBase64 ? 'base64' : undefined,
            compression: entry.response?.headers['content-encoding']
          },
          redirectURL: entry.response?.headers?.location || '',
          headersSize: -1,
          bodySize: entry.encodedDataLength || 0
        },
        cache: entry.servedFromCache ? { beforeRequest: null } : {},
        timings: {
          blocked: -1,
          dns: -1,
          connect: -1,
          send: 0,
          wait: entry.responseTimestamp ? (entry.responseTimestamp - entry.timestamp) * 1000 : 0,
          receive: entry.finishedTimestamp && entry.responseTimestamp ? (entry.finishedTimestamp - entry.responseTimestamp) * 1000 : 0,
          ssl: -1
        },
        serverIPAddress: entry.response?.remoteIPAddress || '',
        _initiator: entry.initiator,
        _priority: entry.request.initialPriority,
        _resourceType: entry.type
      };

      // Calculate total time
      if (entry.finishedTimestamp && entry.timestamp) {
        harEntry.time = (entry.finishedTimestamp - entry.timestamp) * 1000;
      }

      // Add POST data if present
      if (postData) {
        harEntry.request.postData = postData;
      }

      // Add error info if failed
      if (entry.loadingFailed) {
        harEntry._error = entry.errorText;
        harEntry._canceled = entry.canceled;
      }

      har.log.entries.push(harEntry);
    }

    return {
      success: true,
      har: har,
      count: har.log.entries.length
    };
  } catch (error) {
    console.error('Error exporting HAR:', error);
    return { success: false, error: error.message };
  }
}

// Helper functions
function formatHeaders(headers) {
  if (!headers) return [];
  const result = [];
  for (const [name, value] of Object.entries(headers)) {
    result.push({ name: name, value: value });
  }
  return result;
}

function parseCookies(headers) {
  const cookies = [];
  if (!headers || !headers['cookie']) return cookies;

  const cookieString = headers['cookie'];
  const parts = cookieString.split(';');
  
  for (const part of parts) {
    const [name, ...valueParts] = part.trim().split('=');
    if (name) {
      cookies.push({
        name: name,
        value: valueParts.join('=') || ''
      });
    }
  }
  
  return cookies;
}

function parseSetCookies(headers) {
  const cookies = [];
  if (!headers || !headers['set-cookie']) return cookies;

  const setCookieValue = headers['set-cookie'];
  const setCookieArray = Array.isArray(setCookieValue) ? setCookieValue : [setCookieValue];

  for (const cookieString of setCookieArray) {
    const parts = cookieString.split(';');
    const [name, ...valueParts] = parts[0].trim().split('=');

    const cookie = {
      name: name || '',
      value: valueParts.join('=') || '',
      path: '',
      domain: '',
      expires: '',
      httpOnly: false,
      secure: false
    };

    for (let i = 1; i < parts.length; i++) {
      const [attrName, attrValue] = parts[i].trim().split('=');
      const attrNameLower = attrName.toLowerCase();

      if (attrNameLower === 'path') {
        cookie.path = attrValue || '';
      } else if (attrNameLower === 'domain') {
        cookie.domain = attrValue || '';
      } else if (attrNameLower === 'expires') {
        cookie.expires = attrValue || '';
      } else if (attrNameLower === 'httponly') {
        cookie.httpOnly = true;
      } else if (attrNameLower === 'secure') {
        cookie.secure = true;
      }
    }

    cookies.push(cookie);
  }

  return cookies;
}

function parseQueryString(url) {
  const queryString = [];
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.forEach((value, name) => {
      queryString.push({ name: name, value: value });
    });
  } catch (error) {
    // Invalid URL
  }
  return queryString;
}
