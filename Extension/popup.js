/**
 * Popup Script — ShopMind AI
 * Minimal launcher; main UI lives in the injected sidebar.
 */

const siteStatus = document.getElementById('site-status');
const apiStatus = document.getElementById('api-status');
const openBtn = document.getElementById('open-btn');

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  const url = tab.url?.toLowerCase() || '';
  const supported = url.includes('amazon') || url.includes('flipkart');

  if (supported) {
    siteStatus.textContent = '✓ Supported page detected';
    siteStatus.className = 'status ok';
  } else {
    siteStatus.textContent = '⚠ Navigate to Amazon or Flipkart';
    siteStatus.className = 'status err';
    openBtn.disabled = true;
    openBtn.style.opacity = '0.4';
  }

  // Check backend
  try {
    const r = await fetch('http://localhost:5000/health', { signal: AbortSignal.timeout(3000) });
    if (r.ok) {
      apiStatus.textContent = '✓ AI backend connected';
      apiStatus.className = 'status ok';
    } else {
      apiStatus.textContent = '✗ Backend error (status ' + r.status + ')';
      apiStatus.className = 'status err';
    }
  } catch {
    apiStatus.textContent = '✗ Backend offline — run python backend_api.py';
    apiStatus.className = 'status err';
  }
}

openBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  chrome.tabs.sendMessage(tab.id, { action: 'openSidebar' }, (response) => {
    if (chrome.runtime.lastError) {
      // Inject and retry
      chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] }, () => {
        setTimeout(() => chrome.tabs.sendMessage(tab.id, { action: 'openSidebar' }), 500);
      });
    }
    window.close();
  });
});

init();