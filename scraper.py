"""Product data scraper for Amazon and Flipkart."""
import re
from typing import Optional, Dict, Any


class ProductScraper:
    """Extract product data from Amazon and Flipkart pages."""

    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }

    def scrape_amazon(self, html: str) -> Optional[Dict[str, Any]]:
        """
        Scrape product data from Amazon product page HTML.

        Args:
            html: Raw HTML content of the Amazon product page

        Returns:
            Dictionary with product data or None if scraping fails
        """
        try:
            product_data = {
                'site': 'amazon',
                'title': self._extract_amazon_title(html),
                'price': self._extract_amazon_price(html),
                'rating': self._extract_amazon_rating(html),
                'review_count': self._extract_amazon_review_count(html),
                'description': self._extract_amazon_description(html),
                'features': self._extract_amazon_features(html),
                'availability': self._extract_amazon_availability(html),
                'category': self._extract_amazon_category(html)
            }

            # Only return if we got at least title and price
            if product_data['title'] or product_data['price']:
                return product_data
            return None

        except Exception as e:
            print(f"Error scraping Amazon: {e}")
            return None

    def scrape_flipkart(self, html: str) -> Optional[Dict[str, Any]]:
        """
        Scrape product data from Flipkart product page HTML.

        Args:
            html: Raw HTML content of the Flipkart product page

        Returns:
            Dictionary with product data or None if scraping fails
        """
        try:
            product_data = {
                'site': 'flipkart',
                'title': self._extract_flipkart_title(html),
                'price': self._extract_flipkart_price(html),
                'rating': self._extract_flipkart_rating(html),
                'review_count': self._extract_flipkart_review_count(html),
                'description': self._extract_flipkart_description(html),
                'features': self._extract_flipkart_features(html),
                'availability': self._extract_flipkart_availability(html),
                'category': self._extract_flipkart_category(html)
            }

            # Only return if we got at least title and price
            if product_data['title'] or product_data['price']:
                return product_data
            return None

        except Exception as e:
            print(f"Error scraping Flipkart: {e}")
            return None

    # ========== Amazon Extractors ==========

    def _extract_amazon_title(self, html: str) -> str:
        """Extract product title from Amazon page."""
        patterns = [
            r'<span id="productTitle"[^>]*>([^<]+)</span>',
            r'<h1[^>]*id="title"[^>]*>([^<]+)</h1>',
            r'<title>([^<]+)</title>'
        ]
        for pattern in patterns:
            match = re.search(pattern, html, re.IGNORECASE | re.DOTALL)
            if match:
                return self._clean_text(match.group(1))
        return ""

    def _extract_amazon_price(self, str) -> str:
        """Extract current price from Amazon page."""
        patterns = [
            r'<span[^>]*class="a-price-whole"[^>]*>([^<]+)</span>',
            r'<span[^>]*class="a-price-fraction"[^>]*>([^<]+)</span>',
            r'<span[^>]*id="priceblock_ourprice"[^>]*>\$?([\d,]+\.?\d*)',
            r'<span[^>]*id="priceblock_dealprice"[^>]*>\$?([\d,]+\.?\d*)',
            r'itemprop="price"[^>]*>([^<]+)</span>'
        ]
        price_parts = []
        for pattern in patterns:
            match = re.search(pattern, html, re.IGNORECASE)
            if match:
                price_parts.append(self._clean_text(match.group(1)))

        if price_parts:
            return ''.join(price_parts).strip() or price_parts[0]
        return ""

    def _extract_amazon_rating(self, html: str) -> str:
        """Extract product rating from Amazon page."""
        patterns = [
            r'<span[^>]*class="a-icon-alt"[^>]*>([^<]+)</span>',
            r'i[^>]*class="[^"]*a-star[^"]*"[^>]*>([^<]+)',
            r'data-hook="average-star-rating"[^>]*>([^<]+)'
        ]
        for pattern in patterns:
            match = re.search(pattern, html, re.IGNORECASE)
            if match:
                rating_text = self._clean_text(match.group(1))
                # Extract numeric rating
                rating_match = re.search(r'([\d.]+)', rating_text)
                if rating_match:
                    return rating_match.group(1)
        return ""

    def _extract_amazon_review_count(self, html: str) -> str:
        """Extract number of reviews from Amazon page."""
        patterns = [
            r'<span[^>]*id="acrCustomerReviewText"[^>]*>([^<]+)</span>',
            r'data-hook="total-review-count"[^>]*>([^<]+)',
            r'(\d+[,\.]?\d*)\s*ratings'
        ]
        for pattern in patterns:
            match = re.search(pattern, html, re.IGNORECASE)
            if match:
                return self._clean_text(match.group(1))
        return ""

    def _extract_amazon_description(self, html: str) -> str:
        """Extract product description from Amazon page."""
        patterns = [
            r'<div[^>]*id="productDescription"[^>]*>(.*?)</div>',
            r'<div[^>]*class="product-description"[^>]*>(.*?)</div>',
            r'<span[^>]*id="aboutThisItem"[^>]*>(.*?)</span>'
        ]
        for pattern in patterns:
            match = re.search(pattern, html, re.IGNORECASE | re.DOTALL)
            if match:
                return self._clean_text(match.group(1))
        return ""

    def _extract_amazon_features(self, html: str) -> list:
        """Extract bullet point features from Amazon page."""
        features = []
        patterns = [
            r'<li[^>]*class="a-spacing-small"[^>]*>([^<]+)</li>',
            r'<span[^>]*class="a-list-item"[^>]*>([^<]+)</span>',
            r'data-hook="feature-bullet"[^>]*>([^<]+)'
        ]
        for pattern in patterns:
            matches = re.findall(pattern, html, re.IGNORECASE)
            for match in matches:
                cleaned = self._clean_text(match)
                if cleaned and len(cleaned) > 10:
                    features.append(cleaned)
        return features[:5]  # Return top 5 features

    def _extract_amazon_availability(self, html: str) -> str:
        """Extract availability status from Amazon page."""
        patterns = [
            r'<div[^>]*id="availability"[^>]*>([^<]+)</div>',
            r'<span[^>]*id="availability"[^>]*>([^<]+)</span>',
            r'In Stock|Out of Stock|Currently Unavailable'
        ]
        for pattern in patterns:
            match = re.search(pattern, html, re.IGNORECASE)
            if match:
                return self._clean_text(match.group(1))
        return "In Stock"  # Default assumption

    def _extract_amazon_category(self, html: str) -> str:
        """Extract product category from Amazon page."""
        patterns = [
            r'<a[^>]*class="a-link-normal"[^>]*href="[^"]*/s\?k=[^"]*"[^>]*>([^<]+)</a>',
            r'id="wayfinding-breadcrumbs"[^>]*>(.*?)</ul>'
        ]
        for pattern in patterns:
            match = re.search(pattern, html, re.IGNORECASE | re.DOTALL)
            if match:
                return self._clean_text(match.group(1))
        return ""

    # ========== Flipkart Extractors ==========

    def _extract_flipkart_title(self, html: str) -> str:
        """Extract product title from Flipkart page."""
        patterns = [
            r'<h1[^>]*class="[^"]*product-title[^"]*"[^>]*>([^<]+)</h1>',
            r'<span[^>]*class="[^"]*B_Nu_[^"]*"[^>]*>([^<]+)</span>',
            r'<title>([^<]+)</title>'
        ]
        for pattern in patterns:
            match = re.search(pattern, html, re.IGNORECASE | re.DOTALL)
            if match:
                return self._clean_text(match.group(1))
        return ""

    def _extract_flipkart_price(self, html: str) -> str:
        """Extract current price from Flipkart page."""
        patterns = [
            r'<div[^>]*class="[^"]*Nx9bq[ ^"]*"[^>]*>([^<]+)</div>',
            r'<div[^>]*class="[^"]*yRaY8[ ^"]*"[^>]*>([^<]+)</div>',
            r'data-testid="price"[^>]*>([^<]+)',
            r'(\d+[,\.]?\d*)\s*₹'
        ]
        for pattern in patterns:
            match = re.search(pattern, html, re.IGNORECASE)
            if match:
                price = self._clean_text(match.group(1))
                if price:
                    return '₹' + price if '₹' not in price else price
        return ""

    def _extract_flipkart_rating(self, html: str) -> str:
        """Extract product rating from Flipkart page."""
        patterns = [
            r'<div[^>]*class="[^"]*XQDvHH[^"]*"[^>]*>([^<]+)</div>',
            r'<span[^>]*class="[^"]*rating"[^>]*>([^<]+)</span>',
            r'([\d.]+)\s*star'
        ]
        for pattern in patterns:
            match = re.search(pattern, html, re.IGNORECASE)
            if match:
                rating_text = self._clean_text(match.group(1))
                rating_match = re.search(r'([\d.]+)', rating_text)
                if rating_match:
                    return rating_match.group(1)
        return ""

    def _extract_flipkart_review_count(self, html: str) -> str:
        """Extract number of reviews from Flipkart page."""
        patterns = [
            r'<span[^>]*class="[^"]*reviews-count[^"]*"[^>]*>([^<]+)</span>',
            r'(\d+[,\.]?\d*)\s*(Reviews|Ratings)',
            r'<div[^>]*class="[^"]*reviews-header[^"]*"[^>]*>([^<]+)</div>'
        ]
        for pattern in patterns:
            match = re.search(pattern, html, re.IGNORECASE)
            if match:
                return self._clean_text(match.group(1))
        return ""

    def _extract_flipkart_description(self, html: str) -> str:
        """Extract product description from Flipkart page."""
        patterns = [
            r'<div[^>]*class="[^"]*product-description[^"]*"[^>]*>(.*?)</div>',
            r'<section[^>]*class="[^"]*product-details[^"]*"[^>]*>(.*?)</section>',
            r'data-testid="description"[^>]*>([^<]+)'
        ]
        for pattern in patterns:
            match = re.search(pattern, html, re.IGNORECASE | re.DOTALL)
            if match:
                return self._clean_text(match.group(1))
        return ""

    def _extract_flipkart_features(self, html: str) -> list:
        """Extract key features from Flipkart page."""
        features = []
        patterns = [
            r'<li[^>]*class="[^"]*product-spec[^"]*"[^>]*>([^<]+)</li>',
            r'<div[^>]*class="[^"]*key-feature[^"]*"[^>]*>([^<]+)</div>',
            r'<ul[^>]*class="[^"]*key-features[^"]*"[^>]*>(.*?)</ul>'
        ]
        for pattern in patterns:
            matches = re.findall(pattern, html, re.IGNORECASE | re.DOTALL)
            for match in matches:
                cleaned = self._clean_text(match)
                if cleaned and len(cleaned) > 10:
                    features.append(cleaned)
        return features[:5]  # Return top 5 features

    def _extract_flipkart_availability(self, html: str) -> str:
        """Extract availability status from Flipkart page."""
        patterns = [
            r'<div[^>]*class="[^"]*stock-status[^"]*"[^>]*>([^<]+)</div>',
            r'In Stock|Out of Stock|Available|Currently Unavailable'
        ]
        for pattern in patterns:
            match = re.search(pattern, html, re.IGNORECASE)
            if match:
                return self._clean_text(match.group(1))
        return "In Stock"  # Default assumption

    def _extract_flipkart_category(self, html: str) -> str:
        """Extract product category from Flipkart page."""
        patterns = [
            r'<a[^>]*class="[^"]*breadcrumb[^"]*"[^>]*>([^<]+)</a>',
            r'<nav[^>]*class="[^"]*breadcrumb[^"]*"[^>]*>(.*?)</nav>'
        ]
        for pattern in patterns:
            match = re.search(pattern, html, re.IGNORECASE | re.DOTALL)
            if match:
                return self._clean_text(match.group(1))
        return ""

    # ========== Utility Methods ==========

    def _clean_text(self, text: str) -> str:
        """Clean extracted text by removing extra whitespace and HTML entities."""
        if not text:
            return ""
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', '', text)
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        # Remove HTML entities
        text = text.replace('&nbsp;', ' ')
        text = text.replace('&amp;', '&')
        text = text.replace('&lt;', '<')
        text = text.replace('&gt;', '>')
        text = text.replace('&quot;', '"')
        text = text.replace('&#39;', "'")
        # Strip and return
        return text.strip()

    def determine_site(self, url: str) -> str:
        """Determine which site the URL belongs to."""
        if 'amazon' in url.lower():
            return 'amazon'
        elif 'flipkart' in url.lower():
            return 'flipkart'
        return 'unknown'

    def scrape(self, html: str, url: str) -> Optional[Dict[str, Any]]:
        """
        Auto-detect site and scrape product data.

        Args:
            html: Raw HTML content of the product page
            url: URL of the page (for site detection)

        Returns:
            Dictionary with product data or None if scraping fails
        """
        site = self.determine_site(url)
        if site == 'amazon':
            return self.scrape_amazon(html)
        elif site == 'flipkart':
            return self.scrape_flipkart(html)
        return None
