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

import { BRAND_KEYWORDS, COLOR_KEYWORDS } from '../config/keywords.config';
import { fuzzyMatch } from './text-utils';
import { soundsLike, ngramSimilarity } from './text-utils';
import { getAllKnownTerms, getFlatCategoryKeywords } from './dictionary';
import { createLogger } from './logger';
import type { ExtractedKeywords } from './keyword-extractor';

// Re-export for backward compatibility (intent-detector etc. may import from here)
export { soundex, soundsLike, ngramSimilarity } from './text-utils';

const log = createLogger('SmartFallback');

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

// ========== Layer 1: Fuzzy Dictionary Match ==========

function tryFuzzyCorrection(words: string[]): FallbackResult | null {
  const corrections: string[] = [];
  const originals: string[] = [];
  const flatCategories = getFlatCategoryKeywords();

  for (const word of words) {
    if (word.length < 3) continue;

    // Try brand fuzzy match (distance ≤ 2)
    const brandMatch = fuzzyMatch(word, BRAND_KEYWORDS, 2);
    if (brandMatch && brandMatch.toLowerCase() !== word.toLowerCase()) {
      corrections.push(brandMatch);
      originals.push(word);
      continue;
    }

    // Try category fuzzy match (using cached flat array)
    const catMatch = fuzzyMatch(word, flatCategories, 2);
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
  const knownTerms = getAllKnownTerms();
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
  const knownTerms = getAllKnownTerms();
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

  log.debug('Processing through 4 fallback layers', { message: trimmed });

  // Layer 1: Fuzzy dictionary match (typo correction)
  const fuzzyResult = tryFuzzyCorrection(words);
  if (fuzzyResult) {
    log.info('Layer 1 (fuzzy): corrected', { correctedQuery: fuzzyResult.correctedQuery });
    return fuzzyResult;
  }

  // Layer 2: Phonetic similarity
  const phoneticResult = tryPhoneticMatch(words);
  if (phoneticResult) {
    log.info('Layer 2 (phonetic): matched', { correctedQuery: phoneticResult.correctedQuery });
    return phoneticResult;
  }

  // Layer 3: Partial/substring match
  const partialResult = tryPartialMatch(words);
  if (partialResult) {
    log.info('Layer 3 (partial): suggestions', { suggestions: partialResult.suggestions });
    return partialResult;
  }

  // Layer 4: Generic fallback
  log.info('Layer 4 (generic): no correction found, showing popular products');
  return genericFallback();
}
