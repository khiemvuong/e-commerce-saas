/**
 * Dictionary Utilities
 *
 * Centralized, cached lookups for product keyword dictionaries.
 * Previously, flat keyword arrays were rebuilt inline in:
 * - intent-detector.ts (lines 149-152)
 * - smart-fallback.ts (lines 117-133, 160-163)
 * - keyword-extractor.ts (lines 77-87)
 *
 * Now all consumers import from this single module.
 */

import {
  CATEGORY_KEYWORDS,
  BRAND_KEYWORDS,
  COLOR_KEYWORDS,
} from '../config/keywords.config';

// ========== Types ==========

export interface KnownTerm {
  term: string;
  type: 'brand' | 'category' | 'color';
}

// ========== Cached Lookups ==========

let _flatCategoryCache: string[] | null = null;
let _knownTermsCache: KnownTerm[] | null = null;
let _suggestionTermsCache: { brands: string[]; categories: string[]; colors: string[] } | null = null;

/**
 * Get a flat array of all category synonyms.
 * Cached after first call.
 *
 * @example
 * getFlatCategoryKeywords();
 * // ['shoes', 'sneakers', 'boots', ..., 'shirt', 't-shirt', ...]
 */
export function getFlatCategoryKeywords(): string[] {
  if (!_flatCategoryCache) {
    _flatCategoryCache = [];
    for (const keywords of Object.values(CATEGORY_KEYWORDS)) {
      _flatCategoryCache.push(...keywords);
    }
  }
  return _flatCategoryCache;
}

/**
 * Get all known terms (brands + categories + colors) as a tagged flat list.
 * Used by smart-fallback for phonetic/partial matching.
 * Cached after first call.
 *
 * @example
 * getAllKnownTerms();
 * // [{ term: 'nike', type: 'brand' }, { term: 'shoes', type: 'category' }, ...]
 */
export function getAllKnownTerms(): KnownTerm[] {
  if (!_knownTermsCache) {
    _knownTermsCache = [];

    for (const brand of BRAND_KEYWORDS) {
      _knownTermsCache.push({ term: brand.toLowerCase(), type: 'brand' });
    }
    for (const keywords of Object.values(CATEGORY_KEYWORDS)) {
      for (const kw of keywords) {
        _knownTermsCache.push({ term: kw.toLowerCase(), type: 'category' });
      }
    }
    for (const color of COLOR_KEYWORDS) {
      _knownTermsCache.push({ term: color.toLowerCase(), type: 'color' });
    }
  }
  return _knownTermsCache;
}

/**
 * Get keyword dictionaries grouped by type for autocomplete suggestions.
 * Used by the /suggest API endpoint.
 * Cached after first call.
 *
 * @example
 * const { brands, categories, colors } = getAllSuggestionTerms();
 * // brands: ['nike', 'adidas', ...]
 * // categories: ['shoes', 'sneakers', 'shirt', ...]
 * // colors: ['red', 'blue', ...]
 */
export function getAllSuggestionTerms(): { brands: string[]; categories: string[]; colors: string[] } {
  if (!_suggestionTermsCache) {
    const categories: string[] = [];
    for (const keywords of Object.values(CATEGORY_KEYWORDS)) {
      categories.push(...keywords);
    }

    _suggestionTermsCache = {
      brands: [...BRAND_KEYWORDS],
      categories,
      colors: [...COLOR_KEYWORDS],
    };
  }
  return _suggestionTermsCache;
}
