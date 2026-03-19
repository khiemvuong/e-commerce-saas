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
  getBrandDomains,
} from '../config/keywords.config';


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
    console.log(`[ChatService] Cleanup: removed ${removed} sessions, ${conversationStore.size} remaining`);
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
    console.log(`[ChatService] Loaded DB context for user ${userId}: ${userContext.viewedCategories.length} viewed categories, ${userContext.cartProductIds.length} cart items`);
  } else {
    userContext = createAnonymousContext();
    console.log('[ChatService] Anonymous session started');
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
  console.log(`[ChatService] New session ${conversationId}, total active: ${conversationStore.size}`);
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
    userHasSpecificKeywords;

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
    console.log(`[ChatService] Product title search: "${titleKeyword}"`);
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
      quickReplies: ['Show me more', 'Filter by price', 'Different category'],
      recommendations, intent: intentResult.intent, keywords,
    };
  }

  // ── Resolve search dimensions ──
  const searchBrands = resolveSearchBrands(keywords);
  const searchCategories = resolveSearchCategories(keywords, context, state);
  const searchColors = keywords.colors.length > 0 ? keywords.colors : [];

  // Log search params
  const rawLogKeyword = intentResult.extractedText || keywords.rawKeywords.join(' ') || undefined;
  console.log(`[ChatService] Search params — intent: ${intentResult.intent}, keyword: "${rawLogKeyword}", categories: [${keywords.categories}], brands: [${keywords.brands}]`);

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

  // ── Build search keyword (strip brands from keyword) ──
  const rawSearchKeyword = keywords.rawKeywords.join(' ') || intentResult.extractedText || undefined;
  const searchKeyword = searchBrands.length > 0 && rawSearchKeyword
    ? rawSearchKeyword.split(/\s+/)
        .filter(w => !searchBrands.map(b => b.toLowerCase()).includes(w.toLowerCase()))
        .join(' ').trim() || rawSearchKeyword
    : rawSearchKeyword;

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

    // For show-more + relative follow-up: exclude previously shown products
    if ((isShowMore || isRelativeFollowUp) && state.lastShownProductIds.length > 0) {
      filteredScored = filteredScored.filter(sp => !state.lastShownProductIds.includes(sp.product.id));
    }

    recommendations = getTopRecommendations(filteredScored, 5, 10);

    if (recommendations.length > 0) {
      state.lastShownProductIds = recommendations.map(r => r.product.id);
      state.lastShownProducts = recommendations.map(r => r.product);

      if (isShowMore) {
        message = `Here are more results:`;
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

  for (const state of conversationStore.values()) {
    if (state.userId === userId) {
      if (!latest || state.lastMessageAt > latest.lastMessageAt) {
        latest = state;
      }
    }
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
 * Clear all conversations (for testing)
 */
export function clearAllConversations(): void {
  conversationStore.clear();
}
