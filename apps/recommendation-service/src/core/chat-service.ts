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
import { scoreProducts, getTopRecommendations, UserContext, ScoredProduct } from './recommendation-engine';
import { loadUserContext, createAnonymousContext } from '../data/user-context-loader';
import { loadProducts } from '../data/product-loader';
import { resolveContext, ContextualMessage } from './context-resolver';
import { compareProducts, ComparisonResult } from './comparison-engine';
import { shouldClarify, parseClarificationResponse, ClarificationResult } from './clarification-engine';
import { FallbackResult } from './smart-fallback';
import { Intent, ENHANCED_TEMPLATES } from '../config/intents.config';

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
  if (intentResult.intent !== Intent.UNKNOWN && intentResult.intent !== Intent.GREETING && intentResult.intent !== Intent.HELP) {
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
    const comparisonResult = await compareProducts(effectiveMessage);
    
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
 * Accumulate keywords across the conversation session
 */
function accumulateKeywords(accumulated: ExtractedKeywords, newKeywords: ExtractedKeywords): void {
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
    // If chat specifies a price range, it overrides behavior-inferred range
    priceRange: chatKeywords.priceRange || dbContext.priceRange,
    // Merge color preferences
    preferredColors: [
      ...new Set([...dbContext.preferredColors, ...chatKeywords.colors]),
    ],
  };
}

/**
 * Generate AI response.
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
  
  // Intents that should trigger product recommendations
  const recommendIntents = ['SEARCH_PRODUCT', 'RECOMMEND', 'ASK_PRICE', 'ASK_STOCK', 'BROWSE'];

  // UNKNOWN intent with generic fallback — still show trending products
  const isGenericFallback = intentResult.intent === 'UNKNOWN' 
    && intentResult.fallback?.shouldSearchProducts === true;
  
  if (recommendIntents.includes(intentResult.intent) || isGenericFallback) {
    // Build search parameters from intent + keywords + context
    const searchKeyword = intentResult.extractedText
      || keywords.rawKeywords.join(' ')
      || undefined;
    
    console.log(`[ChatService] Search params — intent: ${intentResult.intent}, keyword: "${searchKeyword}", categories: [${keywords.categories}], brands: [${keywords.brands}], rawKeywords: [${keywords.rawKeywords}]`);
    
    const searchCategories = [
      ...keywords.categories,
      ...context.chatCategories,
      ...(state.isAuthenticated ? context.viewedCategories : []),
    ];
    
    const searchBrands = [
      ...keywords.brands,
      ...context.chatBrands,
    ];

    // Load real products from MongoDB
    const products = await loadProducts({
      keyword: searchKeyword,
      categories: searchCategories.length > 0 ? [...new Set(searchCategories)] : undefined,
      brands: searchBrands.length > 0 ? [...new Set(searchBrands)] : undefined,
      limit: 30,
    });

    if (products.length > 0) {
      // Score products using Unified Hybrid Scoring
      const scored = scoreProducts(products, context, keywords);
      recommendations = getTopRecommendations(scored, 5, 10);
      
      if (recommendations.length > 0) {
        message = `${intentResult.responseTemplate}\n\nI found ${recommendations.length} products for you:`;
      } else {
        // Show top products even with low scores
        recommendations = getTopRecommendations(scored, 5, 0);
        message = "Here are some products you might be interested in:";
      }
    } else if (intentResult.intent === 'BROWSE') {
      // Browse intent — the template itself is informative
      message = intentResult.responseTemplate;
    } else {
      message = "I couldn't find products matching that criteria right now. Try a different search or browse our categories!";
    }
  }
  
  return {
    message,
    quickReplies: intentResult.quickReplies,
    recommendations,
    intent: intentResult.intent,
    keywords,
  };
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
 * Clear all conversations (for testing)
 */
export function clearAllConversations(): void {
  conversationStore.clear();
}
