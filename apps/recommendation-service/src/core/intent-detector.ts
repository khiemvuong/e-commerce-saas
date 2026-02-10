/**
 * Intent Detector
 * 
 * Rule-based intent detection for AI chatbox.
 * Uses pattern matching without external AI APIs.
 */

import { Intent, INTENT_PATTERNS, QUICK_REPLIES, RESPONSE_TEMPLATES } from '../config/intents.config';

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

  return createResult(Intent.UNKNOWN, 0);
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
