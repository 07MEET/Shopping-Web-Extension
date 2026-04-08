# AI Shopping Assistant - Browser Extension

A Chrome browser extension that uses AI to help you make informed shopping decisions on Amazon and Flipkart.

## Features

- **Smart Product Analysis**: Automatically scrapes product data from Amazon and Flipkart
- **AI-Powered Q&A**: Ask any question about the product and get intelligent answers
- **Real-time Insights**: Get instant information about prices, features, and recommendations
- **Clean UI**: Beautiful gradient interface with chat-based interaction

## Installation

### Step 1: Generate Icons (Optional)
If you want to generate custom icons:
```bash
cd Extension/icons
pip install pillow
python generate_icons.py
```

Note: If you skip this step, you can create simple placeholder PNG files or download free shopping cart icons.

### Step 2: Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `Extension` folder from this project
5. The extension icon should appear in your browser toolbar

## Usage

1. **Navigate to a product page** on Amazon or Flipkart
2. **Click the extension icon** in your toolbar
3. **Wait for product detection** - the extension will automatically scrape product data
4. **Ask questions** in the chat interface, such as:
   - "Is this product worth the price?"
   - "What are the key features?"
   - "How does this compare to similar products?"
   - "Should I buy this now or wait?"

## Backend Setup

The extension requires a backend API to process questions:

```bash
# Install dependencies
pip install -r requirements.txt

# Start the backend server
python backend_api.py
```

The server runs on `http://localhost:5000`

## Troubleshooting

### "Cannot connect to AI server"
- Make sure the backend server is running: `python backend_api.py`
- Check that port 5000 is not blocked by firewall

### "Could not extract product data"
- Refresh the product page
- Ensure you're on a valid Amazon or Flipkart product page
- Check browser console for errors (F12 → Console)

### Extension icon not showing
- Make sure icons are generated or placeholder images exist
- Check `chrome://extensions/` for error messages

## Files Structure

```
Extension/
├── manifest.json      # Extension configuration
├── popup.html         # Chat interface UI
├── popup.js          # Popup logic and API communication
├── content.js        # Product data scraping
├── background.js     # Service worker for background tasks
├── styles.css        # Popup styling
└── icons/            # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Development

### Debugging

1. **Popup**: Right-click extension icon → Inspect popup
2. **Content Script**: F12 → Console (on product page)
3. **Background Script**: `chrome://extensions/` → Service Worker → Inspect

### Testing Scraping

Open browser console on a product page and run:
```javascript
chrome.runtime.sendMessage({ action: 'scrapeNow' }, console.log);
```

## Privacy

- All product data is processed locally
- API key is stored only in `.env` file (never in extension)
- No browsing data is collected or stored externally

## License

MIT License - Feel free to modify and distribute for your college project!
