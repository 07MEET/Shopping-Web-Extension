# AI Shopping Assistant (Web Extension)

## Agile Product Development with DevOps - College Project

An AI-powered browser extension that helps users make informed shopping decisions by analyzing product data from Amazon and Flipkart using Large Language Models.

## Overview

This project combines web scraping, browser extension development, and LLM integration to create a smart shopping assistant that:

- Automatically extracts product information from e-commerce sites
- Answers user questions about products using AI
- Provides price analysis and purchase recommendations
- Works seamlessly as a browser extension

## Features

### For Users
- One-click product analysis on Amazon and Flipkart
- Natural language Q&A about product features
- Intelligent price and value assessments
- Clean, modern chat interface

### Technical Highlights
- Manifest V3 Chrome Extension architecture
- FastAPI backend with async support
- LangChain for LLM orchestration
- Robust web scraping with multiple selector fallbacks
- CORS-enabled API for extension communication

## Tech Stack

| Component | Technology |
|-----------|------------|
| Browser Extension | JavaScript (Manifest V3) |
| Backend API | Python + FastAPI |
| LLM Integration | LangChain + OpenAI GPT-4o-mini |
| Web Scraping | Custom DOM parsers |
| UI (Alternative) | Streamlit |

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure API Key
Ensure your OpenAI API key is in `.env`:
```env
OPENAI_API_KEY="sk-..."
```

### 3. Start Backend
```bash
python backend_api.py
```

### 4. Load Extension
1. Open Chrome → `chrome://extensions/`
2. Enable Developer mode
3. Click "Load unpacked" → Select `Extension` folder

### 5. Test
- Visit any Amazon/Flipkart product page
- Click extension icon
- Ask: "Is this product worth buying?"

## Docker Setup

Alternatively, you can run the entire application using Docker:

### Prerequisites
1. Docker Desktop (Windows/Mac) or Docker Engine (Linux)
2. Docker Compose
3. OpenAI API key

### Quick Start with Docker
```bash
# Clone the repository
git clone <repository-url>
cd Web_Extension

# Create .env file with your OpenAI API key
echo 'OPENAI_API_KEY="sk-..."' > .env

# Build and run with docker-compose
docker-compose up --build
```

### Manual Docker Build
```bash
# Build the Docker image
docker build -t ai-shopping-assistant .

# Run the container
docker run -p 5000:5000 -p 8501:8501 --env-file .env ai-shopping-assistant
```

### Docker Configuration
- Backend API will be available at: http://localhost:5000
- Streamlit UI will be available at: http://localhost:8501
- The container runs as a non-root user for security
- Health checks are configured for automatic monitoring

For detailed Docker configuration, see [DOCKER_README.md](DOCKER_README.md)

## Project Structure

```
Web_Extension/
├── Extension/              # Browser extension
│   ├── manifest.json      # Extension config
│   ├── popup.html         # Chat UI
│   ├── popup.js           # Popup logic
│   ├── content.js         # Product scraper
│   ├── background.js      # Service worker
│   ├── styles.css         # UI styles
│   └── icons/             # Extension icons
├── backend_api.py         # FastAPI server
├── scraper.py             # Scraping utilities
├── ui.py                  # Streamlit demo
├── requirements.txt       # Dependencies
├── SETUP.md              # Detailed setup guide
└── README.md             # This file
```

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│                    User Workflow                         │
├─────────────────────────────────────────────────────────┤
│  1. Visit Amazon/Flipkart product page                  │
│  2. Click extension icon                                │
│  3. Extension scrapes product data automatically        │
│  4. User types question in chat                         │
│  5. Question + product data sent to backend             │
│  6. LLM processes and generates answer                  │
│  7. Response displayed in chat                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   Data Flow                              │
├─────────────────────────────────────────────────────────┤
│  content.js  ──▶  popup.js  ──▶  backend_api.py  ──▶   │
│  (scrapes)       (collects)      (processes)            │
│                                                        │
│  ◀── OpenAI LLM  ◀──  Prompt Template                  │
│  (generates)       (structures)                         │
└─────────────────────────────────────────────────────────┘
```

## API Reference

### POST /analyze
Analyze product and answer user question.

**Request:**
```json
{
  "product_data": {
    "site": "amazon",
    "title": "iPhone 15 Pro",
    "price": "₹1,34,900",
    "rating": "4.5",
    "review_count": "1,234",
    "description": "...",
    "features": ["..."],
    "availability": "In Stock",
    "category": "Electronics"
  },
  "question": "Is this worth the price?"
}
```

**Response:**
```json
{
  "answer": "Based on the features and market positioning...",
  "product_summary": "iPhone 15 Pro - ₹1,34,900 (4.5/5)"
}
```

## Example Questions

Try asking the AI:
- "What are the standout features?"
- "Is this overpriced compared to competitors?"
- "Should I buy now or wait for a sale?"
- "What do the reviews say about battery life?"
- "How does this compare to the previous model?"

## Development

### Running Tests
```bash
# Test scraping
python -c "from scraper import ProductScraper; print('Scraper OK')"

# Test backend
curl http://localhost:5000/health
```

### Debugging
- **Extension**: Right-click icon → Inspect popup
- **Backend**: Check console output
- **Scraping**: F12 → Console on product page

### Adding New Sites
1. Add site detection in `scraper.py`
2. Create extractor methods for new site
3. Update `content.js` with new selectors
4. Add to `manifest.json` permissions

## Team

Developed as part of Agile Product Development with DevOps coursework.

## License

MIT License - Educational project

## Acknowledgments

- OpenAI for LLM capabilities
- LangChain for orchestration
- FastAPI for backend framework
- Chrome Developer Program

# DevOps Project