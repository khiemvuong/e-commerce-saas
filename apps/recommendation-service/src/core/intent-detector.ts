/**
 * Intent Detector
 * 
 * Rule-based intent detection for AI chatbox.
 * Uses pattern matching without external AI APIs.
 */

import { Intent, INTENT_PATTERNS, QUICK_REPLIES, RESPONSE_TEMPLATES } from '../config/intents.config';
import { BRAND_KEYWORDS, CATEGORY_KEYWORDS, COLOR_KEYWORDS } from '../config/keywords.config';
import { fuzzyMatch } from './keyword-extractor';

export interface DetectionResult {
  intent: Intent;
  confidence: number;
  extractedText?: string;
  quickReplies: string[];
  responseTemplate: string;
}

/**
 * Detect intent from user message
 * Uses priority-based pattern matching
 */
export function detectIntent(message: string): DetectionResult {
  const trimmed = message.trim();
  
  // Handle empty messages
  if (!trimmed) {
    return createResult(Intent.UNKNOWN, 0);
  }

  // Sort patterns by priority (highest first)
  const sortedPatterns = [...INTENT_PATTERNS].sort((a, b) => b.priority - a.priority);

  for (const { intent, patterns, priority } of sortedPatterns) {
    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match) {
        // Calculate confidence based on match quality
        const confidence = calculateConfidence(trimmed, match[0], priority);
        const extractedText = match[1] || undefined;
        
        return createResult(intent, confidence, extractedText);
      }
    }
  }

  // =========================================================
  // Implicit Intent Detection
  // If no explicit pattern matched, check if the message contains
  // product-related keywords (brands, categories, colors).
  // e.g. "adidas shirt" → SEARCH_PRODUCT
  // e.g. "black polo" → SEARCH_PRODUCT  
  // e.g. "adisdas" (typo) → SEARCH_PRODUCT
  // =========================================================
  const implicitResult = detectImplicitProductSearch(trimmed);
  if (implicitResult) {
    return implicitResult;
  }

  return createResult(Intent.UNKNOWN, 0);
}

/**
 * Detect implicit product search from keyword presence.
 * Catches messages like "adidas shirt", "black polo", "nike shoes"
 * that don't have explicit intent verbs like "show me" or "find".
 */
function detectImplicitProductSearch(message: string): DetectionResult | null {
  const lower = message.toLowerCase();
  const words = lower.split(/\s+/);
  let hasProductSignal = false;
  let confidence = 0;

  // Check for brand mentions (exact or fuzzy)
  for (const brand of BRAND_KEYWORDS) {
    if (lower.includes(brand.toLowerCase())) {
      hasProductSignal = true;
      confidence += 40;
      break;
    }
  }
  if (!hasProductSignal) {
    for (const word of words) {
      const match = fuzzyMatch(word, BRAND_KEYWORDS, 2);
      if (match) {
        hasProductSignal = true;
        confidence += 35; // Slightly lower for fuzzy match
        break;
      }
    }
  }

  // Check for category keywords (exact or fuzzy)
  for (const [, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        hasProductSignal = true;
        confidence += 35;
        break;
      }
    }
    if (confidence >= 70) break;
  }
  if (confidence < 70) {
    // Fuzzy category check
    const allCatKeywords: string[] = [];
    for (const [, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      allCatKeywords.push(...keywords);
    }
    for (const word of words) {
      const match = fuzzyMatch(word, allCatKeywords, 2);
      if (match) {
        hasProductSignal = true;
        confidence += 30;
        break;
      }
    }
  }

  // Check for color keywords
  for (const color of COLOR_KEYWORDS) {
    const regex = new RegExp(`\\b${color}\\b`, 'i');
    if (regex.test(lower)) {
      hasProductSignal = true;
      confidence += 15;
      break;
    }
  }

  if (hasProductSignal) {
    confidence = Math.min(confidence, 85); // Cap at 85 (explicit patterns can reach higher)
    return createResult(Intent.SEARCH_PRODUCT, confidence, message);
  }

  return null;
}

/**
 * Calculate confidence score (0-100)
 */
function calculateConfidence(originalText: string, matchedText: string, priority: number): number {
  // Base confidence from priority (0-50)
  const priorityScore = Math.min(priority / 2, 50);
  
  // Match coverage score (0-30)
  const coverage = matchedText.length / originalText.length;
  const coverageScore = Math.min(coverage * 30, 30);
  
  // Exact match bonus (0-20)
  const exactMatchBonus = matchedText.toLowerCase() === originalText.toLowerCase() ? 20 : 0;
  
  return Math.min(Math.round(priorityScore + coverageScore + exactMatchBonus), 100);
}

/**
 * Create detection result with quick replies and response
 */
function createResult(intent: Intent, confidence: number, extractedText?: string): DetectionResult {
  const quickReplies = QUICK_REPLIES[intent] || QUICK_REPLIES[Intent.UNKNOWN];
  const templates = RESPONSE_TEMPLATES[intent] || RESPONSE_TEMPLATES[Intent.UNKNOWN];
  const responseTemplate = templates[Math.floor(Math.random() * templates.length)];

  return {
    intent,
    confidence,
    extractedText,
    quickReplies,
    responseTemplate,
  };
}

/**
 * Batch detect intents for multiple messages
 */
export function detectIntents(messages: string[]): DetectionResult[] {
  return messages.map(detectIntent);
}

/**
 * Check if message matches a specific intent
 */
export function matchesIntent(message: string, targetIntent: Intent): boolean {
  const result = detectIntent(message);
  return result.intent === targetIntent;
}

/**
 * Get all possible intents for a message (multi-intent detection)
 */
export function detectAllIntents(message: string): DetectionResult[] {
  const results: DetectionResult[] = [];
  const trimmed = message.trim();

  if (!trimmed) {
    return [createResult(Intent.UNKNOWN, 0)];
  }

  for (const { intent, patterns, priority } of INTENT_PATTERNS) {
    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match) {
        const confidence = calculateConfidence(trimmed, match[0], priority);
        results.push(createResult(intent, confidence, match[1]));
        break; // Only one match per intent
      }
    }
  }

  if (results.length === 0) {
    return [createResult(Intent.UNKNOWN, 0)];
  }

  // Sort by confidence
  return results.sort((a, b) => b.confidence - a.confidence);
}
