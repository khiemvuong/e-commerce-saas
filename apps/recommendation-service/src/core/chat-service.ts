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
 * Flow:
 * 1. Detect intent
 * 2. Extract keywords
 * 3. Save user message
 * 4. Accumulate keywords into session context
 * 5. Merge session context with DB context
 * 6. Load relevant products from DB
 * 7. Score products using Unified Hybrid Scoring
 * 8. Generate response
 * 9. Save AI message
 */
export async function processMessage(
  conversationId: string,
  userMessage: string,
): Promise<AIResponse> {
  const state = conversationStore.get(conversationId);
  if (!state) {
    throw new Error(`Conversation ${conversationId} not found`);
  }
  
  // Step 1: Detect intent
  const intentResult = detectIntent(userMessage);
  
  // Step 2: Extract keywords
  const keywords = extractKeywords(userMessage);
  
  // Step 3: Save user message
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
  
  // Step 4: Accumulate keywords into session context
  accumulateKeywords(state.accumulatedKeywords, keywords);
  
  if (!state.detectedIntents.includes(intentResult.intent)) {
    state.detectedIntents.push(intentResult.intent);
  }

  // Step 5: Merge session context with DB context
  const mergedContext = mergeContexts(state.userContext, state.accumulatedKeywords);

  // Step 6-8: Generate response (loads products & scores internally)
  const response = await generateResponse(intentResult, keywords, mergedContext, state);
  
  // Step 9: Save AI message
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
  
  if (recommendIntents.includes(intentResult.intent)) {
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
