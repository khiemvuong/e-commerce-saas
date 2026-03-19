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
  'clothing': ['shirt', 't-shirt', 'tshirt', 'pants', 'jeans', 'jacket', 'coat', 'dress', 'skirt', 'sweater', 'hoodie', 'polo', 'blouse', 'tee', 'cardigan', 'blazer', 'shorts', 'trousers', 'leggings', 'top', 'flannel', 'oversized'],
  'bags': ['bag', 'backpack', 'handbag', 'purse', 'wallet', 'tote', 'clutch', 'luggage', 'suitcase'],
  'electronics': ['phone', 'laptop', 'computer', 'tablet', 'headphones', 'earbuds', 'camera', 'tv', 'television', 'monitor', 'smartphone', 'notebook', 'macbook', 'ipad', 'airpods', 'wireless', 'gaming', 'smartwatch', 'wearable', 'charger', 'speaker', 'iphone', 'galaxy', 'pixel', 'dell', 'lenovo', 'asus', 'acer', 'razer', 'xperia', 'surface', 'chromebook', 'playstation', 'xbox', 'nintendo'],
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
  'google', 'microsoft', 'xiaomi', 'oppo', 'oneplus', 'huawei', 'acer',
  'bose', 'jbl', 'sennheiser', 'razer', 'logitech',
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

/**
 * Occasion/context keywords → mapped to relevant categories
 */
export const OCCASION_KEYWORDS: Record<string, { categories: string[]; gender?: string }> = {
  'gift for girlfriend': { categories: ['clothing', 'bags', 'beauty', 'accessories'], gender: 'women' },
  'gift for boyfriend': { categories: ['clothing', 'electronics', 'accessories'], gender: 'men' },
  'gift for her': { categories: ['clothing', 'bags', 'beauty', 'accessories'], gender: 'women' },
  'gift for him': { categories: ['clothing', 'electronics', 'accessories'], gender: 'men' },
  'office outfit': { categories: ['clothing', 'shoes'] },
  'office wear': { categories: ['clothing', 'shoes'] },
  'work outfit': { categories: ['clothing', 'shoes'] },
  'winter outfit': { categories: ['clothing'] },
  'summer outfit': { categories: ['clothing', 'shoes'] },
  'workout gear': { categories: ['clothing', 'shoes', 'sports'] },
  'gym clothes': { categories: ['clothing', 'sports'] },
  'running gear': { categories: ['shoes', 'clothing', 'sports'] },
  'back to school': { categories: ['bags', 'electronics', 'clothing'] },
  'date night': { categories: ['clothing', 'shoes', 'beauty'] },
  'casual outfit': { categories: ['clothing', 'shoes'] },
  'formal outfit': { categories: ['clothing', 'shoes'] },
  'travel essentials': { categories: ['bags', 'electronics', 'accessories'] },
};

// ========== Shared Brand-Domain Mapping ==========

/**
 * Maps brand names to their product domains.
 * Used by: chat-service (brand-category conflict detection), clarification-engine (popular brands).
 * Single source of truth — previously duplicated in BRAND_CATEGORY_MAP and categoryBrandMap.
 */
export const BRAND_DOMAIN_MAP: Record<string, string[]> = {
  // Clothing brands
  'zara': ['clothing'], 'h&m': ['clothing'], 'uniqlo': ['clothing'],
  'nike': ['clothing', 'shoes', 'sports'], 'adidas': ['clothing', 'shoes', 'sports'],
  'puma': ['clothing', 'shoes', 'sports'], 'reebok': ['clothing', 'shoes', 'sports'],
  'gucci': ['clothing', 'bags'], 'louis vuitton': ['clothing', 'bags'],
  'chanel': ['clothing', 'beauty'], 'prada': ['clothing', 'bags'],
  'tommy hilfiger': ['clothing'], 'calvin klein': ['clothing'], 'ralph lauren': ['clothing'],
  'new balance': ['shoes', 'sports'], 'converse': ['shoes'], 'vans': ['shoes'],
  // Electronics brands
  'apple': ['electronics'], 'samsung': ['electronics'], 'sony': ['electronics'],
  'dell': ['electronics'], 'hp': ['electronics'], 'lenovo': ['electronics'],
  'asus': ['electronics'], 'google': ['electronics'], 'microsoft': ['electronics'],
  'xiaomi': ['electronics'], 'oppo': ['electronics'], 'oneplus': ['electronics'],
  'bose': ['electronics'], 'jbl': ['electronics'], 'razer': ['electronics'],
  'sennheiser': ['electronics'], 'logitech': ['electronics'],
  'lg': ['electronics'], 'huawei': ['electronics'], 'acer': ['electronics'],
  // Watch/Accessories brands
  'rolex': ['accessories'], 'omega': ['accessories'], 'casio': ['accessories'],
  'seiko': ['accessories'], 'fossil': ['accessories'], 'tissot': ['accessories'],
  'ray-ban': ['accessories'], 'oakley': ['accessories'],
};

/**
 * Get product domains for a list of brands.
 */
export function getBrandDomains(brands: string[]): string[] {
  const domains = new Set<string>();
  for (const brand of brands) {
    const brandDomains = BRAND_DOMAIN_MAP[brand.toLowerCase()];
    if (brandDomains) brandDomains.forEach(d => domains.add(d));
  }
  return [...domains];
}

/**
 * Get popular brands for a category/domain (reverse lookup).
 */
export function getPopularBrandsForDomain(domain: string): string[] {
  const brands: string[] = [];
  for (const [brand, domains] of Object.entries(BRAND_DOMAIN_MAP)) {
    if (domains.includes(domain.toLowerCase())) {
      brands.push(brand.charAt(0).toUpperCase() + brand.slice(1));
    }
  }
  return brands.slice(0, 5);
}

// ========== Shared Price Patterns ==========

/**
 * Relative price follow-up patterns (e.g., "cheaper", "more expensive").
 * Single source of truth — previously duplicated in chat-service.ts and context-resolver.ts.
 */
export const RELATIVE_PRICE_PATTERNS = {
  cheaper: /^(?:cheaper|less expensive|more affordable)\b/i,
  moreExpensive: /^(?:more expensive|pricier|premium|luxury)\b/i,
};

/**
 * Price modifier ranges by category.
 * Previously inline in chat-service.ts generateResponse().
 */
export const PRICE_MODIFIER_RANGES: Record<string, Record<string, { min?: number; max?: number }>> = {
  clothing: { cheap: { max: 50 }, mid: { min: 40, max: 100 }, expensive: { min: 100 } },
  electronics: { cheap: { max: 600 }, mid: { min: 400, max: 1000 }, expensive: { min: 900 } },
  default: { cheap: { max: 80 }, mid: { min: 50, max: 200 }, expensive: { min: 150 } },
};
