/**
 * Context Resolver
 * 
 * Phase 4: Detects follow-up messages and resolves them against conversation history.
 * 
 * Examples:
 * - "show me Nike shoes" → ... → "in red" → resolves to "Nike shoes in red"
 * - "under $100" → resolves to "Nike shoes in red under $100"
 * - "how about Adidas?" → switches brand: "Adidas shoes in red under $100"
 * - "yes" / "sure" → confirms previous suggestion
 * - "cheaper" → modifier on previous search
 */

import { ConversationState } from './chat-service';
import { ExtractedKeywords, extractKeywords } from './keyword-extractor';
import { RELATIVE_PRICE_PATTERNS } from '../config/keywords.config';

// ========== Types ==========

export interface ContextualMessage {
  /** The original user message */
  originalMessage: string;
  /** The resolved/expanded message with context */
  resolvedMessage: string;
  /** Whether this was detected as a follow-up */
  isFollowUp: boolean;
  /** What type of follow-up */
  followUpType?: 'refinement' | 'switch' | 'modifier' | 'confirmation' | 'negation';
  /** The intent of the message that this follows up on */
  referenceIntent?: string;
}

// ========== Follow-up Pattern Detection ==========

/** Patterns that indicate a follow-up refinement */
const REFINEMENT_PATTERNS = [
  /^(?:in|with)\s+(.+)/i,                          // "in red", "with discount"
  /^(?:also|too)\s+(.+)/i,                          // "also in size 42"
  /^(?:and)\s+(.+)/i,                               // "and blue"
  /^(?:but)\s+(?:in\s+)?(.+)/i,                     // "but in black"
  /^(?:only|just)\s+(.+)/i,                         // "only Nike"
  /^(?:for)\s+(.+)/i,                               // "for women"
];

/** Patterns that indicate switching (brand, category) */
const SWITCH_PATTERNS = [
  /^(?:how about|what about)\s+(.+?)(?:\s*\?)?$/i,  // "how about Adidas?"
  /^(?:switch to|change to|try)\s+(.+)/i,           // "switch to Nike"
  /^(?:instead|rather)\s+(.+)/i,                    // "instead Puma"
  /^(?:different|another|other)\s+(.+)/i,           // "different brand"
  /^(?:no,?\s*)?(?:i (?:want|prefer|mean))\s+(.+)/i, // "I want Adidas"
];

/** Price modifier patterns */
const MODIFIER_PATTERNS = [
  RELATIVE_PRICE_PATTERNS.cheaper,
  RELATIVE_PRICE_PATTERNS.moreExpensive,
  /^(?:bigger|larger|plus size)/i,
  /^(?:smaller|mini|compact)/i,
  /^(?:under|below|less than|up to|max)\s*\$?\d+/i,  // "under $100"
  /^(?:over|above|more than|at least|min)\s*\$?\d+/i, // "over $50"
  /^\$?\d+\s*(?:to|-|–)\s*\$?\d+/i,                   // "$50 to $100"
  /^(?:between)\s*\$?\d+\s*(?:and|&)\s*\$?\d+/i,      // "between $50 and $100"
];

/** Confirmation patterns */
const CONFIRMATION_PATTERNS = [
  /^(?:yes|yeah|yep|sure|ok|okay|right|correct|exactly|perfect|great|sounds good|that's? (?:right|good|it))(?:\s*[!.]*)?\s*$/i,
];

/** Negation patterns */
const NEGATION_PATTERNS = [
  /^(?:no|nah|nope|not (?:that|this|those|these)|wrong|incorrect)(?:\s*[.,!]*)?\s*$/i,
  /^(?:no,?\s*)(.+)/i, // "no, I want something else"
];

// ========== Follow-up Detection ==========

function detectFollowUpType(message: string): {
  type: 'refinement' | 'switch' | 'modifier' | 'confirmation' | 'negation' | null;
  extractedPart?: string;
} {
  const trimmed = message.trim();

  // Check confirmation first (shortest messages)
  for (const pattern of CONFIRMATION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { type: 'confirmation' };
    }
  }

  // Check negation
  for (const pattern of NEGATION_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      return { type: 'negation', extractedPart: match[1] || undefined };
    }
  }

  // Check modifier patterns
  for (const pattern of MODIFIER_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { type: 'modifier', extractedPart: trimmed };
    }
  }

  // Check switch patterns
  for (const pattern of SWITCH_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      return { type: 'switch', extractedPart: match[1] };
    }
  }

  // Check refinement patterns
  for (const pattern of REFINEMENT_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      return { type: 'refinement', extractedPart: match[1] };
    }
  }

  return { type: null };
}

// ========== Context Building ==========

/**
 * Build the resolved message by combining session context with the follow-up.
 */
function buildResolvedMessage(
  followUpType: string,
  extractedPart: string | undefined,
  accumulated: ExtractedKeywords,
  originalMessage: string,
): string {
  const contextParts: string[] = [];

  // Add brands from context
  if (accumulated.brands.length > 0) {
    contextParts.push(accumulated.brands[accumulated.brands.length - 1]);
  }

  // Add categories from context
  if (accumulated.categories.length > 0) {
    contextParts.push(accumulated.categories[accumulated.categories.length - 1]);
  }

  // Add colors from context
  if (accumulated.colors.length > 0) {
    contextParts.push(accumulated.colors[accumulated.colors.length - 1]);
  }

  switch (followUpType) {
    case 'refinement':
      // Add the refinement to existing context
      return `${contextParts.join(' ')} ${extractedPart || originalMessage}`.trim();

    case 'switch':
      // Replace the relevant part (e.g., brand) but keep category
      if (extractedPart) {
        // Remove existing brands, keep categories and other context
        const nonBrandParts = contextParts.filter(
          p => !accumulated.brands.map(b => b.toLowerCase()).includes(p.toLowerCase())
        );
        return `${extractedPart} ${nonBrandParts.join(' ')}`.trim();
      }
      return originalMessage;

    case 'modifier':
      // Add modifier to existing search
      return `${contextParts.join(' ')} ${originalMessage}`.trim();

    case 'confirmation':
      // Re-use the last search with context
      return contextParts.join(' ').trim() || originalMessage;

    case 'negation':
      if (extractedPart) {
        return extractedPart;
      }
      return originalMessage;

    default:
      return originalMessage;
  }
}

// ========== Main Export ==========

/**
 * Resolve a user message against conversation context.
 * 
 * If the message is a follow-up (e.g., "in red", "under $50", "how about Adidas?"),
 * it will be combined with the accumulated session keywords to form a complete query.
 * 
 * @param message - The current user message
 * @param state - The current conversation state
 * @returns ContextualMessage with resolved message and metadata
 */
export function resolveContext(
  message: string,
  state: ConversationState,
): ContextualMessage {
  const trimmed = message.trim();

  // Don't resolve context if conversation is fresh (< 2 messages from user)
  const userMessages = state.messages.filter(m => m.senderType === 'user');
  if (userMessages.length === 0) {
    return {
      originalMessage: trimmed,
      resolvedMessage: trimmed,
      isFollowUp: false,
    };
  }

  // Don't resolve if accumulated keywords are empty (no prior search context)
  const accumulated = state.accumulatedKeywords;
  const hasContext =
    accumulated.categories.length > 0 ||
    accumulated.brands.length > 0 ||
    accumulated.colors.length > 0;

  if (!hasContext) {
    return {
      originalMessage: trimmed,
      resolvedMessage: trimmed,
      isFollowUp: false,
    };
  }

  // Detect follow-up type
  const { type, extractedPart } = detectFollowUpType(trimmed);
  const standalone = extractKeywords(trimmed);

  const hasStandaloneSignal =
    standalone.categories.length > 0 ||
    standalone.brands.length > 0 ||
    !!standalone.priceRange ||
    !!standalone.priceModifier;

  const hasEnoughStandaloneDetail =
    hasStandaloneSignal && (standalone.rawKeywords.length >= 1 || standalone.categories.length > 0 || standalone.brands.length > 0);

  if (!type) {
    // Standalone query with explicit product signal should not inherit old context.
    // Example: "affordable shoes" should stay independent, not become "bags affordable shoes".
    if (hasStandaloneSignal) {
      return {
        originalMessage: trimmed,
        resolvedMessage: trimmed,
        isFollowUp: false,
      };
    }

    // Short messages without follow-up patterns are treated as standalone queries.
    // This prevents stale keyword injection when users switch topics
    // (e.g., "bags" → "watches" should NOT resolve to "bags watches").
    return {
      originalMessage: trimmed,
      resolvedMessage: trimmed,
      isFollowUp: false,
    };
  }

  // Smart guard: only use previous context when the new message is underspecified.
  // - "cheaper" => underspecified, keep context
  // - "affordable shoes" => specific enough, do NOT keep context
  if ((type === 'modifier' || type === 'refinement') && hasEnoughStandaloneDetail) {
    return {
      originalMessage: trimmed,
      resolvedMessage: trimmed,
      isFollowUp: false,
    };
  }

  // Build resolved message
  const resolvedMessage = buildResolvedMessage(type, extractedPart, accumulated, trimmed);

  return {
    originalMessage: trimmed,
    resolvedMessage,
    isFollowUp: true,
    followUpType: type,
    referenceIntent: getLastProductIntent(state),
  };
}

/**
 * Get the last product-related intent from conversation history.
 */
function getLastProductIntent(state: ConversationState): string | undefined {
  const productIntents = ['SEARCH_PRODUCT', 'RECOMMEND', 'ASK_PRICE', 'COMPARE', 'BROWSE'];

  for (let i = state.messages.length - 1; i >= 0; i--) {
    const msg = state.messages[i];
    if (msg.senderType === 'user' && msg.intent && productIntents.includes(msg.intent)) {
      return msg.intent;
    }
  }

  return undefined;
}
