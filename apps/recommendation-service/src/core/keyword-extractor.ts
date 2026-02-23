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
}

/**
 * Extract all keywords from a message
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

  if (!normalizedMessage) {
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
  
  // Extract raw keywords (all meaningful words)
  result.rawKeywords = extractRawKeywords(normalizedMessage);

  return result;
}

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
        if (!found.includes(category)) {
          found.push(category);
        }
        break;
      }
    }
    
    // Fuzzy match if no exact match found for this category
    if (!found.includes(category)) {
      for (const word of words) {
        const match = fuzzyMatch(word, keywords, 2);
        if (match) {
          found.push(category);
          break;
        }
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
  const words = message.split(/\s+/);
  
  // Exact match first
  for (const brand of BRAND_KEYWORDS) {
    if (message.includes(brand.toLowerCase())) {
      found.push(brand);
    }
  }
  
  // Fuzzy match for remaining words (typo correction)
  if (found.length === 0) {
    for (const word of words) {
      const match = fuzzyMatch(word, BRAND_KEYWORDS, 2);
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
  ]);
  
  const words = message
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
  
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
