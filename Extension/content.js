/**
 * Content Script for AI Shopping Assistant
 * Injects a floating sidebar UI + scrapes product data
 */

let scrapedData = null;
let sidebarOpen = false;
let sidebarEl = null;
let conversationHistory = [];

// ─── INJECT SIDEBAR ──────────────────────────────────────────────────────────
function injectSidebar() {
  if (document.getElementById('aishopper-root')) return;

  // Inject styles
  const style = document.createElement('style');
  style.id = 'aishopper-styles';
  style.textContent = getSidebarCSS();
  document.head.appendChild(style);

  // Build DOM
  const root = document.createElement('div');
  root.id = 'aishopper-root';
  root.innerHTML = getSidebarHTML();
  document.body.appendChild(root);

  sidebarEl = root;

  // Attach events
  document.getElementById('aishopper-toggle').addEventListener('click', toggleSidebar);
  document.getElementById('aishopper-close').addEventListener('click', closeSidebar);
  document.getElementById('aishopper-send').addEventListener('click', handleSend);
  document.getElementById('aishopper-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  });

  // Quick prompts
  root.querySelectorAll('.aishopper-quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('aishopper-input').value = btn.dataset.q;
      handleSend();
    });
  });

  // Auto-detect product
  setTimeout(() => {
    const data = scrapeProductData();
    if (data) renderProduct(data);
  }, 1600);
}

function toggleSidebar() {
  sidebarOpen ? closeSidebar() : openSidebar();
}

function openSidebar() {
  sidebarOpen = true;
  document.getElementById('aishopper-panel').classList.add('open');
  document.getElementById('aishopper-toggle').classList.add('active');

  const url = window.location.href.toLowerCase();
  const supported = url.includes('amazon') || url.includes('flipkart');

  if (!supported) {
    document.getElementById('aishopper-product').innerHTML = `
      <div class="aishopper-wrong-site">
        <div class="aishopper-wrong-icon">🛍️</div>
        <div class="aishopper-wrong-title">Open a product page first</div>
        <div class="aishopper-wrong-desc">ShopMind AI works on:</div>
        <div class="aishopper-site-pills">
          <a href="https://www.amazon.in" target="_blank" class="aishopper-site-pill">🛒 Amazon</a>
          <a href="https://www.flipkart.com" target="_blank" class="aishopper-site-pill">🏪 Flipkart</a>
        </div>
        <div class="aishopper-wrong-hint">Navigate to a product page, then click the ✦ button.</div>
      </div>
    `;
    document.querySelector('.aishopper-quick-prompts').style.display = 'none';
    document.querySelector('.aishopper-input-row').style.display = 'none';
    return;
  }

  document.querySelector('.aishopper-quick-prompts').style.display = '';
  document.querySelector('.aishopper-input-row').style.display = '';
  const data = scrapeProductData();
  if (data) renderProduct(data);
}

function closeSidebar() {
  sidebarOpen = false;
  document.getElementById('aishopper-panel').classList.remove('open');
  document.getElementById('aishopper-toggle').classList.remove('active');
}

// ─── PRODUCT SCRAPING ────────────────────────────────────────────────────────
function scrapeProductData() {
  const url = window.location.href;
  let data = null;
  if (url.includes('amazon')) data = scrapeAmazon();
  else if (url.includes('flipkart')) data = scrapeFlipkart();
  else data = scrapeGeneric();

  if (data) {
    data.url = url;
    data.scrapedAt = new Date().toISOString();
    scrapedData = data;
  }
  return data;
}

function scrapeAmazon() {
  try {
    const data = { site: 'amazon', title: '', price: '', rating: '', reviewCount: '', description: '', features: [], availability: '' };
    const titleEl = document.getElementById('productTitle') || document.querySelector('h1[data-automation-id="product-title"]');
    if (titleEl) data.title = cleanText(titleEl.textContent);

    for (const sel of ['.a-price-whole', '#priceblock_ourprice', '#priceblock_dealprice', '.a-price .a-offscreen']) {
      const el = document.querySelector(sel);
      if (el) { data.price = cleanText(el.textContent); break; }
    }

    const ratingEl = document.querySelector('[data-hook="average-star-rating"] .a-icon-alt') || document.querySelector('.a-icon-alt');
    if (ratingEl) { const m = ratingEl.textContent.match(/([\d.]+)/); if (m) data.rating = m[1]; }

    const revEl = document.getElementById('acrCustomerReviewText') || document.querySelector('[data-hook="total-review-count"]');
    if (revEl) data.reviewCount = cleanText(revEl.textContent);

    document.querySelectorAll('#feature-bullets ul li .a-list-item').forEach(el => {
      const t = cleanText(el.textContent);
      if (t && t.length > 10) data.features.push(t);
    });

    const descEl = document.getElementById('productDescription');
    if (descEl) data.description = cleanText(descEl.textContent).slice(0, 500);

    const avEl = document.querySelector('#availability span') || document.querySelector('.a-color-success');
    if (avEl) data.availability = cleanText(avEl.textContent);

    return data.title || data.price ? data : null;
  } catch { return null; }
}

function scrapeFlipkart() {
  try {
    const data = { site: 'flipkart', title: '', price: '', rating: '', reviewCount: '', description: '', features: [], availability: '' };
    const titleEl = document.querySelector('h1') || document.querySelector('[class*="title"]');
    if (titleEl) data.title = cleanText(titleEl.textContent);

    for (const sel of ['[class*="Nx9bq"]', '[class*="yRaY8"]', 'div[class*="price"]']) {
      const el = document.querySelector(sel);
      if (el) { data.price = cleanText(el.textContent); break; }
    }

    const ratingEl = document.querySelector('[class*="XQDvHH"]') || document.querySelector('[class*="rating"]');
    if (ratingEl) { const m = ratingEl.textContent.match(/([\d.]+)/); if (m) data.rating = m[1]; }

    document.querySelectorAll('[class*="key-feature"]').forEach(el => {
      const t = cleanText(el.textContent);
      if (t && t.length > 5) data.features.push(t);
    });

    return data.title || data.price ? data : null;
  } catch { return null; }
}

function scrapeGeneric() {
  try {
    const data = { site: 'web', title: '', price: '', rating: '', reviewCount: '', description: '', features: [], availability: '' };
    const titleEl = document.querySelector('h1') || document.querySelector('[class*="product-title"]') || document.querySelector('[class*="product-name"]');
    if (titleEl) data.title = cleanText(titleEl.textContent);

    for (const sel of ['[class*="price"]', '[id*="price"]', '[itemprop="price"]']) {
      const el = document.querySelector(sel);
      if (el) { const t = cleanText(el.textContent); if (t && /[\d,.]/.test(t)) { data.price = t.slice(0, 30); break; } }
    }

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) data.description = metaDesc.content.slice(0, 400);

    return data.title ? data : null;
  } catch { return null; }
}

function cleanText(text) {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').replace(/&nbsp;/g, ' ').trim();
}

// ─── RENDER PRODUCT ──────────────────────────────────────────────────────────
function renderProduct(data) {
  const el = document.getElementById('aishopper-product');
  if (!el) return;

  const stars = data.rating ? '★'.repeat(Math.round(parseFloat(data.rating))) + '☆'.repeat(5 - Math.round(parseFloat(data.rating))) : '';

  el.innerHTML = `
    <div class="aishopper-product-chip">${data.site.toUpperCase()}</div>
    ${data.title ? `<div class="aishopper-product-title">${escHtml(data.title.slice(0, 100))}${data.title.length > 100 ? '…' : ''}</div>` : ''}
    <div class="aishopper-product-meta">
      ${data.price ? `<span class="aishopper-price">${escHtml(data.price.slice(0,20))}</span>` : ''}
      ${stars ? `<span class="aishopper-stars" title="${data.rating} stars">${stars}</span>` : ''}
      ${data.reviewCount ? `<span class="aishopper-reviews">${escHtml(data.reviewCount)}</span>` : ''}
    </div>
    ${data.availability ? `<div class="aishopper-avail ${data.availability.toLowerCase().includes('out') ? 'out' : 'in'}">${escHtml(data.availability)}</div>` : ''}
  `;
}

// ─── CHAT ─────────────────────────────────────────────────────────────────────
async function handleSend() {
  const input = document.getElementById('aishopper-input');
  const question = input.value.trim();
  if (!question) return;
  input.value = '';

  addMessage(question, 'user');
  conversationHistory.push({ role: 'user', content: question });

  showTyping();

  try {
    const healthy = await checkHealth();
    if (!healthy) {
      removeTyping();
      addMessage('⚡ Backend not reachable. Start it with: <code>python backend_api.py</code>', 'bot');
      return;
    }

    const res = await fetch('http://localhost:5000/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_data: buildProductPayload(),
        question,
        url: window.location.href
      })
    });

    removeTyping();

    if (!res.ok) { addMessage('Error from server. Please try again.', 'bot'); return; }

    const json = await res.json();
    const answer = json.answer || 'No response received.';
    conversationHistory.push({ role: 'assistant', content: answer });

    addMessage(formatBotText(answer), 'bot');
  } catch (err) {
    removeTyping();
    addMessage('Connection error: ' + escHtml(err.message), 'bot');
  }
}

function buildProductPayload() {
  if (!scrapedData) return {};
  return {
    site: scrapedData.site,
    title: scrapedData.title,
    price: scrapedData.price,
    rating: scrapedData.rating,
    review_count: scrapedData.reviewCount,
    description: scrapedData.description,
    features: scrapedData.features,
    availability: scrapedData.availability,
    category: ''
  };
}

async function checkHealth() {
  try {
    const r = await fetch('http://localhost:5000/health', { signal: AbortSignal.timeout(3000) });
    return r.ok;
  } catch { return false; }
}

function formatBotText(raw) {
  return raw
    .split('\n\n').map(para => para.trim()).filter(Boolean)
    .map(para => {
      // Convert bullet lines into a <ul>
      const lines = para.split('\n');
      const isList = lines.every(l => l.trim().startsWith('-') || l.trim().startsWith('•') || l.trim().match(/^\d+\./));
      if (isList && lines.length > 1) {
        const items = lines.map(l => `<li>${escHtml(l.replace(/^[-•]\s*|\d+\.\s*/, ''))}</li>`).join('');
        return `<ul>${items}</ul>`;
      }
      // Bold **text**
      const formatted = escHtml(para)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
      return `<p>${formatted}</p>`;
    })
    .join('');
}

function addMessage(html, role) {
  const msgs = document.getElementById('aishopper-msgs');

  const wrapper = document.createElement('div');
  wrapper.className = `aishopper-msg-group aishopper-msg-group-${role}`;

  if (role === 'bot') {
    wrapper.innerHTML = `
      <div class="aishopper-msg-label">
        <div class="aishopper-avatar-dot"></div>
        <span>ShopMind AI</span>
      </div>
      <div class="aishopper-bubble aishopper-bubble-bot">${html}</div>
    `;
  } else {
    wrapper.innerHTML = `
      <div class="aishopper-bubble aishopper-bubble-user">${escHtml(html)}</div>
      <div class="aishopper-msg-label aishopper-msg-label-user">
        <span>You</span>
      </div>
    `;
  }

  msgs.appendChild(wrapper);
  msgs.scrollTop = msgs.scrollHeight;

  const empty = document.getElementById('aishopper-empty');
  if (empty) empty.style.display = 'none';
}

function showTyping() {
  const msgs = document.getElementById('aishopper-msgs');
  const div = document.createElement('div');
  div.id = 'aishopper-typing';
  div.className = 'aishopper-msg-group aishopper-msg-group-bot';
  div.innerHTML = `
    <div class="aishopper-msg-label">
      <div class="aishopper-avatar-dot"></div>
      <span>ShopMind AI</span>
    </div>
    <div class="aishopper-bubble aishopper-bubble-bot aishopper-typing-bubble">
      <span class="aishopper-dot"></span><span class="aishopper-dot"></span><span class="aishopper-dot"></span>
    </div>
  `;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function removeTyping() {
  const el = document.getElementById('aishopper-typing');
  if (el) el.remove();
}

function escHtml(t) {
  if (!t) return '';
  const d = document.createElement('div');
  d.textContent = t;
  return d.innerHTML;
}

// ─── HTML TEMPLATE ───────────────────────────────────────────────────────────
function getSidebarHTML() {
  return `
    <!-- FAB Toggle Button -->
    <button id="aishopper-toggle" title="ShopMind AI">
      <span class="aishopper-fab-inner">
        <svg class="aishopper-icon-cart" viewBox="0 0 24 24" width="22" height="22" fill="none">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="white" stroke-width="1.6" stroke-linejoin="round"/>
          <line x1="3" y1="6" x2="21" y2="6" stroke="white" stroke-width="1.6"/>
          <path d="M16 10a4 4 0 01-8 0" stroke="white" stroke-width="1.6" stroke-linecap="round"/>
        </svg>
        <svg class="aishopper-icon-close" viewBox="0 0 24 24" fill="none" width="20" height="20">
          <path d="M18 6L6 18M6 6l12 12" stroke="white" stroke-width="2.2" stroke-linecap="round"/>
        </svg>
      </span>
    </button>

    <!-- Sidebar Panel -->
    <div id="aishopper-panel">
      <!-- Panel Header -->
      <div class="aishopper-header">
        <div class="aishopper-header-left">
          <div class="aishopper-logo">
            <svg viewBox="0 0 28 28" width="20" height="20" fill="none">
              <path d="M5 10h18l-2 12H7L5 10z" fill="rgba(255,255,255,0.2)" stroke="white" stroke-width="1.4" stroke-linejoin="round"/>
              <path d="M9.5 10V8a4.5 4.5 0 019 0v2" stroke="white" stroke-width="1.4" stroke-linecap="round"/>
              <circle cx="14" cy="15" r="2.5" fill="white" opacity="0.9"/>
              <path d="M14 13v4M12 15h4" stroke="#0d9488" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
          </div>
          <div>
            <div class="aishopper-brand">ShopMind AI</div>
            <div class="aishopper-tagline">Smart buying advisor</div>
          </div>
        </div>
        <button id="aishopper-close" class="aishopper-close-btn">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <!-- Product Card -->
      <div class="aishopper-product-card">
        <div id="aishopper-product">
          <div class="aishopper-detecting">
            <div class="aishopper-pulse"></div>
            <span>Detecting product…</span>
          </div>
        </div>
      </div>

      <!-- Quick Prompts -->
      <div class="aishopper-quick-prompts">
        <button class="aishopper-quick-btn" data-q="Is this product worth the price?">💰 Worth it?</button>
        <button class="aishopper-quick-btn" data-q="What are the pros and cons?">⚖️ Pros & Cons</button>
        <button class="aishopper-quick-btn" data-q="Should I buy this now or wait for a sale?">⏳ Buy now?</button>
        <button class="aishopper-quick-btn" data-q="What are similar alternatives I should consider?">🔄 Alternatives</button>
      </div>

      <!-- Chat Area -->
      <div id="aishopper-msgs" class="aishopper-msgs">
        <div id="aishopper-empty" class="aishopper-empty">
          <div class="aishopper-empty-icon">✦</div>
          <div class="aishopper-empty-title">Ready to help</div>
          <div class="aishopper-empty-sub">Ask me anything about this product</div>
        </div>
      </div>

      <!-- Input -->
      <div class="aishopper-input-row">
        <textarea id="aishopper-input" placeholder="Ask about price, specs, reviews…" rows="1"></textarea>
        <button id="aishopper-send">
          <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
            <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <div class="aishopper-footer">✦ ShopMind AI · Your data stays private</div>
    </div>
  `;
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
function getSidebarCSS() {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Outfit:wght@400;600;700&display=swap');

    #aishopper-root {
      --ac: #0d9488; --ac2: #14b8a6; --ac3: #5eead4;
      --bg0: #070c0f; --bg1: #0c1319; --bg2: #111d25; --bg3: #172130;
      --bd: rgba(255,255,255,0.07);
      --tx1: rgba(255,255,255,0.92); --tx2: rgba(255,255,255,0.52); --tx3: rgba(255,255,255,0.24);
    }
    #aishopper-root * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }

    /* ── FAB ── */
    #aishopper-toggle {
      position: fixed; bottom: 28px; right: 28px;
      z-index: 2147483646;
      width: 54px; height: 54px; border-radius: 50%;
      border: none; cursor: pointer;
      background: linear-gradient(145deg, #0d9488, #0f766e);
      color: white;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 6px 26px rgba(13,148,136,0.55), 0 2px 8px rgba(0,0,0,0.4);
      transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease;
      overflow: visible;
    }
    #aishopper-toggle::before {
      content: ''; position: absolute; inset: -3px; border-radius: 50%;
      background: conic-gradient(from 0deg, #0d9488, #14b8a6, #5eead4, #0d9488);
      z-index: -1; opacity: 0; transition: opacity 0.3s;
      animation: aishopper-spin 3s linear infinite;
    }
    #aishopper-toggle:hover::before { opacity: 1; }
    @keyframes aishopper-spin { to { transform: rotate(360deg); } }
    #aishopper-toggle:hover { transform: scale(1.1) translateY(-2px); box-shadow: 0 10px 34px rgba(13,148,136,0.7); }
    #aishopper-toggle:active { transform: scale(0.95); }
    #aishopper-toggle.active { background: linear-gradient(145deg, #1e2d38, #0f1c26); }
    .aishopper-fab-inner { position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
    #aishopper-toggle .aishopper-icon-cart,
    #aishopper-toggle .aishopper-icon-close { position: absolute; transition: opacity 0.25s, transform 0.3s cubic-bezier(0.34,1.56,0.64,1); }
    #aishopper-toggle .aishopper-icon-close { opacity: 0; transform: scale(0.5) rotate(-90deg); }
    #aishopper-toggle.active .aishopper-icon-cart { opacity: 0; transform: scale(0.5) rotate(90deg); }
    #aishopper-toggle.active .aishopper-icon-close { opacity: 1; transform: scale(1) rotate(0); }

    /* ── PANEL ── */
    #aishopper-panel {
      position: fixed; bottom: 92px; right: 28px;
      width: 368px; height: 600px;
      z-index: 2147483645;
      background: var(--bg1);
      border-radius: 22px;
      border: 1px solid var(--bd);
      box-shadow: 0 30px 90px rgba(0,0,0,0.75), 0 0 0 1px rgba(13,148,136,0.1),
                  inset 0 1px 0 rgba(255,255,255,0.05);
      display: flex; flex-direction: column; overflow: hidden;
      opacity: 0; transform: translateY(16px) scale(0.96);
      pointer-events: none;
      transition: opacity 0.3s ease, transform 0.35s cubic-bezier(0.34,1.56,0.64,1);
      transform-origin: bottom right;
    }
    #aishopper-panel.open { opacity: 1; transform: translateY(0) scale(1); pointer-events: all; }

    /* ── HEADER ── */
    .aishopper-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 13px 15px; background: var(--bg0);
      border-bottom: 1px solid var(--bd); flex-shrink: 0;
    }
    .aishopper-header-left { display: flex; align-items: center; gap: 10px; }
    .aishopper-logo {
      width: 36px; height: 36px; flex-shrink: 0;
      background: linear-gradient(135deg, #0d9488, #0f766e);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 3px 12px rgba(13,148,136,0.45);
    }
    .aishopper-brand {
      font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 700;
      color: var(--tx1); letter-spacing: -0.3px;
    }
    .aishopper-tagline { font-size: 10px; color: var(--tx3); margin-top: 1px; }
    .aishopper-close-btn {
      width: 28px; height: 28px; background: rgba(255,255,255,0.05);
      border: 1px solid var(--bd); border-radius: 8px;
      color: var(--tx2); cursor: pointer;
      display: flex; align-items: center; justify-content: center; transition: all 0.18s;
    }
    .aishopper-close-btn:hover { background: rgba(255,255,255,0.1); color: var(--tx1); }

    /* ── PRODUCT CARD ── */
    .aishopper-product-card {
      padding: 11px 15px; background: var(--bg2);
      border-bottom: 1px solid var(--bd); flex-shrink: 0;
    }
    .aishopper-detecting { display: flex; align-items: center; gap: 9px; color: var(--tx3); font-size: 12px; }
    .aishopper-pulse {
      width: 7px; height: 7px; background: var(--ac2); border-radius: 50%;
      animation: aishopper-pulse 1.5s infinite;
    }
    @keyframes aishopper-pulse {
      0%,100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.8); opacity: 0.3; }
    }
    .aishopper-product-chip {
      display: inline-block; font-size: 9px; font-weight: 700; letter-spacing: 1.2px;
      color: var(--ac2); background: rgba(13,148,136,0.12);
      border: 1px solid rgba(13,148,136,0.25); border-radius: 4px;
      padding: 2px 7px; margin-bottom: 6px;
    }
    .aishopper-product-title { font-size: 12.5px; font-weight: 500; color: var(--tx1); line-height: 1.55; margin-bottom: 8px; }
    .aishopper-product-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .aishopper-price { font-family: 'Outfit', sans-serif; font-size: 16px; font-weight: 700; color: var(--ac3); }
    .aishopper-stars { color: #fbbf24; font-size: 11px; letter-spacing: 1px; }
    .aishopper-reviews { font-size: 10px; color: var(--tx3); }
    .aishopper-avail {
      margin-top: 5px; font-size: 10px; font-weight: 600; letter-spacing: 0.4px;
      padding: 2px 8px; border-radius: 5px; display: inline-block;
    }
    .aishopper-avail.in  { background: rgba(13,148,136,0.14); color: var(--ac2); }
    .aishopper-avail.out { background: rgba(239,68,68,0.12); color: #f87171; }

    /* ── WRONG SITE ── */
    .aishopper-wrong-site { display: flex; flex-direction: column; align-items: center; padding: 8px 4px; text-align: center; gap: 6px; }
    .aishopper-wrong-icon { font-size: 24px; }
    .aishopper-wrong-title { font-size: 13px; font-weight: 700; color: var(--tx1); font-family: 'Outfit', sans-serif; }
    .aishopper-wrong-desc { font-size: 11px; color: var(--tx3); }
    .aishopper-site-pills { display: flex; gap: 8px; margin: 2px 0; }
    .aishopper-site-pill {
      display: inline-flex; align-items: center; gap: 5px; padding: 5px 13px;
      background: rgba(13,148,136,0.1); border: 1px solid rgba(13,148,136,0.28);
      border-radius: 20px; color: var(--ac2); font-size: 11px; font-weight: 600;
      text-decoration: none; transition: all 0.18s;
    }
    .aishopper-site-pill:hover { background: rgba(13,148,136,0.2); transform: translateY(-1px); }
    .aishopper-wrong-hint { font-size: 10px; color: var(--tx3); line-height: 1.5; max-width: 210px; }

    /* ── QUICK PROMPTS ── */
    .aishopper-quick-prompts {
      display: flex; gap: 6px; padding: 8px 13px;
      overflow-x: auto; background: var(--bg0);
      border-bottom: 1px solid var(--bd); scrollbar-width: none; flex-shrink: 0;
    }
    .aishopper-quick-prompts::-webkit-scrollbar { display: none; }
    .aishopper-quick-btn {
      flex-shrink: 0; background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.07); color: var(--tx2);
      font-size: 10.5px; font-weight: 500; padding: 5px 11px;
      border-radius: 20px; cursor: pointer; white-space: nowrap; transition: all 0.18s;
    }
    .aishopper-quick-btn:hover {
      background: rgba(13,148,136,0.13); border-color: rgba(13,148,136,0.32); color: var(--ac2);
    }

    /* ── MESSAGES ── */
    .aishopper-msgs {
      flex: 1; overflow-y: auto; padding: 18px 13px 10px;
      display: flex; flex-direction: column; gap: 20px;
      background: var(--bg1); scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.05) transparent;
    }
    .aishopper-msgs::-webkit-scrollbar { width: 3px; }
    .aishopper-msgs::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 3px; }
    .aishopper-empty {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; flex: 1; gap: 8px; padding: 40px 20px; text-align: center;
    }
    .aishopper-empty-icon { font-size: 26px; color: var(--ac2); opacity: 0.45; margin-bottom: 4px; }
    .aishopper-empty-title { font-size: 14px; font-weight: 600; color: var(--tx2); font-family: 'Outfit', sans-serif; }
    .aishopper-empty-sub { font-size: 11px; color: var(--tx3); line-height: 1.55; }

    /* Message groups */
    .aishopper-msg-group { display: flex; flex-direction: column; gap: 4px; animation: aishopper-fadein 0.28s ease; }
    .aishopper-msg-group-user { align-items: flex-end; }
    .aishopper-msg-group-bot  { align-items: flex-start; }
    @keyframes aishopper-fadein { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .aishopper-msg-label {
      display: flex; align-items: center; gap: 5px;
      font-size: 9px; font-weight: 700; letter-spacing: 0.7px;
      text-transform: uppercase; color: var(--tx3); padding: 0 3px;
    }
    .aishopper-msg-label-user { flex-direction: row-reverse; }
    .aishopper-avatar-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--ac); }

    .aishopper-bubble { border-radius: 16px; font-size: 13px; line-height: 1.78; }

    .aishopper-bubble-user {
      max-width: 78%;
      background: linear-gradient(145deg, #0d9488, #0e7064);
      color: rgba(255,255,255,0.96);
      padding: 10px 14px;
      border-radius: 18px 18px 5px 18px;
      box-shadow: 0 4px 16px rgba(13,148,136,0.3);
      word-break: break-word;
    }
    .aishopper-bubble-bot {
      max-width: 92%;
      background: var(--bg2);
      border: 1px solid var(--bd);
      color: var(--tx1);
      padding: 12px 14px;
      border-radius: 5px 18px 18px 18px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }
    .aishopper-bubble-bot p { margin: 0 0 10px; color: var(--tx1); }
    .aishopper-bubble-bot p:last-child { margin-bottom: 0; }
    .aishopper-bubble-bot ul { margin: 4px 0 10px; padding-left: 16px; display: flex; flex-direction: column; gap: 6px; }
    .aishopper-bubble-bot ul:last-child { margin-bottom: 0; }
    .aishopper-bubble-bot li { color: var(--tx2); line-height: 1.7; }
    .aishopper-bubble-bot strong { color: var(--ac3); font-weight: 600; }
    .aishopper-bubble-bot em { color: var(--ac2); font-style: normal; }
    .aishopper-bubble-bot code {
      background: rgba(13,148,136,0.14); color: var(--ac2);
      padding: 2px 6px; border-radius: 5px; font-size: 11px; font-family: 'Courier New', monospace;
    }
    .aishopper-typing-bubble { padding: 12px 15px !important; display: flex; align-items: center; gap: 5px; }
    .aishopper-dot {
      display: inline-block; width: 6px; height: 6px;
      background: rgba(94,234,212,0.45); border-radius: 50%;
      animation: aishopper-bounce 1.3s infinite ease-in-out;
    }
    .aishopper-dot:nth-child(2) { animation-delay: 0.18s; }
    .aishopper-dot:nth-child(3) { animation-delay: 0.36s; }
    @keyframes aishopper-bounce {
      0%,60%,100% { transform: translateY(0); opacity: 0.35; }
      30% { transform: translateY(-5px); opacity: 1; }
    }

    /* ── INPUT ── */
    .aishopper-input-row {
      display: flex; align-items: flex-end; gap: 9px;
      padding: 10px 12px 12px; background: var(--bg0);
      border-top: 1px solid var(--bd); flex-shrink: 0;
    }
    #aishopper-input {
      flex: 1; background: var(--bg3);
      border: 1px solid rgba(255,255,255,0.07); border-radius: 14px;
      padding: 10px 13px; color: var(--tx1); font-size: 13px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      resize: none; outline: none; max-height: 90px; overflow-y: auto;
      transition: border-color 0.2s, background 0.2s; line-height: 1.5;
    }
    #aishopper-input::placeholder { color: var(--tx3); }
    #aishopper-input:focus { border-color: rgba(13,148,136,0.5); background: #1c2d3d; }
    #aishopper-send {
      width: 37px; height: 37px; flex-shrink: 0;
      background: linear-gradient(145deg, #0d9488, #0f766e);
      border: none; border-radius: 11px; color: white; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s; box-shadow: 0 4px 14px rgba(13,148,136,0.4);
    }
    #aishopper-send:hover { transform: scale(1.07); box-shadow: 0 6px 20px rgba(13,148,136,0.65); }
    #aishopper-send:active { transform: scale(0.93); }

    /* ── FOOTER ── */
    .aishopper-footer {
      padding: 5px 14px 8px; text-align: center; font-size: 9px;
      color: var(--tx3); background: var(--bg0); letter-spacing: 0.3px; flex-shrink: 0;
    }

    @media (max-width: 420px) {
      #aishopper-panel { width: calc(100vw - 16px); right: 8px; }
      #aishopper-toggle { right: 16px; bottom: 20px; }
    }
  `;
}

// ─── MESSAGE LISTENER ────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getProductData') {
    sendResponse({ success: true, data: scrapedData });
  } else if (request.action === 'scrapeNow') {
    const data = scrapeProductData();
    sendResponse({ success: true, data });
  } else if (request.action === 'openSidebar') {
    openSidebar();
    sendResponse({ success: true });
  }
  return true;
});

// ─── INIT ────────────────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectSidebar);
} else {
  injectSidebar();
}