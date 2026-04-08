/**
 * Content Script for AI Shopping Assistant
 * Scrapes product data from Amazon and Flipkart product pages
 */

// Store scraped data for later use
let scrapedData = null;

/**
 * Main scraping function that runs on page load
 */
function scrapeProductData() {
    const url = window.location.href;
    let data = null;

    if (url.includes('amazon')) {
        data = scrapeAmazon();
    } else if (url.includes('flipkart')) {
        data = scrapeFlipkart();
    }

    if (data) {
        data.url = url;
        data.scrapedAt = new Date().toISOString();
        scrapedData = data;
        console.log('[AI Shopping Assistant] Product data scraped:', data);
    }

    return data;
}

/**
 * Scrape product data from Amazon
 */
function scrapeAmazon() {
    try {
        const data = {
            site: 'amazon',
            title: '',
            price: '',
            rating: '',
            reviewCount: '',
            description: '',
            features: [],
            availability: ''
        };

        // Extract title
        const titleElement = document.getElementById('productTitle') ||
                            document.querySelector('#title h1') ||
                            document.querySelector('h1[data-automation-id="product-title"]');
        if (titleElement) {
            data.title = cleanText(titleElement.textContent);
        }

        // Extract price - try multiple selectors
        const priceSelectors = [
            '.a-price-whole',
            '.a-price-fraction',
            '#priceblock_ourprice',
            '#priceblock_dealprice',
            '[data-testid="price"]',
            '.a-price .a-offscreen'
        ];

        for (const selector of priceSelectors) {
            const priceEl = document.querySelector(selector);
            if (priceEl) {
                const priceText = cleanText(priceEl.textContent);
                if (priceText && !data.price.includes(priceText)) {
                    data.price += priceText + ' ';
                }
            }
        }
        data.price = data.price.trim();

        // Extract rating
        const ratingElement = document.querySelector('.a-icon-alt') ||
                             document.querySelector('[data-hook="average-star-rating"]') ||
                             document.querySelector('.a-size-base');
        if (ratingElement) {
            const ratingText = ratingElement.textContent;
            const ratingMatch = ratingText.match(/([\d.]+)/);
            if (ratingMatch) {
                data.rating = ratingMatch[1];
            }
        }

        // Extract review count
        const reviewElement = document.getElementById('acrCustomerReviewText') ||
                             document.querySelector('[data-hook="total-review-count"]');
        if (reviewElement) {
            data.reviewCount = cleanText(reviewElement.textContent);
        }

        // Extract features (bullet points)
        const featureElements = document.querySelectorAll('#feature-bullets ul li .a-list-item');
        featureElements.forEach(el => {
            const feature = cleanText(el.textContent);
            if (feature && feature.length > 10) {
                data.features.push(feature);
            }
        });

        // If no features found, try alternative selector
        if (data.features.length === 0) {
            const altFeatures = document.querySelectorAll('.a-section .a-list-item');
            altFeatures.forEach(el => {
                const feature = cleanText(el.textContent);
                if (feature && feature.length > 10) {
                    data.features.push(feature);
                }
            });
        }

        // Extract description
        const descElement = document.getElementById('productDescription') ||
                           document.querySelector('#productDescription p') ||
                           document.querySelector('.product-description');
        if (descElement) {
            data.description = cleanText(descElement.textContent);
        }

        // Extract availability
        const availabilityElement = document.getElementById('availability') ||
                                   document.querySelector('#availability span') ||
                                   document.querySelector('.a-color-success');
        if (availabilityElement) {
            data.availability = cleanText(availabilityElement.textContent);
        }

        // If availability not found, check for "In Stock" message
        if (!data.availability) {
            const inStockElement = document.querySelector('.a-color-success');
            if (inStockElement && inStockElement.textContent.toLowerCase().includes('stock')) {
                data.availability = 'In Stock';
            }
        }

        return data.title || data.price ? data : null;
    } catch (error) {
        console.error('[AI Shopping Assistant] Error scraping Amazon:', error);
        return null;
    }
}

/**
 * Scrape product data from Flipkart
 */
function scrapeFlipkart() {
    try {
        const data = {
            site: 'flipkart',
            title: '',
            price: '',
            rating: '',
            reviewCount: '',
            description: '',
            features: [],
            availability: ''
        };

        // Extract title
        const titleElement = document.querySelector('h1._9Ey1F') ||
                            document.querySelector('[class*="product-title"]') ||
                            document.querySelector('span[data-testid="product-title"]');
        if (titleElement) {
            data.title = cleanText(titleElement.textContent);
        }

        // Extract price
        const priceSelectors = [
            '[class*="Nx9bq"]',
            '[class*="yRaY8"]',
            '[data-testid="price"]',
            'div[class*="price"]'
        ];

        for (const selector of priceSelectors) {
            const priceEl = document.querySelector(selector);
            if (priceEl) {
                data.price = cleanText(priceEl.textContent);
                break;
            }
        }

        // Extract rating
        const ratingElement = document.querySelector('[class*="XQDvHH"]') ||
                             document.querySelector('[class*="rating"]') ||
                             document.querySelector('[data-testid="rating"]');
        if (ratingElement) {
            const ratingText = ratingElement.textContent;
            const ratingMatch = ratingText.match(/([\d.]+)/);
            if (ratingMatch) {
                data.rating = ratingMatch[1];
            }
        }

        // Extract review count
        const reviewElement = document.querySelector('[class*="reviews-count"]') ||
                             document.querySelector('[class*="review-count"]');
        if (reviewElement) {
            data.reviewCount = cleanText(reviewElement.textContent);
        }

        // Extract features
        const featureSelectors = [
            '[class*="key-feature"]',
            '[class*="product-spec"] li',
            'ul[class*="key-features"] li'
        ];

        for (const selector of featureSelectors) {
            const featureElements = document.querySelectorAll(selector);
            featureElements.forEach(el => {
                const feature = cleanText(el.textContent);
                if (feature && feature.length > 10) {
                    data.features.push(feature);
                }
            });
        }

        // Extract description
        const descElement = document.querySelector('[class*="product-description"]') ||
                           document.querySelector('[class*="product-details"]') ||
                           document.querySelector('[data-testid="description"]');
        if (descElement) {
            data.description = cleanText(descElement.textContent);
        }

        // Extract availability
        const availabilityElement = document.querySelector('[class*="stock-status"]') ||
                                   document.querySelector('[class*="delivery-info"]');
        if (availabilityElement) {
            const availText = cleanText(availabilityElement.textContent).toLowerCase();
            if (availText.includes('out of stock') || availText.includes('unavailable')) {
                data.availability = 'Out of Stock';
            } else if (availText.includes('in stock') || availText.includes('available')) {
                data.availability = 'In Stock';
            }
        }

        return data.title || data.price ? data : null;
    } catch (error) {
        console.error('[AI Shopping Assistant] Error scraping Flipkart:', error);
        return null;
    }
}

/**
 * Clean extracted text
 */
function cleanText(text) {
    if (!text) return '';
    return text
        .replace(/\s+/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim();
}

/**
 * Get scraped data
 */
function getScrapedData() {
    if (!scrapedData) {
        scrapedData = scrapeProductData();
    }
    return scrapedData;
}

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getProductData') {
        const data = getScrapedData();
        sendResponse({ success: true, data: data });
    } else if (request.action === 'scrapeNow') {
        const data = scrapeProductData();
        sendResponse({ success: true, data: data });
    }
    return true;
});

// Auto-scrape on page load for product pages
document.addEventListener('DOMContentLoaded', () => {
    scrapeProductData();
});

// Also scrape after a short delay to ensure all content is loaded
setTimeout(() => {
    scrapeProductData();
}, 1500);

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { scrapeProductData, getScrapedData, cleanText };
}
