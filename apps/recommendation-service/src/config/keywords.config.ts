/**
 * Keyword Extraction Configuration
 * 
 * Dictionaries and patterns for extracting structured information from chat messages.
 * English-only as per requirements.
 */

/**
 * Product category dictionary
 */
export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'shoes': ['shoes', 'sneakers', 'boots', 'sandals', 'heels', 'loafers', 'footwear'],
  'clothing': ['shirt', 't-shirt', 'tshirt', 'pants', 'jeans', 'jacket', 'coat', 'dress', 'skirt', 'sweater', 'hoodie'],
  'bags': ['bag', 'backpack', 'handbag', 'purse', 'wallet', 'tote', 'clutch', 'luggage', 'suitcase'],
  'electronics': ['phone', 'laptop', 'computer', 'tablet', 'headphones', 'earbuds', 'camera', 'tv', 'television', 'monitor'],
  'accessories': ['watch', 'glasses', 'sunglasses', 'belt', 'hat', 'cap', 'scarf', 'jewelry', 'necklace', 'bracelet', 'ring'],
  'sports': ['running', 'gym', 'fitness', 'yoga', 'basketball', 'football', 'soccer', 'tennis', 'golf'],
  'beauty': ['makeup', 'skincare', 'perfume', 'cosmetics', 'lipstick', 'foundation'],
  'home': ['furniture', 'decor', 'kitchen', 'bedding', 'lighting', 'storage'],
};

/**
 * Brand dictionary (common brands)
 */
export const BRAND_KEYWORDS: string[] = [
  'nike', 'adidas', 'puma', 'reebok', 'new balance', 'converse', 'vans',
  'gucci', 'louis vuitton', 'chanel', 'prada', 'zara', 'h&m', 'uniqlo',
  'apple', 'samsung', 'sony', 'lg', 'dell', 'hp', 'lenovo', 'asus',
  'rolex', 'omega', 'casio', 'seiko', 'fossil', 'tissot',
  'ray-ban', 'oakley', 'tommy hilfiger', 'calvin klein', 'ralph lauren',
];

/**
 * Color dictionary
 */
export const COLOR_KEYWORDS: string[] = [
  'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown',
  'black', 'white', 'gray', 'grey', 'beige', 'navy', 'teal', 'maroon',
  'gold', 'silver', 'rose gold', 'multicolor', 'colorful',
];

/**
 * Size patterns
 */
export const SIZE_KEYWORDS: string[] = [
  // Letter sizes
  'xxs', 'xs', 'small', 's', 'medium', 'm', 'large', 'l', 'xl', 'xxl', 'xxxl',
  // Numeric sizes (will also use regex)
];

/**
 * Price modifiers
 */
export const PRICE_MODIFIERS: Record<string, 'cheap' | 'mid' | 'expensive'> = {
  'cheap': 'cheap',
  'affordable': 'cheap',
  'budget': 'cheap',
  'inexpensive': 'cheap',
  'low price': 'cheap',
  'mid-range': 'mid',
  'moderate': 'mid',
  'expensive': 'expensive',
  'premium': 'expensive',
  'luxury': 'expensive',
  'high-end': 'expensive',
};

/**
 * Gender keywords
 */
export const GENDER_KEYWORDS: Record<string, 'men' | 'women' | 'unisex' | 'kids'> = {
  'men': 'men',
  "men's": 'men',
  'male': 'men',
  'guy': 'men',
  'women': 'women',
  "women's": 'women',
  'female': 'women',
  'lady': 'women',
  'ladies': 'women',
  'unisex': 'unisex',
  'kid': 'kids',
  'kids': 'kids',
  'children': 'kids',
  'child': 'kids',
  'boy': 'kids',
  'girl': 'kids',
};

/**
 * Price range regex patterns
 */
export const PRICE_PATTERNS = {
  under: /(?:under|below|less than|up to|max|maximum)\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
  over: /(?:over|above|more than|at least|min|minimum)\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
  range: /\$?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:to|-|–)\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
  exact: /\$(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
  between: /between\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:and|&)\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
};

/**
 * Size regex patterns
 */
export const SIZE_PATTERNS = {
  numeric: /\bsize\s*(\d+(?:\.\d)?)\b/i,
  letter: /\bsize\s*(xxs|xs|s|m|l|xl|xxl|xxxl)\b/i,
  standalone: /\b(xxs|xs|small|medium|large|xl|xxl|xxxl)\b/i,
};
