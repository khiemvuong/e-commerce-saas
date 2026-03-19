/**
 * Keyword Extractor
 * 
 * Extracts structured information from user messages:
 * - Categories, Brands, Colors, Sizes
 * - Price ranges and modifiers
 * - Gender preferences
 */

import {
  CATEGORY_KEYWORDS,
  BRAND_KEYWORDS,
  COLOR_KEYWORDS,
  SIZE_KEYWORDS,
  PRICE_MODIFIERS,
  GENDER_KEYWORDS,
  PRICE_PATTERNS,
  SIZE_PATTERNS,
  OCCASION_KEYWORDS,
} from '../config/keywords.config';

// ========== Fuzzy Matching Utilities ==========

/**
 * Levenshtein distance between two strings.
 * Used for typo correction: "adisdas" → "adidas" (distance = 1)
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
}

/**
 * Find the best fuzzy match for a word against a list of known terms.
 * Returns the matched term if distance is within threshold, otherwise null.
 */
export function fuzzyMatch(word: string, knownTerms: string[], maxDistance: number = 2): string | null {
  if (word.length < 3) return null; // Don't fuzzy match very short words
  
  let bestMatch: string | null = null;
  let bestDistance = Infinity;

  for (const term of knownTerms) {
    // Skip if length difference is too large
    if (Math.abs(word.length - term.length) > maxDistance) continue;
    
    const dist = levenshteinDistance(word.toLowerCase(), term.toLowerCase());
    // Adaptive threshold: shorter words need tighter matching
    const threshold = term.length >= 5 ? maxDistance : 1;
    
    if (dist <= threshold && dist < bestDistance) {
      bestDistance = dist;
      bestMatch = term;
    }
  }

  return bestMatch;
}

/**
 * Get all keyword dictionaries for autocomplete suggestions.
 */
export function getAllSuggestionTerms(): { brands: string[]; categories: string[]; colors: string[] } {
  const categories: string[] = [];
  for (const [, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    categories.push(...keywords);
  }
  return {
    brands: [...BRAND_KEYWORDS],
    categories: [...new Set(categories)],
    colors: [...COLOR_KEYWORDS],
  };
}

/** Re-export for use in other modules (e.g. comparison-engine) */
export { BRAND_KEYWORDS };

export interface PriceRange {
  min?: number;
  max?: number;
}

export interface ExtractedKeywords {
  categories: string[];
  brands: string[];
  colors: string[];
  sizes: string[];
  priceRange?: PriceRange;
  priceModifier?: 'cheap' | 'mid' | 'expensive';
  gender?: 'men' | 'women' | 'unisex' | 'kids';
  rawKeywords: string[];
  /**
   * True when the query looks like a specific product title (e.g. 4+ descriptive words).
   * When set, brand/category extraction is skipped and the full phrase is used
   * as a literal product-title search in the DB.
   */
  isProductTitleSearch?: boolean;
}

/**
 * Extract all keywords from a message.
 *
 * Design principle:
 *   SHORT query (1-3 words) → brand/category extraction + fuzzy matching
 *   LONG query (4+ non-stop words) → treat as product title search, skip brand/category extraction
 *
 * This prevents 4-word product descriptions like "Vintage Camel Vegan Leather Briefcase"
 * from triggering false brand fuzzy matches (e.g. "camel" → "Chanel").
 */
export function extractKeywords(message: string): ExtractedKeywords {
  const normalizedMessage = message.toLowerCase().trim();
  
  const result: ExtractedKeywords = {
    categories: [],
    brands: [],
    colors: [],
    sizes: [],
    rawKeywords: [],
  };

  if (!normalizedMessage) return result;

  // ── Product Title Search Detection ──
  // Strip known intent prefixes before counting words
  const withoutIntent = normalizedMessage
    .replace(/^(?:find\s+me|show\s+me|search\s+for|search|find|get|buy|i\s+want|looking\s+for|recommend|suggest)\s+/i, '')
    .trim();
  const meaningfulWords = withoutIntent
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !FUZZY_BLOCKLIST.has(w.toLowerCase()));

  // If 4+ meaningful words and no explicit brand/price signal → product title search
  const hasPriceSignal = PRICE_PATTERNS.under.test(normalizedMessage)
    || PRICE_PATTERNS.over.test(normalizedMessage)
    || PRICE_PATTERNS.range.test(normalizedMessage)
    || PRICE_PATTERNS.between.test(normalizedMessage);
  const hasExplicitBrand = BRAND_KEYWORDS.some(b => normalizedMessage.includes(b.toLowerCase()));

  if (meaningfulWords.length >= 4 && !hasPriceSignal && !hasExplicitBrand) {
    result.isProductTitleSearch = true;
    result.rawKeywords = meaningfulWords.slice(0, 8); // cap to avoid over-narrow DB query
    // Still extract price + gender since they can coexist with a product title
    result.priceRange = extractPriceRange(normalizedMessage);
    result.gender = extractGender(normalizedMessage);
    return result;
  }
  // Extract categories
  result.categories = extractCategories(normalizedMessage);
  
  // Extract brands
  result.brands = extractBrands(normalizedMessage);
  
  // Extract colors
  result.colors = extractColors(normalizedMessage);
  
  // Extract sizes
  result.sizes = extractSizes(normalizedMessage);
  
  // Extract price range
  result.priceRange = extractPriceRange(normalizedMessage);
  
  // Extract price modifier
  result.priceModifier = extractPriceModifier(normalizedMessage);
  
  // Extract gender
  result.gender = extractGender(normalizedMessage);
  
  // Extract occasion → categories + gender
  for (const [phrase, mapping] of Object.entries(OCCASION_KEYWORDS)) {
    if (normalizedMessage.includes(phrase)) {
      for (const cat of mapping.categories) {
        if (!result.categories.includes(cat)) result.categories.push(cat);
      }
      if (mapping.gender && !result.gender) result.gender = mapping.gender as any;
      break;
    }
  }
  
  // Extract raw keywords (all meaningful words)
  result.rawKeywords = extractRawKeywords(normalizedMessage);

  return result;
}

/**
 * Words that must NEVER fuzzy-match a category OR brand keyword.
 * Materials, textures and descriptors often have small edit-distances
 * to real keywords (e.g. "camel" → "chanel" dist=2, "best" → "belt" dist=1).
 */
const FUZZY_BLOCKLIST = new Set([
  // Intent/qualifier words
  'best', 'most', 'rest', 'last', 'next', 'test', 'just', 'fast', 'past',
  'list', 'cost', 'lost', 'post', 'host', 'vest', 'west', 'nest', 'pest',
  'all', 'any', 'one', 'top', 'hot', 'new', 'old', 'big', 'good', 'bad',
  'product', 'item', 'thing', 'stuff', 'some', 'more', 'less',
  'show', 'find', 'get', 'give', 'want', 'need', 'like',
  // Material & texture words that collide with brand names
  'camel', 'vegan', 'vintage', 'leather', 'suede', 'canvas', 'velvet',
  'linen', 'denim', 'cotton', 'nylon', 'mesh', 'wool', 'silk', 'satin',
  'fleece', 'faux', 'genuine', 'patent', 'woven', 'knit',
  // Colors that might false-match
  'beige', 'ivory', 'coral', 'lilac', 'olive', 'teal', 'khaki', 'taupe',
  // Numbers
  '1', '2', '3', '4', '5',
]);

/**
 * Extract category from message
 */
function extractCategories(message: string): string[] {
  const found: string[] = [];
  const words = message.split(/\s+/);

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    // Exact match first
    for (const keyword of keywords) {
      if (message.includes(keyword)) {
        if (!found.includes(category)) found.push(category);
        break;
      }
    }

    // Fuzzy match — skip blocklisted words
    if (!found.includes(category)) {
      for (const word of words) {
        if (FUZZY_BLOCKLIST.has(word.toLowerCase())) continue;
        const match = fuzzyMatch(word, keywords, 2);
        if (match) { found.push(category); break; }
      }
    }
  }

  return found;
}


/**
 * Extract brand from message
 */
function extractBrands(message: string): string[] {
  const found: string[] = [];
  
  // Normalize H&M variants before brand matching
  let normalized = message
    .replace(/h\s*&amp;\s*m/gi, 'h&m')
    .replace(/h\s*&\s*m/gi, 'h&m')
    .replace(/h\s+and\s+m\b/gi, 'h&m')
    .replace(/\bhm\b/gi, 'h&m');
  
  const words = normalized.split(/\s+/);
  
  // Exact match first
  for (const brand of BRAND_KEYWORDS) {
    if (normalized.includes(brand.toLowerCase())) {
      found.push(brand);
    }
  }
  
  // Fuzzy match for typo correction only — threshold=1 (catches 'adisdas'→'adidas')
  // NOT threshold=2, which causes false positives like 'camel'→'chanel' (dist=2)
  if (found.length === 0) {
    for (const word of words) {
      if (FUZZY_BLOCKLIST.has(word.toLowerCase())) continue;
      const match = fuzzyMatch(word, BRAND_KEYWORDS, 1);
      if (match && !found.includes(match)) {
        found.push(match);
      }
    }
  }
  
  return found;
}

/**
 * Extract colors from message
 */
function extractColors(message: string): string[] {
  const found: string[] = [];
  
  for (const color of COLOR_KEYWORDS) {
    // Use word boundary to avoid false positives (e.g., "read" containing "red")
    const regex = new RegExp(`\\b${color}\\b`, 'i');
    if (regex.test(message)) {
      found.push(color);
    }
  }
  
  return found;
}

/**
 * Extract sizes from message
 */
function extractSizes(message: string): string[] {
  const found: string[] = [];
  
  // Check letter sizes with word boundaries
  for (const size of SIZE_KEYWORDS) {
    const regex = new RegExp(`\\b${size}\\b`, 'i');
    if (regex.test(message)) {
      found.push(size.toUpperCase());
    }
  }
  
  // Check "size X" pattern
  const numericMatch = message.match(SIZE_PATTERNS.numeric);
  if (numericMatch) {
    found.push(numericMatch[1]);
  }
  
  const letterMatch = message.match(SIZE_PATTERNS.letter);
  if (letterMatch && !found.includes(letterMatch[1].toUpperCase())) {
    found.push(letterMatch[1].toUpperCase());
  }
  
  return found;
}

/**
 * Extract price range from message
 */
function extractPriceRange(message: string): PriceRange | undefined {
  // Check "between X and Y" pattern
  const betweenMatch = message.match(PRICE_PATTERNS.between);
  if (betweenMatch) {
    return {
      min: parsePrice(betweenMatch[1]),
      max: parsePrice(betweenMatch[2]),
    };
  }
  
  // Check "X to Y" range pattern
  const rangeMatch = message.match(PRICE_PATTERNS.range);
  if (rangeMatch) {
    return {
      min: parsePrice(rangeMatch[1]),
      max: parsePrice(rangeMatch[2]),
    };
  }
  
  // Check "under X" pattern
  const underMatch = message.match(PRICE_PATTERNS.under);
  if (underMatch) {
    return { max: parsePrice(underMatch[1]) };
  }
  
  // Check "over X" pattern
  const overMatch = message.match(PRICE_PATTERNS.over);
  if (overMatch) {
    return { min: parsePrice(overMatch[1]) };
  }
  
  return undefined;
}

/**
 * Parse price string to number
 */
function parsePrice(priceStr: string): number {
  return parseFloat(priceStr.replace(/,/g, ''));
}

/**
 * Extract price modifier
 */
function extractPriceModifier(message: string): 'cheap' | 'mid' | 'expensive' | undefined {
  for (const [keyword, modifier] of Object.entries(PRICE_MODIFIERS)) {
    if (message.includes(keyword)) {
      return modifier;
    }
  }
  return undefined;
}

/**
 * Extract gender preference
 */
function extractGender(message: string): 'men' | 'women' | 'unisex' | 'kids' | undefined {
  for (const [keyword, gender] of Object.entries(GENDER_KEYWORDS)) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(message)) {
      return gender;
    }
  }
  return undefined;
}

/**
 * Extract raw meaningful keywords
 */
function extractRawKeywords(message: string): string[] {
  const stopWords = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'may', 'might', 'must', 'can', 'for', 'of', 'to', 'in', 'on', 'at', 'by',
    'with', 'from', 'up', 'about', 'into', 'over', 'after', 'beneath', 'under',
    'above', 'and', 'or', 'but', 'if', 'then', 'else', 'when', 'where', 'why',
    'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some',
    'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
    'just', 'also', 'now', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'you',
    'your', 'yours', 'he', 'him', 'his', 'she', 'her', 'hers', 'it', 'its', 'they',
    'them', 'their', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those',
    'am', 'looking', 'find', 'search', 'want', 'need', 'show', 'get', 'buy', 'please',
    // Intent verbs — should not be search keywords
    'recommend', 'suggest', 'compare', 'browse', 'check', 'tell', 'give',
    'best', 'good', 'great', 'nice', 'like', 'something', 'anything', 'products', 'items',
    // Generic nouns that add no search value
    'product', 'item', 'thing', 'things', 'stuff', 'one', 'type', 'kind', 'way',
    ...Object.keys(PRICE_MODIFIERS),
    ...Object.keys(GENDER_KEYWORDS),
  ]);
  
  const words = message
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .map(word => {
      // Basic stemming: "shirts" -> "shirt", "shoes" -> "shoe"
      if (word.endsWith('s') && word.length > 3 && !word.endsWith('ss')) {
        return word.slice(0, -1);
      }
      return word;
    });
  
  return [...new Set(words)];
}

/**
 * Combine extracted keywords into a search query
 */
export function buildSearchQuery(keywords: ExtractedKeywords): string {
  const parts: string[] = [];
  
  parts.push(...keywords.brands);
  parts.push(...keywords.colors);
  parts.push(...keywords.categories);
  parts.push(...keywords.rawKeywords.slice(0, 3)); // Limit raw keywords
  
  return parts.join(' ').trim();
}
