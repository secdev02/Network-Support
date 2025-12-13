// Popup script for Network Support Extension

let isRecording = false;
let startTime = null;
let durationInterval = null;

const toggleBtn = document.getElementById('toggleBtn');
const exportBtn = document.getElementById('exportBtn');
const clearBtn = document.getElementById('clearBtn');
const viewLogBtn = document.getElementById('viewLogBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const replayBtn = document.getElementById('replayBtn');
const statusText = document.getElementById('statusText');
const statusDot = document.getElementById('statusDot');
const requestCount = document.getElementById('requestCount');
const durationDiv = document.getElementById('duration');

// Initialize popup
async function initialize() {
  const state = await sendMessage({ action: 'getState' });
  updateUI(state);
  
  if (state.isRecording) {
    startTime = new Date(state.startTime);
    startDurationTimer();
  }
}

// Toggle recording
toggleBtn.addEventListener('click', async () => {
  if (!isRecording) {
    toggleBtn.disabled = true;
    const result = await sendMessage({ action: 'startRecording' });
    
    if (result.success) {
      isRecording = true;
      startTime = new Date();
      statusText.textContent = 'Recording';
      statusDot.classList.add('recording');
      toggleBtn.textContent = 'Stop recording';
      toggleBtn.className = 'danger';
      startDurationTimer();
    } else {
      alert('Failed to start recording: ' + (result.error || 'Unknown error'));
    }
    
    toggleBtn.disabled = false;
  } else {
    toggleBtn.disabled = true;
    const result = await sendMessage({ action: 'stopRecording' });
    
    if (result.success) {
      isRecording = false;
      statusText.textContent = 'Not recording';
      statusDot.classList.remove('recording');
      toggleBtn.textContent = 'Start recording';
      toggleBtn.className = 'primary';
      stopDurationTimer();
    } else {
      alert('Failed to stop recording: ' + (result.error || 'Unknown error'));
    }
    
    toggleBtn.disabled = false;
  }
  
  // Update request count
  const state = await sendMessage({ action: 'getState' });
  updateRequestCount(state.requestCount);
});

// View live log
viewLogBtn.addEventListener('click', () => {
  chrome.windows.create({
    url: 'logger.html',
    type: 'popup',
    width: 1000,
    height: 700
  });
});

// Analyze HAR
analyzeBtn.addEventListener('click', () => {
  chrome.windows.create({
    url: 'analyzer.html',
    type: 'popup',
    width: 1200,
    height: 800
  });
});

// Session Replay
replayBtn.addEventListener('click', () => {
  chrome.windows.create({
    url: 'replay.html',
    type: 'popup',
    width: 1200,
    height: 800
  });
});

// Export HAR file
exportBtn.addEventListener('click', async () => {
  exportBtn.disabled = true;
  const originalText = exportBtn.textContent;
  exportBtn.textContent = 'Exporting...';
  
  const result = await sendMessage({ action: 'exportHAR' });
  
  if (result.success) {
    // Create download
    const harJSON = JSON.stringify(result.har, null, 2);
    const blob = new Blob([harJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = 'network-capture-' + timestamp + '.har';
    
    // Trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    exportBtn.textContent = 'Exported';
    setTimeout(() => {
      exportBtn.textContent = originalText;
    }, 2000);
  } else {
    alert('Failed to export HAR: ' + (result.error || 'Unknown error'));
    exportBtn.textContent = originalText;
  }
  
  exportBtn.disabled = false;
});

// Clear data
clearBtn.addEventListener('click', async () => {
  if (confirm('Clear all captured data?')) {
    await sendMessage({ action: 'clearData' });
    updateRequestCount(0);
  }
});

// Update UI based on state
function updateUI(state) {
  isRecording = state.isRecording;
  
  if (isRecording) {
    statusText.textContent = 'Recording';
    statusDot.classList.add('recording');
    toggleBtn.textContent = 'Stop recording';
    toggleBtn.className = 'danger';
  } else {
    statusText.textContent = 'Not recording';
    statusDot.classList.remove('recording');
    toggleBtn.textContent = 'Start recording';
    toggleBtn.className = 'primary';
  }
  
  updateRequestCount(state.requestCount);
}

// Update request count
function updateRequestCount(count) {
  requestCount.textContent = count;
}

// Start duration timer
function startDurationTimer() {
  durationInterval = setInterval(updateDuration, 1000);
  updateDuration();
}

// Stop duration timer
function stopDurationTimer() {
  if (durationInterval) {
    clearInterval(durationInterval);
    durationInterval = null;
  }
}

// Update duration display
function updateDuration() {
  if (!startTime) return;
  
  const now = new Date();
  const seconds = Math.floor((now - startTime) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    durationDiv.textContent = hours + 'h ' + remainingMinutes + 'm';
  } else if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    durationDiv.textContent = minutes + 'm ' + remainingSeconds + 's';
  } else {
    durationDiv.textContent = seconds + 's';
  }
}

// Send message to background script
function sendMessage(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      resolve(response || {});
    });
  });
}

// Auto-refresh request count while recording
setInterval(async () => {
  if (isRecording) {
    const state = await sendMessage({ action: 'getState' });
    updateRequestCount(state.requestCount);
  }
}, 2000);

// Initialize
initialize();
