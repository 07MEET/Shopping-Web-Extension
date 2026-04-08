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