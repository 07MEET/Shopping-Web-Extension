/**
 * Background Service Worker for AI Shopping Assistant
 * Handles communication between content scripts and popup
 */

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
    console.log('[AI Shopping Assistant] Extension installed:', details.reason);

    // Set default state
    chrome.storage.local.set({
        lastScrapedData: null,
        apiConnected: false
    });
});

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[AI Shopping Assistant] Message received:', request);

    if (request.action === 'getScrapedData') {
        // Retrieve last scraped data from storage
        chrome.storage.local.get(['lastScrapedData'], (result) => {
            sendResponse({
                success: true,
                data: result.lastScrapedData
            });
        });
        return true; // Keep message channel open for async response
    }

    if (request.action === 'saveScrapedData') {
        // Save scraped data to storage
        chrome.storage.local.set({
            lastScrapedData: request.data
        }, () => {
            sendResponse({ success: true });
        });
        return true;
    }

    if (request.action === 'checkApiHealth') {
        // Check if backend API is reachable
        fetch('http://localhost:5000/health', {
            method: 'GET',
            timeout: 3000
        })
        .then(response => {
            sendResponse({
                success: response.ok,
                status: response.status
            });
        })
        .catch(error => {
            sendResponse({
                success: false,
                error: error.message
            });
        });
        return true; // Keep message channel open for async response
    }

    if (request.action === 'openOptions') {
        // Open options page if needed in future
        chrome.runtime.openOptionsPage();
        sendResponse({ success: true });
    }
});

// Handle tab updates - re-scrape when navigating to new product pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        const url = tab.url.toLowerCase();
        if (url.includes('amazon') || url.includes('flipkart')) {
            // Notify content script to scrape
            chrome.tabs.sendMessage(tabId, { action: 'scrapeNow' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.log('[AI Shopping Assistant] Content script not ready');
                } else if (response && response.success && response.data) {
                    // Save scraped data
                    chrome.storage.local.set({
                        lastScrapedData: response.data
                    });
                }
            });
        }
    }
});

// Context menu for quick actions (optional feature)
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'analyzeProduct',
        title: 'Ask AI about this product',
        contexts: ['page'],
        documentUrlPatterns: [
            'https://www.amazon.in/*',
            'https://www.amazon.com/*',
            'https://www.flipkart.com/*'
        ]
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'analyzeProduct') {
        // Open popup programmatically (user still needs to click extension icon)
        // This is a workaround since we can't directly open popup
        chrome.tabs.sendMessage(tab.id, { action: 'showNotification' }, () => {
            if (chrome.runtime.lastError) {
                console.log('[AI Shopping Assistant] Notification failed');
            }
        });
    }
});

console.log('[AI Shopping Assistant] Background service worker started');
