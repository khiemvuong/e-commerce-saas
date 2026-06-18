/**
 * Chat Service
 * 
 * Manages AI chatbox conversations and message history.
 * Integrates with:
 * - MongoDB userAnalytics for logged-in users
 * - In-memory session context for anonymous users
 * - Real product data from MongoDB
 * - Unified Hybrid Scoring engine
 */

import { detectIntent, DetectionResult } from './intent-detector';
import { extractKeywords, ExtractedKeywords } from './keyword-extractor';
import { fuzzyMatch } from './text-utils';
import { scoreProducts, getTopRecommendations, UserContext, ScoredProduct, ProductForScoring } from './recommendation-engine';
import { loadUserContext, createAnonymousContext } from '../data/user-context-loader';
import { loadProducts } from '../data/product-loader';
import { resolveContext, ContextualMessage } from './context-resolver';
import { compareProducts, ComparisonResult } from './comparison-engine';
import { shouldClarify, parseClarificationResponse, ClarificationResult } from './clarification-engine';
import { FallbackResult } from './smart-fallback';
import { Intent, ENHANCED_TEMPLATES } from '../config/intents.config';
import {
  RELATIVE_PRICE_PATTERNS,
  PRICE_MODIFIER_RANGES,
  BRAND_KEYWORDS,
  getBrandDomains,
} from '../config/keywords.config';
import { createLogger } from './logger';

const log = createLogger('ChatService');


/**
 * Chat message structure
 */
export interface ChatMessage {
  id: string;
  conversationId: string;
  senderType: 'user' | 'ai';
  content: string;
  timestamp: Date;
  intent?: string;
  keywords?: ExtractedKeywords;
  recommendations?: string[]; // Product IDs
}

/**
 * Conversation state
 */
export interface ConversationState {
  conversationId: string;
  userId?: string;
  isAuthenticated: boolean;
  startedAt: Date;
  lastMessageAt: Date;
  messages: ChatMessage[];
  // Accumulated context from chat session
  accumulatedKeywords: ExtractedKeywords;
  detectedIntents: string[];
  // Merged user context (DB + chat session)
  userContext: UserContext;
  // Clarification tracking
  pendingClarification?: ClarificationResult;
  clarificationCount: number;
  // Pagination tracking
  lastSearchOffset: number;
  lastSearchParams?: { keyword?: string; categories?: string[]; brands?: string[]; colors?: string[] };
  // Follow-up: track last shown product IDs and objects (for context-aware comparison)
  lastShownProductIds: string[];
  lastShownProducts: import('./recommendation-engine').ProductForScoring[];
  // Price filter: stores last search params when user clicks "Filter by price"
  pendingPriceFilter?: { keyword?: string; categories?: string[]; brands?: string[]; colors?: string[] };
}

/**
 * AI response
 */
export interface AIResponse {
  message: string;
  quickReplies: string[];
  recommendations?: ScoredProduct[];
  intent: string;
  keywords: ExtractedKeywords;
  /** Comparison table data (for COMPARE intent) */
  comparison?: ComparisonResult;
  /** Clarification options (when asking follow-up questions) */
  clarification?: ClarificationResult;
  /** Fallback correction info (when typo was corrected) */
  fallback?: FallbackResult;
  /** Whether this was resolved from a follow-up message */
  isFollowUp?: boolean;
  /** The original message before context resolution */
  originalMessage?: string;
}

/**
 * In-memory conversation store with TTL + eviction
 */
const conversationStore = new Map<string, ConversationState>();

/** Max concurrent conversations in memory */
const MAX_CONVERSATIONS = 500;
/** Session expires after 30 minutes of inactivity */
const SESSION_TTL_MS = 30 * 60 * 1000;
/** Cleanup interval: every 5 minutes */
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Remove expired sessions (idle > SESSION_TTL_MS).
 * Also evicts oldest sessions if store exceeds MAX_CONVERSATIONS.
 */
function cleanupSessions(): void {
  const now = Date.now();
  let removed = 0;

  // 1. Remove expired sessions
  for (const [id, state] of conversationStore) {
    if (now - state.lastMessageAt.getTime() > SESSION_TTL_MS) {
      conversationStore.delete(id);
      removed++;
    }
  }

  // 2. If still over capacity, evict oldest by lastMessageAt
  if (conversationStore.size > MAX_CONVERSATIONS) {
    const entries = [...conversationStore.entries()]
      .sort((a, b) => a[1].lastMessageAt.getTime() - b[1].lastMessageAt.getTime());

    const toRemove = conversationStore.size - MAX_CONVERSATIONS;
    for (let i = 0; i < toRemove; i++) {
      conversationStore.delete(entries[i][0]);
      removed++;
    }
  }

  if (removed > 0) {
    log.debug('Cleanup: removed sessions', { removed, remaining: conversationStore.size });
  }
}

// Run cleanup on interval
setInterval(cleanupSessions, CLEANUP_INTERVAL_MS);

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Start a new conversation.
 * For logged-in users: loads behavior data from MongoDB.
 * For anonymous users: creates empty session context.
 */
export async function startConversation(userId?: string): Promise<ConversationState> {
  // Proactive cleanup before creating new session
  cleanupSessions();

  const conversationId = generateId();
  const isAuthenticated = !!userId;

  // Load user context from DB or create anonymous context
  let userContext: UserContext;
  if (userId) {
    const dbContext = await loadUserContext(userId);
    userContext = dbContext || createAnonymousContext();
    userContext.userId = userId;
    log.info('Loaded DB context', { userId, viewedCategories: userContext.viewedCategories.length, cartItems: userContext.cartProductIds.length });
  } else {
    userContext = createAnonymousContext();
    log.info('Anonymous session started');
  }

  const state: ConversationState = {
    conversationId,
    userId,
    isAuthenticated,
    startedAt: new Date(),
    lastMessageAt: new Date(),
    messages: [],
    accumulatedKeywords: {
      categories: [],
      brands: [],
      colors: [],
      sizes: [],
      rawKeywords: [],
    },
    detectedIntents: [],
    userContext,
    clarificationCount: 0,
    lastSearchOffset: 0,
    lastShownProductIds: [],
    lastShownProducts: [],
  };
  
  conversationStore.set(conversationId, state);
  log.info('New session', { conversationId, totalActive: conversationStore.size });
  return state;
}

/**
 * Get conversation by ID
 */
export function getConversation(conversationId: string): ConversationState | undefined {
  return conversationStore.get(conversationId);
}

/**
 * Process user message and generate AI response.
 * 
 * Enhanced Flow:
 * 0. Check if this is a clarification response
 * 1. Resolve context (follow-up detection)
 * 2. Detect intent (with smart fallback)
 * 3. Extract keywords
 * 4. Save user message
 * 5. Accumulate keywords into session context
 * 6. Check if clarification is needed
 * 7. Handle COMPARE intent specially
 * 8. Merge session context with DB context
 * 9. Load relevant products from DB
 * 10. Score products using Unified Hybrid Scoring
 * 11. Generate response
 * 12. Save AI message
 */
export async function processMessage(
  conversationId: string,
  userMessage: string,
): Promise<AIResponse> {
  const state = conversationStore.get(conversationId);
  if (!state) {
    throw new Error(`Conversation ${conversationId} not found`);
  }

  // ===== Step 0.3: Detect if this is a pagination request =====
  const isShowMore = state.lastSearchParams != null && (
    /show\s+(?:me\s+)?more|more\s+(?:products?|options?|results?)/i.test(userMessage.trim()) ||
    /^(?:more|next|next\s+page)$/i.test(userMessage.trim())
  );

  // ===== Step 0: Check if this is a response to a pending clarification =====
  if (state.pendingClarification) {
    const clarificationOptions = state.pendingClarification.options;
    const parsed = parseClarificationResponse(userMessage, clarificationOptions);
    
    if (parsed.isClarificationResponse && parsed.value) {
      // User answered clarification — merge the selected value into the search
      state.pendingClarification = undefined;
      // Combine the clarification value with the original message for a richer search
      const enhancedMessage = `${parsed.value} ${userMessage}`;
      return processMessage(conversationId, enhancedMessage);
    }
    // Not a valid clarification response — clear and process normally
    state.pendingClarification = undefined;
  }

  // ===== Step 0.5: Handle price bucket selection after "Filter by price" =====
  // When user clicks a price bucket ("Under $100", "$40 – $100", "Over $100"),
  // re-run the ORIGINAL search with the price filter applied.
  if (state.pendingPriceFilter) {
    const priceSelection = userMessage.trim();
    const pendingSearch = state.pendingPriceFilter;

    // Parse price range from the selection
    let priceRange: { min?: number; max?: number } | undefined;
    const underMatch = priceSelection.match(/under\s*\$?([\d,]+)/i);
    const overMatch = priceSelection.match(/over\s*\$?([\d,]+)/i);
    // Match en-dash (–), em-dash (—), and hyphen (-)
    const rangeMatch = priceSelection.match(/\$?([\d,]+)\s*[\u2013\u2014\-]\s*\$?([\d,]+)/i);

    if (underMatch) {
      priceRange = { max: parseInt(underMatch[1].replace(/,/g, '')) };
    } else if (overMatch) {
      priceRange = { min: parseInt(overMatch[1].replace(/,/g, '')) };
    } else if (rangeMatch) {
      priceRange = {
        min: parseInt(rangeMatch[1].replace(/,/g, '')),
        max: parseInt(rangeMatch[2].replace(/,/g, '')),
      };
    }

    if (priceRange) {
      // Clear the pending filter
      state.pendingPriceFilter = undefined;

      // Save user message
      const userMsg: ChatMessage = {
        id: generateId(),
        conversationId,
        senderType: 'user',
        content: userMessage,
        timestamp: new Date(),
        intent: Intent.ASK_PRICE,
      };
      state.messages.push(userMsg);

      // Re-run the PREVIOUS search (shoes, phones, etc.) with the price filter
      const products = await loadProducts({ ...pendingSearch, limit: 30 });
      const mergedCtx = mergeContexts(state.userContext, state.accumulatedKeywords);
      const kw = extractKeywords(priceSelection);
      kw.priceRange = priceRange;

      const scored = scoreProducts(products, mergedCtx, kw);
      const filtered = scored.filter(sp => {
        const p = sp.product.price;
        if (priceRange!.min && priceRange!.max) return p >= priceRange!.min && p <= priceRange!.max;
        if (priceRange!.min) return p >= priceRange!.min;
        if (priceRange!.max) return p <= priceRange!.max;
        return true;
      });

      let recommendations = getTopRecommendations(filtered, 5, 0);
      let message: string;

      const rangeText = priceRange.min && priceRange.max
        ? `\$${priceRange.min} – \$${priceRange.max}`
        : priceRange.max ? `under \$${priceRange.max}` : `over \$${priceRange.min}`;

      if (recommendations.length > 0) {
        state.lastShownProductIds = recommendations.map(r => r.product.id);
        state.lastShownProducts = recommendations.map(r => r.product);
        message = `Here are ${recommendations.length} product${recommendations.length > 1 ? 's' : ''} ${rangeText}:`;
      } else {
        // No products in range — fall back to closest options
        recommendations = getTopRecommendations(scored, 5, 0);
        if (recommendations.length > 0) {
          state.lastShownProductIds = recommendations.map(r => r.product.id);
          state.lastShownProducts = recommendations.map(r => r.product);
          message = `No exact matches ${rangeText}, but here are the closest options:`;
        } else {
          message = `I couldn't find products in that price range. Try a different range!`;
        }
      }

      const aiMsg: ChatMessage = {
        id: generateId(),
        conversationId,
        senderType: 'ai',
        content: message,
        timestamp: new Date(),
        recommendations: recommendations.map(r => r.product.id),
      };
      state.messages.push(aiMsg);
      state.lastMessageAt = new Date();

      return {
        message,
        quickReplies: ['Show me more', 'Filter by price', 'Compare them'],
        recommendations,
        intent: Intent.ASK_PRICE,
        keywords: kw,
      };
    }

    // If not a price selection, clear and fall through to normal processing
    state.pendingPriceFilter = undefined;
  }

  // ===== Step 1: Resolve context (follow-up detection) =====
  const contextResult: ContextualMessage = resolveContext(userMessage, state);
  const effectiveMessage = contextResult.resolvedMessage;

  // ===== Step 2: Detect intent (now with smart fallback integration) =====
  const intentResult = detectIntent(
    effectiveMessage,
    state.accumulatedKeywords,
    state.detectedIntents,
  );
  
  // ===== Step 3: Extract keywords =====
  const keywords = extractKeywords(effectiveMessage);

  // ===== Step 3.5: Merge fallback typo correction into keywords =====
  // When smart-fallback corrects a typo (e.g., "adidsa" → "adidas"), the corrected
  // term is only stored in intentResult.fallback.correctedQuery for display purposes.
  // The keyword extractor still works with the original misspelled text, so
  // keywords.brands remains empty and the DB query searches for "adidsa" → 0 results.
  // Fix: inject the corrected brand/keyword into keywords so the search actually works.
  if (intentResult.fallback?.correctedQuery && intentResult.fallback?.shouldSearchProducts) {
    const correctedTerms = intentResult.fallback.correctedQuery.toLowerCase().split(/\s+/);
    const originalTerm = intentResult.fallback.originalTerm?.toLowerCase();

    for (const term of correctedTerms) {
      // If corrected term is a known brand, add it to keywords.brands
      const isBrand = BRAND_KEYWORDS.some(b => b.toLowerCase() === term);
      if (isBrand && !keywords.brands.some(b => b.toLowerCase() === term)) {
        keywords.brands.push(term);
      }
    }

    // Remove the misspelled term from rawKeywords to avoid polluting the DB query
    if (originalTerm) {
      const originalTerms = originalTerm.split(/,\s*/).map(t => t.trim());
      keywords.rawKeywords = keywords.rawKeywords.filter(
        k => !originalTerms.includes(k.toLowerCase())
      );
    }
  }

  // ===== Step 4: Save user message =====
  const userMsg: ChatMessage = {
    id: generateId(),
    conversationId,
    senderType: 'user',
    content: userMessage,
    timestamp: new Date(),
    intent: intentResult.intent,
    keywords,
  };
  state.messages.push(userMsg);

  // ===== Step 4.5: Clear stale brand context for standalone queries =====
  // When the user sends a standalone query (not a follow-up) without mentioning
  // any brand, previously accumulated brands are irrelevant and should be cleared.
  // Example: "laptop" after "samsung phone" → Samsung should NOT carry over.
  // This prevents stale brand filters from polluting unrelated searches.
  if (!contextResult.isFollowUp && keywords.brands.length === 0) {
    state.accumulatedKeywords.brands = [];
  }
  
  // ===== Step 5: Accumulate keywords into session context =====
  accumulateKeywords(state.accumulatedKeywords, keywords);
  
  if (!state.detectedIntents.includes(intentResult.intent)) {
    state.detectedIntents.push(intentResult.intent);
  }

  // ===== Step 6: Check if clarification is needed =====
  // Skip clarification if: intent is UNKNOWN/GREETING/HELP, OR user already provided specific keywords
  // (prevents 'shirt' from re-triggering shoe brand clarification after the user typed something specific)
  const userHasSpecificKeywords = keywords.rawKeywords.length > 0 && (
    keywords.categories.length > 0 || keywords.brands.length > 0
  );
  const skipClarification = 
    intentResult.intent === Intent.UNKNOWN || 
    intentResult.intent === Intent.GREETING || 
    intentResult.intent === Intent.HELP ||
    userHasSpecificKeywords ||
    isShowMore;

  if (!skipClarification) {
    const estimatedCount = await estimateResultCount(keywords, state);
    const clarification = shouldClarify(
      intentResult.intent,
      keywords,
      state.accumulatedKeywords,
      state.messages,
      estimatedCount,
    );
    
    if (clarification.needsClarification) {
      state.pendingClarification = clarification;
      state.clarificationCount++;

      const templates = ENHANCED_TEMPLATES.CLARIFICATION;
      const prefix = templates[Math.floor(Math.random() * templates.length)];
      
      // Save AI clarification message
      const aiMsg: ChatMessage = {
        id: generateId(),
        conversationId,
        senderType: 'ai',
        content: `${prefix}\n\n${clarification.question}`,
        timestamp: new Date(),
      };
      state.messages.push(aiMsg);
      state.lastMessageAt = new Date();

      return {
        message: `${prefix}\n\n${clarification.question}`,
        quickReplies: clarification.options?.map(o => o.label) || [],
        intent: intentResult.intent,
        keywords,
        clarification,
        isFollowUp: contextResult.isFollowUp,
        originalMessage: contextResult.isFollowUp ? userMessage : undefined,
      };
    }
  }

  // ===== Step 7: Handle COMPARE intent =====
  if (intentResult.intent === Intent.COMPARE) {
    // Detect vague brand-vs-brand comparison (e.g. "Nike vs Adidas" with no specific product)
    const vsMatch = effectiveMessage.match(/(.+?)\s+vs\.?\s+(.+)/i);
    if (vsMatch) {
      const leftBrands = extractKeywords(vsMatch[1].trim()).brands;
      const rightBrands = extractKeywords(vsMatch[2].trim()).brands;
      const leftKeywords = extractKeywords(vsMatch[1].trim()).rawKeywords;
      const rightKeywords = extractKeywords(vsMatch[2].trim()).rawKeywords;
      
      const isVagueBrandComparison = leftBrands.length > 0 && rightBrands.length > 0 
        && leftKeywords.length === 0 && rightKeywords.length === 0;
      
      if (isVagueBrandComparison) {
        const left = leftBrands[0].charAt(0).toUpperCase() + leftBrands[0].slice(1);
        const right = rightBrands[0].charAt(0).toUpperCase() + rightBrands[0].slice(1);
        const aiMsg: ChatMessage = {
          id: generateId(),
          conversationId,
          senderType: 'ai',
          content: `I can compare specific products, not entire brands. Which products would you like to compare? For example:`,
          timestamp: new Date(),
        };
        state.messages.push(aiMsg);
        state.lastMessageAt = new Date();
        return {
          message: `I can compare specific products, not entire brands. Which products would you like to compare? For example:`,
          quickReplies: [
            `${left} shirt vs ${right} shirt`,
            `Best ${left} products`,
            `Best ${right} products`,
          ],
          intent: intentResult.intent,
          keywords,
        };
      }
    }

    // Use raw userMessage for pronoun-based context comparisons ("compare them/these/those")
    // because resolveContext() transforms short messages by injecting accumulated context,
    // which breaks the isContextRef regex inside compareProducts.
    const compareInput = /\b(?:them|these|those)\b/i.test(userMessage)
      ? userMessage
      : effectiveMessage;
    const comparisonResult = await compareProducts(compareInput, state.lastShownProducts || []);

    
    const aiMsg: ChatMessage = {
      id: generateId(),
      conversationId,
      senderType: 'ai',
      content: comparisonResult.message,
      timestamp: new Date(),
    };
    state.messages.push(aiMsg);
    state.lastMessageAt = new Date();

    return {
      message: comparisonResult.message,
      quickReplies: comparisonResult.quickReplies,
      intent: intentResult.intent,
      keywords,
      comparison: comparisonResult.success ? comparisonResult : undefined,
      isFollowUp: contextResult.isFollowUp,
      originalMessage: contextResult.isFollowUp ? userMessage : undefined,
    };
  }

  // ===== Step 7.5: Handle "Filter by price" quick reply =====
  // When user clicks "Filter by price", present smart price buckets based on previous results
  // and store the search context so Step 0.5 can re-use it.
  const isFilterByPrice = /^filter\s*(?:by\s*)?price$/i.test(userMessage.trim());
  if (isFilterByPrice && state.lastShownProducts && state.lastShownProducts.length > 0) {
    const prices = state.lastShownProducts.map(p => p.price).sort((a, b) => a - b);
    const minPrice = prices[0];
    const maxPrice = prices[prices.length - 1];

    // Generate smart price bucket options
    const buckets: string[] = [];
    if (maxPrice > 100) {
      const mid = Math.round((minPrice + maxPrice) / 2 / 50) * 50; // round to nearest $50
      if (mid > minPrice && mid > 50) {
        buckets.push(`Under $${mid}`);
      }
      if (mid > minPrice && mid < maxPrice) {
        buckets.push(`$${Math.max(mid - 100, Math.round(minPrice / 10) * 10)} – $${mid}`);
        buckets.push(`Over $${mid}`);
      } else {
        buckets.push(`Under $${Math.round(maxPrice * 0.5 / 50) * 50 || 50}`);
        buckets.push(`Over $${Math.round(maxPrice * 0.5 / 50) * 50 || 50}`);
      }
    } else {
      const third = Math.round((maxPrice - minPrice) / 3);
      buckets.push(`Under $${minPrice + third}`);
      buckets.push(`$${minPrice + third} – $${minPrice + third * 2}`);
      buckets.push(`Over $${minPrice + third * 2}`);
    }

    // Deduplicate and clean
    const uniqueBuckets = [...new Set(buckets)].slice(0, 3);

    const rangeText = `$${minPrice.toLocaleString()} – $${maxPrice.toLocaleString()}`;
    const message = `Current results range from **${rangeText}**. What's your budget?`;

    // ★ Store current search params so Step 0.5 can re-run with price filter
    state.pendingPriceFilter = state.lastSearchParams || undefined;

    const aiMsg: ChatMessage = {
      id: generateId(),
      conversationId,
      senderType: 'ai',
      content: message,
      timestamp: new Date(),
    };
    state.messages.push(aiMsg);
    state.lastMessageAt = new Date();

    return {
      message,
      quickReplies: uniqueBuckets,
      intent: intentResult.intent,
      keywords,
    };
  }

  // ===== Step 8: Merge session context with DB context =====
  const mergedContext = mergeContexts(state.userContext, state.accumulatedKeywords);

  // ===== Step 9-11: Generate response (loads products & scores internally) =====
  const response = await generateResponse(intentResult, keywords, mergedContext, state);

  // Attach follow-up info
  if (contextResult.isFollowUp) {
    response.isFollowUp = true;
    response.originalMessage = userMessage;
    
    // Prepend context-resolved message if it changed
    if (effectiveMessage !== userMessage) {
      const templates = ENHANCED_TEMPLATES.CONTEXT_RESOLVED;
      const prefix = templates[Math.floor(Math.random() * templates.length)];
      response.message = `${prefix}\n\n${response.message}`;
    }
  }

  // Attach fallback data if present
  if (intentResult.fallback) {
    response.fallback = intentResult.fallback;
  }

  // ===== Step 12: Save AI message =====
  const aiMsg: ChatMessage = {
    id: generateId(),
    conversationId,
    senderType: 'ai',
    content: response.message,
    timestamp: new Date(),
    recommendations: response.recommendations?.map(r => r.product.id),
  };
  state.messages.push(aiMsg);
  
  state.lastMessageAt = new Date();
  
  return response;
}

/**
 * Quick estimate of how many product results would match the current keywords.
 * Used to decide if clarification is needed (too many results = vague query).
 */
async function estimateResultCount(
  keywords: ExtractedKeywords,
  state: ConversationState,
): Promise<number> {
  try {
    const searchKeyword = keywords.rawKeywords.join(' ') || undefined;
    const products = await loadProducts({
      keyword: searchKeyword,
      categories: keywords.categories.length > 0 ? keywords.categories : undefined,
      brands: keywords.brands.length > 0 ? keywords.brands : undefined,
      limit: 50,
    });
    return products.length;
  } catch {
    return 0;
  }
}

/**
 * Accumulate keywords across the conversation session.
 * Detects topic switches and resets accumulated state to avoid stale filters.
 */
function accumulateKeywords(accumulated: ExtractedKeywords, newKeywords: ExtractedKeywords): void {
  let topicChanged = false;

  // Detect topic change via category: new categories don't overlap with accumulated
  if (newKeywords.categories.length > 0 && accumulated.categories.length > 0) {
    const hasOverlap = newKeywords.categories.some(c =>
      accumulated.categories.some(ac => ac.toLowerCase() === c.toLowerCase())
    );
    if (!hasOverlap) {
      topicChanged = true;
    }
  }

  // Detect topic change via brand: new brands are very different from accumulated
  // (e.g., switching from Nike → Apple, or Zara → Samsung)
  if (!topicChanged && newKeywords.brands.length > 0 && accumulated.brands.length > 0) {
    const hasOverlap = newKeywords.brands.some(b =>
      accumulated.brands.some(ab => ab.toLowerCase() === b.toLowerCase())
    );
    if (!hasOverlap) {
      topicChanged = true;
    }
  }

  // Detect topic change when new brand is incompatible with accumulated categories
  // (e.g., searching "laptop" [electronics] then selecting "Zara" [clothing])
  if (!topicChanged && newKeywords.brands.length > 0 && accumulated.categories.length > 0) {
    const brandDomains = getBrandDomains(newKeywords.brands);
    if (brandDomains.length > 0) {
      const isCompatible = brandDomains.some(domain =>
        accumulated.categories.some(ac => ac.toLowerCase() === domain.toLowerCase())
      );
      if (!isCompatible) {
        topicChanged = true;
      }
    }
  }

  // Detect topic change when new category is incompatible with accumulated brands
  // (e.g., accumulated "apple" [electronics] then searching "shoes" [shoes])
  if (!topicChanged && newKeywords.categories.length > 0 && accumulated.brands.length > 0) {
    const brandDomains = getBrandDomains(accumulated.brands);
    if (brandDomains.length > 0) {
      const isCompatible = brandDomains.some(domain =>
        newKeywords.categories.some(nc => nc.toLowerCase() === domain.toLowerCase())
      );
      if (!isCompatible) {
        topicChanged = true;
      }
    }
  }

  if (topicChanged) {
    // Reset accumulated state for clean search
    accumulated.brands = [];
    accumulated.rawKeywords = [];
    accumulated.colors = [];
    accumulated.sizes = [];
    accumulated.categories = [];
    accumulated.priceRange = undefined;
    accumulated.priceModifier = undefined;
  }

  accumulated.categories.push(...newKeywords.categories.filter(c => !accumulated.categories.includes(c)));
  accumulated.brands.push(...newKeywords.brands.filter(b => !accumulated.brands.includes(b)));
  accumulated.colors.push(...newKeywords.colors.filter(c => !accumulated.colors.includes(c)));
  accumulated.sizes.push(...newKeywords.sizes.filter(s => !accumulated.sizes.includes(s)));
  accumulated.rawKeywords.push(...newKeywords.rawKeywords.filter(k => !accumulated.rawKeywords.includes(k)));
  
  if (newKeywords.priceRange) accumulated.priceRange = newKeywords.priceRange;
  if (newKeywords.priceModifier) accumulated.priceModifier = newKeywords.priceModifier;
  if (newKeywords.gender) accumulated.gender = newKeywords.gender;
}

/**
 * Merge DB-loaded user context with chat session keywords.
 * Chat keywords ADD to the DB context, not replace.
 */
function mergeContexts(dbContext: UserContext, chatKeywords: ExtractedKeywords): UserContext {
  return {
    ...dbContext,
    chatKeywords: chatKeywords.rawKeywords,
    chatCategories: [
      ...new Set([...dbContext.chatCategories, ...chatKeywords.categories]),
    ],
    chatBrands: [
      ...new Set([...dbContext.chatBrands, ...chatKeywords.brands]),
    ],
    priceRange: chatKeywords.priceRange || dbContext.priceRange,
    preferredColors: [
      ...new Set([...dbContext.preferredColors, ...chatKeywords.colors]),
    ],
  };
}

// =====================================================================
// Helper Functions — extracted from generateResponse()
// =====================================================================

/**
 * Resolve which brands to filter by.
 * Uses ONLY current message brands (no accumulated fallback).
 */
function resolveSearchBrands(keywords: ExtractedKeywords): string[] {
  return keywords.brands.length > 0 ? keywords.brands : [];
}

/**
 * Resolve which categories to filter by.
 * Uses current keywords, falls back to behavioral context if relevant.
 */
function resolveSearchCategories(
  keywords: ExtractedKeywords,
  context: UserContext,
  state: ConversationState,
): string[] {
  if (keywords.categories.length > 0) return keywords.categories;

  return [
    ...context.chatCategories.filter(c =>
      !keywords.rawKeywords.length || keywords.rawKeywords.some(k =>
        c.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(c.toLowerCase())
      )
    ),
    ...(state.isAuthenticated ? context.viewedCategories.filter(c =>
      !keywords.rawKeywords.length || keywords.rawKeywords.some(k =>
        c.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(c.toLowerCase())
      )
    ) : []),
  ];
}

/**
 * Resolve price constraints from multiple sources:
 * - Explicit price range from keywords ("under $100")
 * - Price modifier ("cheap", "premium")
 * - Relative follow-up ("cheaper", "more expensive") → percentile-based
 *
 * Returns the resolved PriceRange and the type of relative modifier detected.
 */
function resolvePriceConstraints(
  keywords: ExtractedKeywords,
  searchCategories: string[],
  lastUserMessage: string,
  lastShownProducts: ProductForScoring[],
): { priceRange?: { min?: number; max?: number }; isRelativeFollowUp: boolean } {
  let priceRange = keywords.priceRange;
  let isRelativeFollowUp = false;

  // Price modifier → hard price range (e.g., "cheap" → max $50 for clothing)
  if (keywords.priceModifier && !priceRange) {
    const isElectronics = keywords.categories.includes('electronics') ||
      searchCategories.some(c => c === 'electronics');
    const categoryKey = isElectronics ? 'electronics' : (keywords.categories[0] || 'default');
    const ranges = PRICE_MODIFIER_RANGES[categoryKey] || PRICE_MODIFIER_RANGES['default'];
    priceRange = ranges[keywords.priceModifier] || undefined;
  }

  // Relative follow-up: "cheaper" → products below 25th percentile of previous results
  if (lastShownProducts.length > 0) {
    const isCheaper = RELATIVE_PRICE_PATTERNS.cheaper.test(lastUserMessage);
    const isMoreExpensive = RELATIVE_PRICE_PATTERNS.moreExpensive.test(lastUserMessage);

    if (isCheaper) {
      isRelativeFollowUp = true;
      const prices = lastShownProducts.map(p => p.price).sort((a, b) => a - b);
      const p25 = prices[Math.floor(prices.length * 0.25)] || prices[0];
      const cheaperMax = Math.max(p25 - 1, 1);
      if (!priceRange || !priceRange.max || priceRange.max > cheaperMax) {
        priceRange = { ...(priceRange || {}), max: cheaperMax };
      }
    } else if (isMoreExpensive) {
      isRelativeFollowUp = true;
      const prices = lastShownProducts.map(p => p.price).sort((a, b) => a - b);
      const p75 = prices[Math.floor(prices.length * 0.75)] || prices[prices.length - 1];
      const expensiveMin = p75 + 1;
      if (!priceRange || !priceRange.min || priceRange.min < expensiveMin) {
        priceRange = { ...(priceRange || {}), min: expensiveMin };
      }
    }
  }

  return { priceRange, isRelativeFollowUp };
}

/**
 * Detect conflict between brand domain and keyword domain.
 * e.g., "zara iphone" = clothing brand + electronics keyword.
 * Returns a response to show the user if conflict is detected, or null.
 */
function detectBrandCategoryConflict(
  keywords: ExtractedKeywords,
  searchBrands: string[],
  intentResult: DetectionResult,
  state: ConversationState,
): AIResponse | null {
  if (keywords.brands.length === 0 || keywords.categories.length === 0) return null;

  const brandCategories = getBrandDomains(keywords.brands);
  const keywordCategories = keywords.categories;
  const hasOverlap = brandCategories.some(bc => keywordCategories.includes(bc));

  if (hasOverlap || brandCategories.length === 0) return null;

  const brandPart = keywords.brands.map(b => b.charAt(0).toUpperCase() + b.slice(1)).join(', ');
  const nonBrandKeywords = keywords.rawKeywords.filter(k =>
    !keywords.brands.map(b => b.toLowerCase()).includes(k.toLowerCase())
  );

  // Clear accumulated state so next message doesn't inherit conflicting brand/category
  state.accumulatedKeywords.brands = [];
  state.accumulatedKeywords.categories = [];
  state.accumulatedKeywords.rawKeywords = [];

  const message = `It looks like **${brandPart}** is a **${brandCategories[0]}** brand, but **${nonBrandKeywords.join(', ') || keywordCategories.join(', ')}** belongs to **${keywordCategories[0]}**. Which are you looking for?`;

  return {
    message,
    quickReplies: [
      `Search ${brandPart}`,
      ...(nonBrandKeywords.length > 0
        ? nonBrandKeywords.map(k => `Search ${k.charAt(0).toUpperCase() + k.slice(1)}`)
        : keywordCategories.map(c => `Search ${c}`)
      ),
    ],
    intent: intentResult.intent,
    keywords,
  };
}

/**
 * Build search parameters for loadProducts().
 * Handles "show me more" pagination, keyword stripping, and deduplication.
 */
function buildSearchParams(
  isShowMore: boolean,
  state: ConversationState,
  searchKeyword: string | undefined,
  searchCategories: string[],
  searchBrands: string[],
  searchColors: string[],
): { keyword?: string; categories?: string[]; brands?: string[]; colors?: string[]; limit: number; skip: number } {
  if (isShowMore && state.lastSearchParams) {
    return {
      ...state.lastSearchParams,
      limit: 30,
      skip: state.lastSearchOffset,
    };
  }

  const params = {
    keyword: searchKeyword || undefined,
    categories: searchCategories.length > 0 ? [...new Set(searchCategories)] : undefined,
    brands: searchBrands.length > 0 ? [...new Set(searchBrands)] : undefined,
    colors: searchColors.length > 0 ? searchColors : undefined,
    limit: 30,
    skip: 0,
  };

  // Save params for next "show me more"
  state.lastSearchParams = {
    keyword: params.keyword,
    categories: params.categories,
    brands: params.brands,
    colors: params.colors,
  };

  return params;
}

// =====================================================================
// generateResponse — orchestrator
// =====================================================================

/**
 * Generate AI response by orchestrating helper functions.
 * Loads products from DB based on intent & keywords, then scores them.
 */
async function generateResponse(
  intentResult: DetectionResult,
  keywords: ExtractedKeywords,
  context: UserContext,
  state: ConversationState
): Promise<AIResponse> {
  let recommendations: ScoredProduct[] | undefined;
  let message = intentResult.responseTemplate;

  const recommendIntents = ['SEARCH_PRODUCT', 'RECOMMEND', 'ASK_PRICE', 'ASK_STOCK', 'BROWSE'];
  const isGenericFallback = intentResult.intent === 'UNKNOWN'
    && intentResult.fallback?.shouldSearchProducts === true;

  if (!recommendIntents.includes(intentResult.intent) && !isGenericFallback) {
    return { message, quickReplies: intentResult.quickReplies, recommendations, intent: intentResult.intent, keywords };
  }

  const lastUserMessage = state.messages[state.messages.length - 1]?.content?.trim().toLowerCase() || '';

  // ── Product title search fast path ──
  if (keywords.isProductTitleSearch) {
    const titleKeyword = keywords.rawKeywords.join(' ');
    log.info('Product title search', { titleKeyword });
    const products = await loadProducts({ keyword: titleKeyword, limit: 30 });

    if (products.length === 0) {
      return {
        message: `I couldn't find products matching "${titleKeyword}". Try a shorter search or browse by category!`,
        quickReplies: ['Search products', 'Browse categories', 'Get recommendations'],
        intent: intentResult.intent, keywords,
      };
    }

    const scored = scoreProducts(products, context, keywords);
    recommendations = getTopRecommendations(scored, 5, 10);
    state.lastShownProductIds = recommendations.map(r => r.product.id);
    state.lastShownProducts = recommendations.map(r => r.product);
    state.lastSearchParams = { keyword: titleKeyword };

    return {
      message: `Here's what I found for "${titleKeyword.split(' ').slice(0, 3).join(' ')}...":`,
      quickReplies: ['Show me more', 'Filter by price', 'Compare them'],
      recommendations, intent: intentResult.intent, keywords,
    };
  }

  // ── Resolve search dimensions ──
  const searchBrands = resolveSearchBrands(keywords);
  const searchCategories = resolveSearchCategories(keywords, context, state);
  const searchColors = keywords.colors.length > 0 ? keywords.colors : [];

  // Log search params
  const rawLogKeyword = intentResult.extractedText || keywords.rawKeywords.join(' ') || undefined;
  log.info('Search params', { intent: intentResult.intent, keyword: rawLogKeyword, categories: keywords.categories, brands: keywords.brands });

  // ── Brand-category conflict detection ──
  const conflictResponse = detectBrandCategoryConflict(keywords, searchBrands, intentResult, state);
  if (conflictResponse) return conflictResponse;

  // ── Resolve price constraints ──
  const { priceRange, isRelativeFollowUp } = resolvePriceConstraints(
    keywords, searchCategories, lastUserMessage, state.lastShownProducts,
  );
  keywords.priceRange = priceRange;

  // ── Detect "Show me more" pagination ──
  const userMsgContent = state.messages[state.messages.length - 1]?.content?.trim() || '';
  const isShowMore = state.lastSearchParams != null && (
    /show\s+(?:me\s+)?more|more\s+(?:products?|options?|results?)/i.test(userMsgContent) ||
    /^(?:more|next|next\s+page)$/i.test(userMsgContent)
  );
  if (isShowMore) { state.lastSearchOffset += 5; } else { state.lastSearchOffset = 0; }

  // ── Build search keyword (strip brands and category NAMES from keyword) ──
  // IMPORTANT: Only strip category NAMES (e.g., "electronics", "shoes"), NOT
  // category dictionary keywords (e.g., "laptop", "phone", "watch").
  // Dictionary keywords are the user's actual search terms and must be preserved
  // for DB text matching. Stripping them loses the user's intent entirely.
  // Example: "laptop" should remain as keyword to find laptop products within electronics.
  const rawSearchKeyword = keywords.rawKeywords.join(' ') || intentResult.extractedText || undefined;
  let searchKeyword = rawSearchKeyword;
  if (rawSearchKeyword) {
    const brandsLower = searchBrands.map(b => b.toLowerCase());
    
    // Only strip category NAMES (the keys of the category map), not their keywords
    const categoryNamesLower = new Set<string>();
    for (const cat of searchCategories) {
      const catLower = cat.toLowerCase();
      categoryNamesLower.add(catLower);
      // Stem: "shoes" → "shoe", "electronics" → "electronic"
      if (catLower.endsWith('s') && catLower.length > 3) {
        categoryNamesLower.add(catLower.slice(0, -1));
      }
      if (catLower.endsWith('ies') && catLower.length > 4) {
        categoryNamesLower.add(catLower.slice(0, -3) + 'y');
      }
    }

    searchKeyword = rawSearchKeyword.split(/\s+/)
      .filter(w => {
        const wLower = w.toLowerCase();
        // Exact brand match OR fuzzy match (catches typos like "addidas" → "adidas")
        const isBrand = brandsLower.includes(wLower) ||
          (brandsLower.length > 0 && wLower.length >= 3 && fuzzyMatch(wLower, brandsLower, 2) !== null);
        const isCategoryName = categoryNamesLower.has(wLower);
        return !isBrand && !isCategoryName;
      })
      .join(' ').trim() || undefined;
  }

  // ── Build search params + load products ──
  const searchParams = buildSearchParams(isShowMore, state, searchKeyword, searchCategories, searchBrands, searchColors);
  const products = await loadProducts(searchParams);

  if (products.length > 0) {
    const scored = scoreProducts(products, context, keywords);

    // Price filtering
    let filteredScored = scored;
    if (priceRange) {
      filteredScored = scored.filter(sp => {
        const price = sp.product.price;
        if (priceRange.min && priceRange.max) return price >= priceRange.min && price <= priceRange.max;
        if (priceRange.min) return price >= priceRange.min;
        if (priceRange.max) return price <= priceRange.max;
        return true;
      });
      if (filteredScored.length === 0) {
        filteredScored = scored;
        if (isRelativeFollowUp) {
          message = `I couldn't find products in that price range compared to the previous results, but here are the closest options:`;
        } else {
          const rangeText = priceRange.max ? `under $${priceRange.max}` : `over $${priceRange.min}`;
          message = `I couldn't find exact matches ${rangeText}, but here are the closest options:`;
        }
      }
    }

    // For show-more: exclude previously shown products to avoid duplicates
    // Note: relative price follow-ups ("cheaper") should NOT exclude previous products
    // because the user is refining by price, not asking for more of the same.
    if (isShowMore && state.lastShownProductIds.length > 0) {
      filteredScored = filteredScored.filter(sp => !state.lastShownProductIds.includes(sp.product.id));
    }

    recommendations = getTopRecommendations(filteredScored, 5, 10);

    if (recommendations.length > 0) {
      state.lastShownProductIds = recommendations.map(r => r.product.id);
      state.lastShownProducts = recommendations.map(r => r.product);

      if (isShowMore) {
        message = `Here are more results:`;
      } else if (isRelativeFollowUp) {
        const direction = RELATIVE_PRICE_PATTERNS.cheaper.test(lastUserMessage) ? 'more affordable' : 'higher-end';
        message = `Here are ${direction} options for you:`;
      } else if (!message.includes('closest options')) {
        message = `I found ${recommendations.length} products for you:`;
      }
    } else {
      recommendations = getTopRecommendations(filteredScored, 5, 0);
      if (recommendations.length > 0) {
        state.lastShownProductIds = recommendations.map(r => r.product.id);
        state.lastShownProducts = recommendations.map(r => r.product);
        message = "Here are some products you might be interested in:";
      } else if (isShowMore) {
        message = "I've shown you all the available products for this search. Try a different query!";
        state.lastSearchOffset = 0;
      }
    }
  } else if (intentResult.intent === 'BROWSE') {
    message = intentResult.responseTemplate;
  } else {
    // Smart "not found" responses
    if (searchBrands.length > 0 && !searchKeyword) {
      const brandName = searchBrands.map(b => b.charAt(0).toUpperCase() + b.slice(1)).join(', ');
      message = `We don't currently carry **${brandName}** products. Try browsing our available brands or search for a specific product!`;
    } else if (searchBrands.length > 0) {
      const brandName = searchBrands.map(b => b.charAt(0).toUpperCase() + b.slice(1)).join(', ');
      message = `I couldn't find **${brandName}** products matching "${searchKeyword}". Try a different keyword or browse other brands!`;
    } else {
      message = "I couldn't find products matching that criteria right now. Try a different search or browse our categories!";
    }
  }

  return { message, quickReplies: intentResult.quickReplies, recommendations, intent: intentResult.intent, keywords };
}

/**
 * Get conversation history
 */
export function getConversationHistory(conversationId: string, limit: number = 10): ChatMessage[] {
  const state = conversationStore.get(conversationId);
  if (!state) return [];
  return state.messages.slice(-limit);
}

/**
 * Get accumulated keywords from conversation
 */
export function getAccumulatedKeywords(conversationId: string): ExtractedKeywords | undefined {
  return conversationStore.get(conversationId)?.accumulatedKeywords;
}

/**
 * Get accumulated keywords from the most recent active chat session for a user.
 * Used by Profile recommendations to incorporate chat-derived preferences.
 */
export function getActiveSessionKeywords(userId: string): ExtractedKeywords | undefined {
  let latest: ConversationState | undefined;

  const allSessions = Array.from(conversationStore.values());
  const matchingSessions = allSessions.filter(s => s.userId === userId);

  log.info('getActiveSessionKeywords lookup', {
    searchUserId: userId,
    totalSessions: allSessions.length,
    matchingSessions: matchingSessions.length,
    sessionUserIds: allSessions.map(s => s.userId ?? '(anonymous)').join(', '),
  });

  for (const state of conversationStore.values()) {
    if (state.userId === userId) {
      if (!latest || state.lastMessageAt > latest.lastMessageAt) {
        latest = state;
      }
    }
  }

  if (latest) {
    log.info('Found active session', {
      conversationId: latest.conversationId,
      keywords: latest.accumulatedKeywords.rawKeywords,
      categories: latest.accumulatedKeywords.categories,
      brands: latest.accumulatedKeywords.brands,
    });
  } else {
    log.info('No active session found for userId', { userId });
  }

  return latest?.accumulatedKeywords;
}

/**
 * Clear conversation (for testing)
 */
export function clearConversation(conversationId: string): void {
  conversationStore.delete(conversationId);
}

/**
 * Reset conversation — destroys old session, starts a fresh one for same user.
 * Used by the "New Conversation" button in the chatbox UI.
 */
export async function resetConversation(oldConversationId: string): Promise<ConversationState> {
  // Retrieve userId from old session before deleting
  const old = conversationStore.get(oldConversationId);
  const userId = old?.userId;

  // Remove old session
  conversationStore.delete(oldConversationId);

  // Start fresh session (re-loads DB context if authenticated)
  return startConversation(userId);
}

/**
 * Migrate an anonymous session to an authenticated one.
 * Preserves accumulated keywords, messages, and intents from the anonymous chat.
 * Enriches the session with the user's DB behavior context.
 *
 * Use case: user starts chatting anonymously, then logs in mid-conversation.
 */
export async function migrateSession(
  oldConversationId: string,
  userId: string
): Promise<ConversationState | null> {
  const state = conversationStore.get(oldConversationId);
  if (!state) return null;

  // Already owned by this user → no-op
  if (state.userId === userId) return state;

  // Load the authenticated user's DB context
  const dbContext = await loadUserContext(userId);
  const freshContext = dbContext || createAnonymousContext();
  freshContext.userId = userId;

  // Merge: DB context + existing chat keywords from the anonymous session
  const mergedContext = mergeContexts(freshContext, state.accumulatedKeywords);

  // Upgrade the session in-place
  state.userId = userId;
  state.isAuthenticated = true;
  state.userContext = mergedContext;

  log.info('Session migrated', {
    conversationId: oldConversationId,
    userId,
    keywords: state.accumulatedKeywords.rawKeywords.length,
    categories: state.accumulatedKeywords.categories.length,
  });

  return state;
}

/**
 * Clear all conversations (for testing)
 */
export function clearAllConversations(): void {
  conversationStore.clear();
}
