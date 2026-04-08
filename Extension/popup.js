/**
 * Popup Script for AI Shopping Assistant
 * Handles user interaction and communication with backend API
 */

// Backend API URL
const API_URL = 'http://localhost:5000';

// DOM Elements
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const productInfo = document.getElementById('product-info');
const statusText = document.getElementById('status-text');

// State
let currentProductData = null;
let isProcessing = false;

/**
 * Initialize the popup
 */
async function init() {
    updateStatus('Detecting product...');
    await scrapeProductData();
}

/**
 * Scrape product data from current page
 */
async function scrapeProductData() {
    try {
        // Get current tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab) {
            showProductError('Could not access current tab');
            return;
        }

        // Check if it's a supported site
        const url = tab.url.toLowerCase();
        if (!url.includes('amazon') && !url.includes('flipkart')) {
            showProductError('Navigate to Amazon or Flipkart product page');
            return;
        }

        // Send message to content script
        chrome.tabs.sendMessage(tab.id, { action: 'scrapeNow' }, (response) => {
            if (chrome.runtime.lastError) {
                showProductError('Please refresh the page and try again');
                return;
            }

            if (response && response.success && response.data) {
                currentProductData = response.data;
                displayProductInfo(response.data);
                updateStatus('Product detected!', 'success');
            } else {
                showProductError('Could not extract product data. Please refresh the page.');
            }
        });
    } catch (error) {
        console.error('Error scraping product:', error);
        showProductError('Error detecting product');
    }
}

/**
 * Display product information
 */
function displayProductInfo(data) {
    let html = '';

    if (data.title) {
        html += `<div class="product-title">${escapeHtml(data.title)}</div>`;
    }

    const details = [];
    if (data.price) {
        details.push(`<span class="detail-badge price">${escapeHtml(data.price)}</span>`);
    }
    if (data.rating) {
        const ratingText = data.rating + '★';
        details.push(`<span class="detail-badge rating">${ratingText}</span>`);
    }
    if (data.availability) {
        details.push(`<span class="detail-badge">${escapeHtml(data.availability)}</span>`);
    }

    if (details.length > 0) {
        html += `<div class="product-details">${details.join('')}</div>`;
    }

    if (!html) {
        html = '<p class="loading-text">Basic product info detected</p>';
    }

    productInfo.innerHTML = html;
}

/**
 * Show product section error
 */
function showProductError(message) {
    productInfo.innerHTML = `
        <div class="error-message">
            ⚠️ ${escapeHtml(message)}
        </div>
    `;
    updateStatus('Waiting for product page', 'error');
}

/**
 * Add message to chat
 */
function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'assistant-message'}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = isUser ? '👤' : '🤖';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = content;

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Show typing indicator
 */
function showTyping() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant-message';
    typingDiv.id = 'typing-indicator';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = '🤖';

    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.innerHTML = '<span></span><span></span><span></span>';

    typingDiv.appendChild(avatar);
    typingDiv.appendChild(indicator);
    chatMessages.appendChild(typingDiv);

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Remove typing indicator
 */
function removeTyping() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

/**
 * Send question to backend API
 */
async function sendQuestion(question) {
    if (!currentProductData) {
        return { error: 'No product data available. Please refresh the page.' };
    }

    try {
        const response = await fetch(`${API_URL}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                product_data: {
                    site: currentProductData.site || 'unknown',
                    title: currentProductData.title || 'Unknown',
                    price: currentProductData.price || '',
                    rating: currentProductData.rating || '',
                    review_count: currentProductData.reviewCount || '',
                    description: currentProductData.description || '',
                    features: currentProductData.features || [],
                    availability: currentProductData.availability || '',
                    category: ''
                },
                question: question,
                url: currentProductData.url || ''
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'API request failed');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error sending question:', error);
        return { error: error.message };
    }
}

/**
 * Handle send button click
 */
async function handleSend() {
    const question = userInput.value.trim();
    if (!question || isProcessing) return;

    // Check if backend is likely running
    if (!await checkBackendHealth()) {
        addMessage('⚠️ Cannot connect to the AI server. Please make sure the backend is running:<br><br><code>python backend_api.py</code>', false);
        updateStatus('Backend not connected', 'error');
        return;
    }

    isProcessing = true;
    userInput.value = '';
    sendBtn.disabled = true;

    // Add user message
    addMessage(escapeHtml(question), true);

    // Show typing indicator
    showTyping();
    updateStatus('AI is thinking...');

    // Send question to API
    const response = await sendQuestion(question);

    // Remove typing indicator
    removeTyping();

    // Display response
    if (response.error) {
        addMessage(`⚠️ Error: ${escapeHtml(response.error)}`, false);
        updateStatus('Error occurred', 'error');
    } else {
        // Format the response (convert newlines to <br>)
        const formattedAnswer = response.answer
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        addMessage(formattedAnswer, false);
        updateStatus('Ready', 'success');
    }

    isProcessing = false;
    sendBtn.disabled = false;
    userInput.focus();
}

/**
 * Check backend API health
 */
async function checkBackendHealth() {
    try {
        const response = await fetch(`${API_URL}/health`, {
            method: 'GET',
            timeout: 3000
        });
        return response.ok;
    } catch {
        return false;
    }
}

/**
 * Update status text
 */
function updateStatus(message, type = '') {
    statusText.textContent = message;
    statusText.className = 'status-text ' + type;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Handle Enter key (Send on Enter, Shift+Enter for new line)
 */
function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSend();
    }
}

// Event Listeners
sendBtn.addEventListener('click', handleSend);
userInput.addEventListener('keypress', handleKeyPress);

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
