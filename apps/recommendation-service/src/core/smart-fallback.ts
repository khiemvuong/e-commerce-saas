/**
 * Smart Fallback Engine
 * 
 * Handles UNKNOWN intent with 4 layers of intelligent recovery
 * instead of returning a static "I don't understand" message.
 * 
 * Layers:
 * 1. Fuzzy dictionary match (Levenshtein) — typo correction
 * 2. Phonetic similarity (Soundex) — sound-alike words
 * 3. Partial/substring match — incomplete words
 * 4. Graceful generic fallback — trending/popular products + helpful suggestions
 */

import { BRAND_KEYWORDS, CATEGORY_KEYWORDS, COLOR_KEYWORDS } from '../config/keywords.config';
import { fuzzyMatch, ExtractedKeywords } from './keyword-extractor';

// ========== Types ==========

export type FallbackType =
  | 'typo_correction'
  | 'phonetic_match'
  | 'partial_match'
  | 'generic_suggestions';

export interface FallbackResult {
  /** The corrected/resolved query (if correction was possible) */
  correctedQuery?: string;
  /** Original term that was corrected */
  originalTerm?: string;
  /** Suggestions to show the user */
  suggestions: string[];
  /** Confidence of the fallback (0-100) */
  confidence: number;
  /** Which fallback layer resolved this */
  fallbackType: FallbackType;
  /** Whether we should search products with the corrected query */
  shouldSearchProducts: boolean;
  /** Human-readable message explaining what happened */
  message: string;
}

// ========== Soundex Algorithm ==========

/**
 * Soundex phonetic algorithm.
 * Maps words to a 4-character code based on pronunciation.
 * e.g., "niike" → "N200", "nike" → "N200" → match!
 */
export function soundex(word: string): string {
  if (!word || word.length === 0) return '';

  const upper = word.toUpperCase();
  let code = upper[0];

  const map: Record<string, string> = {
    B: '1', F: '1', P: '1', V: '1',
    C: '2', G: '2', J: '2', K: '2', Q: '2', S: '2', X: '2', Z: '2',
    D: '3', T: '3',
    L: '4',
    M: '5', N: '5',
    R: '6',
  };

  let prevCode = map[upper[0]] || '0';

  for (let i = 1; i < upper.length && code.length < 4; i++) {
    const charCode = map[upper[i]] || '0';
    if (charCode !== '0' && charCode !== prevCode) {
      code += charCode;
    }
    prevCode = charCode;
  }

  return code.padEnd(4, '0');
}

/**
 * Check if two words sound similar using Soundex.
 */
export function soundsLike(word1: string, word2: string): boolean {
  if (word1.length < 3 || word2.length < 3) return false;
  return soundex(word1) === soundex(word2);
}

// ========== N-gram Similarity ==========

/**
 * Calculate n-gram similarity between two strings.
 * Returns a score from 0 to 1.
 */
export function ngramSimilarity(word: string, candidate: string, n: number = 2): number {
  if (word.length < n || candidate.length < n) return 0;

  const getNgrams = (str: string): Set<string> => {
    const ngrams = new Set<string>();
    const lower = str.toLowerCase();
    for (let i = 0; i <= lower.length - n; i++) {
      ngrams.add(lower.substring(i, i + n));
    }
    return ngrams;
  };

  const ngrams1 = getNgrams(word);
  const ngrams2 = getNgrams(candidate);

  let intersection = 0;
  for (const ng of ngrams1) {
    if (ngrams2.has(ng)) intersection++;
  }

  const union = ngrams1.size + ngrams2.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ========== Flat dictionaries for lookup ==========

function getAllKnownTerms(): { term: string; type: 'brand' | 'category' | 'color' }[] {
  const terms: { term: string; type: 'brand' | 'category' | 'color' }[] = [];

  for (const brand of BRAND_KEYWORDS) {
    terms.push({ term: brand.toLowerCase(), type: 'brand' });
  }
  for (const [, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      terms.push({ term: kw.toLowerCase(), type: 'category' });
    }
  }
  for (const color of COLOR_KEYWORDS) {
    terms.push({ term: color.toLowerCase(), type: 'color' });
  }

  return terms;
}

// Cache the flat dictionary
let _knownTermsCache: ReturnType<typeof getAllKnownTerms> | null = null;
function getKnownTerms() {
  if (!_knownTermsCache) _knownTermsCache = getAllKnownTerms();
  return _knownTermsCache;
}

// ========== Layer 1: Fuzzy Dictionary Match ==========

function tryFuzzyCorrection(words: string[]): FallbackResult | null {
  const corrections: string[] = [];
  const originals: string[] = [];

  for (const word of words) {
    if (word.length < 3) continue;

    // Try brand fuzzy match (distance ≤ 2)
    const brandMatch = fuzzyMatch(word, BRAND_KEYWORDS, 2);
    if (brandMatch && brandMatch.toLowerCase() !== word.toLowerCase()) {
      corrections.push(brandMatch);
      originals.push(word);
      continue;
    }

    // Try category fuzzy match
    const allCatKeywords: string[] = [];
    for (const [, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      allCatKeywords.push(...keywords);
    }
    const catMatch = fuzzyMatch(word, allCatKeywords, 2);
    if (catMatch && catMatch.toLowerCase() !== word.toLowerCase()) {
      corrections.push(catMatch);
      originals.push(word);
      continue;
    }

    // Try color fuzzy match
    const colorMatch = fuzzyMatch(word, COLOR_KEYWORDS, 2);
    if (colorMatch && colorMatch.toLowerCase() !== word.toLowerCase()) {
      corrections.push(colorMatch);
      originals.push(word);
      continue;
    }

    // Keep the word as-is if no correction
    corrections.push(word);
  }

  if (originals.length > 0) {
    const correctedQuery = corrections.join(' ');
    return {
      correctedQuery,
      originalTerm: originals.join(', '),
      suggestions: [],
      confidence: 70,
      fallbackType: 'typo_correction',
      shouldSearchProducts: true,
      message: `Showing results for "**${correctedQuery}**"`,
    };
  }

  return null;
}

// ========== Layer 2: Phonetic Match ==========

function tryPhoneticMatch(words: string[]): FallbackResult | null {
  const knownTerms = getKnownTerms();
  const matches: string[] = [];
  const originals: string[] = [];

  for (const word of words) {
    if (word.length < 3) continue;

    for (const { term } of knownTerms) {
      if (soundsLike(word, term) && word.toLowerCase() !== term) {
        matches.push(term);
        originals.push(word);
        break;
      }
    }
  }

  if (matches.length > 0) {
    const correctedQuery = matches.join(' ');
    return {
      correctedQuery,
      originalTerm: originals.join(', '),
      suggestions: [],
      confidence: 55,
      fallbackType: 'phonetic_match',
      shouldSearchProducts: true,
      message: `Did you mean "**${correctedQuery}**"? Here's what I found:`,
    };
  }

  return null;
}

// ========== Layer 3: Partial/Substring Match ==========

function tryPartialMatch(words: string[]): FallbackResult | null {
  const knownTerms = getKnownTerms();
  const suggestions: string[] = [];

  for (const word of words) {
    if (word.length < 2) continue;
    const lower = word.toLowerCase();

    // Check if word is a prefix of any known term
    for (const { term, type } of knownTerms) {
      if (term.startsWith(lower) && term !== lower) {
        const label = `${term} (${type})`;
        if (!suggestions.includes(label)) {
          suggestions.push(label);
        }
      }
    }

    // Check n-gram similarity for longer words
    if (word.length >= 4 && suggestions.length < 3) {
      for (const { term, type } of knownTerms) {
        const similarity = ngramSimilarity(word, term);
        if (similarity > 0.4) {
          const label = `${term} (${type})`;
          if (!suggestions.includes(label)) {
            suggestions.push(label);
          }
        }
      }
    }
  }

  if (suggestions.length > 0) {
    // If we have only 1 high-confidence suggestion, auto-correct
    if (suggestions.length === 1) {
      const corrected = suggestions[0].split(' (')[0]; // Remove type label
      return {
        correctedQuery: corrected,
        originalTerm: words.join(' '),
        suggestions,
        confidence: 45,
        fallbackType: 'partial_match',
        shouldSearchProducts: true,
        message: `Did you mean "**${corrected}**"? Here's what I found:`,
      };
    }

    // Multiple suggestions — ask the user
    const cleanSuggestions = suggestions.slice(0, 5).map(s => s.split(' (')[0]);
    return {
      suggestions: cleanSuggestions,
      confidence: 35,
      fallbackType: 'partial_match',
      shouldSearchProducts: false,
      message: `I'm not sure what you meant. Did you mean one of these?`,
    };
  }

  return null;
}

// Layer 4 (context-aware guess) was removed to prevent stale keyword injection
// when users switch topics. Short unknown messages are now treated as standalone
// queries instead of inheriting previous session keywords.

// ========== Layer 4: Generic Fallback ==========

function genericFallback(): FallbackResult {
  const helpMessages = [
    "I'm not quite sure what you're looking for, but here's what's popular right now!",
    "I didn't catch that, but check out these trending products!",
    "Hmm, I couldn't figure that out. Here are some products other shoppers love:",
    "I'm not sure about that, but here are today's highlights:",
    "Let me show you some popular picks while you think about what you need:",
  ];

  return {
    suggestions: ['Search products', 'Browse categories', "What's trending", 'Get help'],
    confidence: 10,
    fallbackType: 'generic_suggestions',
    shouldSearchProducts: true, // Show popular/trending products
    message: helpMessages[Math.floor(Math.random() * helpMessages.length)],
  };
}

// ========== Main Export ==========

/**
 * Run smart fallback when intent detection returns UNKNOWN.
 * Goes through 4 layers of recovery before giving up.
 * 
 * @param message - The original user message
 * @param sessionKeywords - Accumulated keywords from the conversation session
 * @param recentIntents - List of intents detected in this session
 * @returns FallbackResult with correction, suggestions, or generic response
 */
export function smartFallback(
  message: string,
  sessionKeywords?: ExtractedKeywords,
  recentIntents?: string[]
): FallbackResult {
  const trimmed = message.trim();
  if (!trimmed) return genericFallback();

  const words = trimmed.toLowerCase().split(/\s+/).filter(w => w.length > 1);
  if (words.length === 0) return genericFallback();

  console.log(`[SmartFallback] Processing "${trimmed}" through 4 fallback layers...`);

  // Layer 1: Fuzzy dictionary match (typo correction)
  const fuzzyResult = tryFuzzyCorrection(words);
  if (fuzzyResult) {
    console.log(`[SmartFallback] Layer 1 (fuzzy): corrected to "${fuzzyResult.correctedQuery}"`);
    return fuzzyResult;
  }

  // Layer 2: Phonetic similarity
  const phoneticResult = tryPhoneticMatch(words);
  if (phoneticResult) {
    console.log(`[SmartFallback] Layer 2 (phonetic): matched "${phoneticResult.correctedQuery}"`);
    return phoneticResult;
  }

  // Layer 3: Partial/substring match
  const partialResult = tryPartialMatch(words);
  if (partialResult) {
    console.log(`[SmartFallback] Layer 3 (partial): suggestions = [${partialResult.suggestions}]`);
    return partialResult;
  }

  // Layer 4: Generic fallback
  console.log(`[SmartFallback] Layer 4 (generic): no correction found, showing popular products`);
  return genericFallback();
}
