/**
 * Chat Service
 * 
 * Manages AI chatbox conversations and message history.
 * Integrates with existing conversation models from the chatting-service.
 */

import { detectIntent, DetectionResult } from './intent-detector';
import { extractKeywords, ExtractedKeywords } from './keyword-extractor';
import { scoreProducts, getTopRecommendations, UserContext, ProductForScoring, ScoredProduct } from './recommendation-engine';

/**
 * Chat message structure
 */
export interface ChatMessage {
  id: string;
  conversationId: string;
  senderType: 'user' | 'ai';
  content: string;
  timestamp: Date;
  // AI-specific fields
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
  startedAt: Date;
  lastMessageAt: Date;
  messages: ChatMessage[];
  // Accumulated context
  accumulatedKeywords: ExtractedKeywords;
  detectedIntents: string[];
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
 * In-memory conversation store (for testing)
 * In production, this would use the existing MongoDB models
 */
const conversationStore = new Map<string, ConversationState>();

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Start a new conversation
 */
export function startConversation(userId?: string): ConversationState {
  const conversationId = generateId();
  const state: ConversationState = {
    conversationId,
    userId,
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
  };
  
  conversationStore.set(conversationId, state);
  return state;
}

/**
 * Get conversation by ID
 */
export function getConversation(conversationId: string): ConversationState | undefined {
  return conversationStore.get(conversationId);
}

/**
 * Process user message and generate AI response
 */
export function processMessage(
  conversationId: string,
  userMessage: string,
  products: ProductForScoring[],
  userContext: UserContext
): AIResponse {
  const state = conversationStore.get(conversationId);
  if (!state) {
    throw new Error(`Conversation ${conversationId} not found`);
  }
  
  // Detect intent
  const intentResult = detectIntent(userMessage);
  
  // Extract keywords
  const keywords = extractKeywords(userMessage);
  
  // Store user message
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
  
  // Accumulate keywords
  accumulateKeywords(state.accumulatedKeywords, keywords);
  
  // Add intent to history
  if (!state.detectedIntents.includes(intentResult.intent)) {
    state.detectedIntents.push(intentResult.intent);
  }
  
  // Generate response and recommendations
  const response = generateResponse(intentResult, keywords, products, userContext, state);
  
  // Store AI message
  const aiMsg: ChatMessage = {
    id: generateId(),
    conversationId,
    senderType: 'ai',
    content: response.message,
    timestamp: new Date(),
    recommendations: response.recommendations?.map(r => r.product.id),
  };
  state.messages.push(aiMsg);
  
  // Update last message time
  state.lastMessageAt = new Date();
  
  return response;
}

/**
 * Accumulate keywords across conversation
 */
function accumulateKeywords(accumulated: ExtractedKeywords, newKeywords: ExtractedKeywords): void {
  accumulated.categories.push(...newKeywords.categories.filter(c => !accumulated.categories.includes(c)));
  accumulated.brands.push(...newKeywords.brands.filter(b => !accumulated.brands.includes(b)));
  accumulated.colors.push(...newKeywords.colors.filter(c => !accumulated.colors.includes(c)));
  accumulated.sizes.push(...newKeywords.sizes.filter(s => !accumulated.sizes.includes(s)));
  accumulated.rawKeywords.push(...newKeywords.rawKeywords.filter(k => !accumulated.rawKeywords.includes(k)));
  
  // Keep price range and gender from latest
  if (newKeywords.priceRange) {
    accumulated.priceRange = newKeywords.priceRange;
  }
  if (newKeywords.priceModifier) {
    accumulated.priceModifier = newKeywords.priceModifier;
  }
  if (newKeywords.gender) {
    accumulated.gender = newKeywords.gender;
  }
}

/**
 * Generate AI response based on context
 */
function generateResponse(
  intentResult: DetectionResult,
  keywords: ExtractedKeywords,
  products: ProductForScoring[],
  userContext: UserContext,
  state: ConversationState
): AIResponse {
  let recommendations: ScoredProduct[] | undefined;
  let message = intentResult.responseTemplate;
  
  // Get recommendations for relevant intents
  const recommendIntents = ['SEARCH_PRODUCT', 'RECOMMEND', 'ASK_PRICE', 'ASK_STOCK'];
  if (recommendIntents.includes(intentResult.intent)) {
    // Merge user context with chat context
    const enrichedContext: UserContext = {
      ...userContext,
      chatKeywords: state.accumulatedKeywords.rawKeywords,
      chatCategories: state.accumulatedKeywords.categories,
      chatBrands: state.accumulatedKeywords.brands,
    };
    
    const scored = scoreProducts(products, enrichedContext, keywords);
    recommendations = getTopRecommendations(scored, 5, 20);
    
    if (recommendations.length > 0) {
      message = `${intentResult.responseTemplate}\n\nI found ${recommendations.length} products for you:`;
    } else {
      message = "I couldn't find products matching your criteria. Would you like to try different search terms?";
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
 * Get conversation history for context
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
