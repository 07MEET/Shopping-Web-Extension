/**
 * Background Service Worker for ShopMind AI
 */

chrome.runtime.onInstalled.addListener((details) => {
  console.log('[ShopMind AI] Installed:', details.reason);
  chrome.storage.local.set({ lastScrapedData: null });

  chrome.contextMenus.create({
    id: 'analyzeProduct',
    title: '✦ Ask ShopMind AI about this product',
    contexts: ['page'],
    documentUrlPatterns: [
      'https://www.amazon.in/*',
      'https://www.amazon.com/*',
      'https://www.flipkart.com/*'
    ]
  });
});

// Clicking toolbar icon → open sidebar in current tab
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: 'openSidebar' }, (response) => {
    if (chrome.runtime.lastError) {
      // Content script not injected yet — inject it first
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
    }
  });
});

// Handle messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getScrapedData') {
    chrome.storage.local.get(['lastScrapedData'], (result) => {
      sendResponse({ success: true, data: result.lastScrapedData });
    });
    return true;
  }

  if (request.action === 'saveScrapedData') {
    chrome.storage.local.set({ lastScrapedData: request.data }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.action === 'checkApiHealth') {
    fetch('http://localhost:5000/health', { method: 'GET' })
      .then(r => sendResponse({ success: r.ok, status: r.status }))
      .catch(e => sendResponse({ success: false, error: e.message }));
    return true;
  }
});

// Auto-open sidebar when navigating to a product page
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const url = tab.url.toLowerCase();
    if (url.includes('amazon') || url.includes('flipkart')) {
      chrome.tabs.sendMessage(tabId, { action: 'scrapeNow' }, (response) => {
        if (chrome.runtime.lastError) return;
        if (response?.data) {
          chrome.storage.local.set({ lastScrapedData: response.data });
        }
      });
    }
  }
});

// Context menu → open sidebar
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'analyzeProduct') {
    chrome.tabs.sendMessage(tab.id, { action: 'openSidebar' });
  }
});

console.log('[ShopMind AI] Background worker started');