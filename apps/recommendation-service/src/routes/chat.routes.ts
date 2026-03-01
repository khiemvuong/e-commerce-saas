/**
 * Chat Routes
 * 
 * REST API endpoints for the AI chatbox.
 * Handles both logged-in (userId) and anonymous users.
 */

import { Router, Request, Response } from 'express';
import {
  startConversation,
  processMessage,
  getConversation,
  getConversationHistory,
  getAccumulatedKeywords,
  getActiveSessionKeywords,
} from '../core/chat-service';
import { loadUserContext } from '../data/user-context-loader';
import { loadProducts } from '../data/product-loader';
import { scoreProducts, getTopRecommendations } from '../core/recommendation-engine';
import { getAllSuggestionTerms, fuzzyMatch } from '../core/keyword-extractor';

const router = Router();

// ========== Rate Limiting Config ==========
const RATE_MAX_MESSAGES = 5;         // max messages per window
const RATE_WINDOW_MS = 10 * 1000;    // 10-second window
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

/**
 * GET /api/chat/suggest
 * Autocomplete suggestions for chatbox input.
 * Returns matching brands, categories, colors based on prefix or fuzzy match.
 * 
 * Query: ?q=addi → [{ text: "adidas", type: "brand" }]
 */
router.get('/suggest', (req: Request, res: Response) => {
  const q = (req.query.q as string || '').toLowerCase().trim();
  
  if (q.length < 2) {
    res.json({ success: true, suggestions: [] });
    return;
  }

  const terms = getAllSuggestionTerms();
  const suggestions: Array<{ text: string; type: 'brand' | 'category' | 'color'; isCorrection: boolean }> = [];
  const seen = new Set<string>();

  const addSuggestion = (text: string, type: 'brand' | 'category' | 'color', isCorrection: boolean) => {
    const key = `${type}:${text.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      suggestions.push({ text, type, isCorrection });
    }
  };

  // 1. Prefix matches (highest priority)
  for (const brand of terms.brands) {
    if (brand.toLowerCase().startsWith(q)) {
      addSuggestion(brand, 'brand', false);
    }
  }
  for (const cat of terms.categories) {
    if (cat.toLowerCase().startsWith(q)) {
      addSuggestion(cat, 'category', false);
    }
  }
  for (const color of terms.colors) {
    if (color.toLowerCase().startsWith(q)) {
      addSuggestion(color, 'color', false);
    }
  }

  // 2. Contains matches (medium priority)
  if (suggestions.length < 5) {
    for (const brand of terms.brands) {
      if (brand.toLowerCase().includes(q) && !brand.toLowerCase().startsWith(q)) {
        addSuggestion(brand, 'brand', false);
      }
    }
    for (const cat of terms.categories) {
      if (cat.toLowerCase().includes(q) && !cat.toLowerCase().startsWith(q)) {
        addSuggestion(cat, 'category', false);
      }
    }
  }

  // 3. Fuzzy matches (for typos like "adisdas" → "adidas")
  if (suggestions.length < 5 && q.length >= 3) {
    const fuzzyBrand = fuzzyMatch(q, terms.brands, 2);
    if (fuzzyBrand) addSuggestion(fuzzyBrand, 'brand', true);

    const fuzzyCat = fuzzyMatch(q, terms.categories, 2);
    if (fuzzyCat) addSuggestion(fuzzyCat, 'category', true);

    const fuzzyColor = fuzzyMatch(q, terms.colors, 2);
    if (fuzzyColor) addSuggestion(fuzzyColor, 'color', true);
  }

  // Limit to 8 suggestions
  res.json({
    success: true,
    suggestions: suggestions.slice(0, 8),
  });
});

/**
 * POST /api/chat/start
 * Start a new chat conversation.
 * 
 * Body: { userId?: string }
 * - userId present → logged-in user, loads behavior data from DB
 * - userId absent → anonymous user, session-only context
 */
router.post('/start', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const conversation = await startConversation(userId);
    
    res.json({
      success: true,
      data: {
        conversationId: conversation.conversationId,
        isAuthenticated: conversation.isAuthenticated,
        message: conversation.isAuthenticated
          ? `Welcome back! I've loaded your preferences to give you better recommendations. How can I help you today?`
          : 'How can I help you today?',
        quickReplies: ['Search products', 'Get recommendations', 'Browse categories'],
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * POST /api/chat/message
 * Send a message and get AI response with scored recommendations.
 * 
 * Body: { conversationId: string, message: string }
 */
router.post('/message', async (req: Request, res: Response): Promise<void> => {
  try {
    const { conversationId, message } = req.body;
    
    if (!conversationId || !message) {
      res.status(400).json({
        success: false,
        error: 'conversationId and message are required',
      });
      return;
    }

    // ========== Rate Limiting ==========
    const now = Date.now();
    const limit = rateLimitMap.get(conversationId);
    if (limit && now - limit.windowStart < RATE_WINDOW_MS) {
      if (limit.count >= RATE_MAX_MESSAGES) {
        const retryAfter = Math.ceil((RATE_WINDOW_MS - (now - limit.windowStart)) / 1000);
        res.status(429).json({
          success: false,
          error: 'Too many messages. Please slow down.',
          retryAfter,
        });
        return;
      }
      limit.count++;
    } else {
      rateLimitMap.set(conversationId, { count: 1, windowStart: now });
    }
    // Cleanup stale rate limit entries
    if (rateLimitMap.size > 100) {
      for (const [id, entry] of rateLimitMap) {
        if (now - entry.windowStart > 60_000) rateLimitMap.delete(id);
      }
    }
    // ====================================
    
    const response = await processMessage(conversationId, message);
    
    res.json({
      success: true,
      data: {
        message: response.message,
        quickReplies: response.quickReplies,
        recommendations: response.recommendations?.map(r => ({
          productId: r.product.id,
          title: r.product.title,
          category: r.product.category,
          brand: r.product.brand,
          price: r.product.price,
          image: r.product.image || '',
          slug: r.product.slug || '',
          rating: r.product.rating,
          score: r.score,
          scoreBreakdown: r.scoreBreakdown,
          matchReasons: r.matchReasons,
        })),
        intent: response.intent,
        extractedKeywords: response.keywords,
        // ===== Enhanced response fields =====
        comparison: response.comparison ? {
          products: response.comparison.products.map(p => ({
            id: p.id,
            title: p.title,
            brand: p.brand,
            price: p.price,
            image: p.image || '',
            rating: p.rating,
          })),
          comparisonTable: response.comparison.comparisonTable,
          verdict: response.comparison.verdict,
        } : undefined,
        clarification: response.clarification ? {
          question: response.clarification.question,
          options: response.clarification.options,
          clarificationType: response.clarification.clarificationType,
          showPreview: response.clarification.showPreview,
          previewCount: response.clarification.previewCount,
        } : undefined,
        fallback: response.fallback ? {
          correctedQuery: response.fallback.correctedQuery,
          originalTerm: response.fallback.originalTerm,
          fallbackType: response.fallback.fallbackType,
          confidence: response.fallback.confidence,
          suggestions: response.fallback.suggestions,
        } : undefined,
        isFollowUp: response.isFollowUp || false,
        originalMessage: response.originalMessage,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * GET /api/chat/:conversationId
 * Get conversation details
 */
router.get('/:conversationId', (req: Request, res: Response): void => {
  try {
    const { conversationId } = req.params;
    const conversation = getConversation(conversationId);
    
    if (!conversation) {
      res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
      return;
    }
    
    res.json({
      success: true,
      data: {
        conversationId: conversation.conversationId,
        userId: conversation.userId,
        isAuthenticated: conversation.isAuthenticated,
        startedAt: conversation.startedAt,
        lastMessageAt: conversation.lastMessageAt,
        messageCount: conversation.messages.length,
        detectedIntents: conversation.detectedIntents,
        // Include context summary for debugging
        contextSummary: {
          viewedCategories: conversation.userContext.viewedCategories.length,
          cartItems: conversation.userContext.cartProductIds.length,
          wishlistItems: conversation.userContext.wishlistProductIds.length,
          chatKeywords: conversation.accumulatedKeywords.rawKeywords,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * GET /api/chat/:conversationId/history
 * Get conversation message history
 */
router.get('/:conversationId/history', (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const history = getConversationHistory(conversationId, limit);
    
    res.json({
      success: true,
      data: history.map(msg => ({
        id: msg.id,
        senderType: msg.senderType,
        content: msg.content,
        timestamp: msg.timestamp,
        intent: msg.intent,
        recommendations: msg.recommendations,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * GET /api/chat/:conversationId/context
 * Get accumulated keywords/context for debugging
 */
router.get('/:conversationId/context', (req: Request, res: Response): void => {
  try {
    const { conversationId } = req.params;
    const keywords = getAccumulatedKeywords(conversationId);
    
    if (!keywords) {
      res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
      return;
    }
    
    res.json({
      success: true,
      data: keywords,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

/**
 * GET /api/user-recommendations/:userId
 * Get personalized recommendations with full score breakdown for a user.
 * Used by the profile page to show "Recommended for You" with visual scoring.
 */
router.get('/user-recommendations/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      res.status(400).json({ success: false, error: 'userId is required' });
      return;
    }

    // Load user's behavior context from DB
    const userContext = await loadUserContext(userId);
    
    if (!userContext) {
      res.json({
        success: true,
        data: {
          recommendations: [],
          userBehavior: null,
          message: 'No user behavior data found',
        },
      });
      return;
    }

    // Load products — use user's viewed categories for relevance, or popular products
    const categories = userContext.viewedCategories.length > 0
      ? userContext.viewedCategories
      : undefined;
    
    const brands = userContext.cartBrands.length > 0
      ? userContext.cartBrands
      : undefined;

    const products = await loadProducts({
      categories,
      brands,
      limit: 30,
    });

    if (products.length === 0) {
      // Fallback: load popular products without filters
      const fallbackProducts = await loadProducts({ limit: 30 });
      
      if (fallbackProducts.length === 0) {
        res.json({
          success: true,
          data: {
            recommendations: [],
            userBehavior: {
              viewedCategories: userContext.viewedCategories,
              cartBrands: userContext.cartBrands,
              viewedProductCount: userContext.viewedProductIds.length,
              cartProductCount: userContext.cartProductIds.length,
              wishlistProductCount: userContext.wishlistProductIds.length,
              priceRange: userContext.priceRange,
              preferredColors: userContext.preferredColors,
            },
            message: 'No products available for recommendations',
          },
        });
        return;
      }
      
      products.push(...fallbackProducts);
    }

    // Merge in-memory chat session keywords if user has an active chat
    const chatKeywords = getActiveSessionKeywords(userId);
    if (chatKeywords) {
      // Merge chat keywords into user context for scoring
      if (chatKeywords.categories?.length) {
        userContext.chatCategories = [...new Set([...userContext.chatCategories, ...chatKeywords.categories])];
      }
      if (chatKeywords.brands?.length) {
        userContext.chatBrands = [...new Set([...userContext.chatBrands, ...chatKeywords.brands])];
      }
      if (chatKeywords.rawKeywords?.length) {
        userContext.chatKeywords = [...new Set([...userContext.chatKeywords, ...chatKeywords.rawKeywords])];
      }
    }

    // Score all products (now includes chat keywords if available)
    const scored = scoreProducts(products, userContext, chatKeywords);
    const topRecs = getTopRecommendations(scored, 10, 0);

    // Since Profile page has no chat context, Chat score = 0
    // Redistribute chat weight (α=0.35) proportionally to other weights
    const hasChat = userContext.chatKeywords.length > 0 || userContext.chatCategories.length > 0;
    const originalWeights = { chat: 0.35, behavior: 0.30, popularity: 0.20, price: 0.15 };
    
    let effectiveWeights = { ...originalWeights };
    if (!hasChat) {
      // Redistribute chat weight proportionally: β/(β+γ+δ), γ/(β+γ+δ), δ/(β+γ+δ)
      const remaining = originalWeights.behavior + originalWeights.popularity + originalWeights.price;
      effectiveWeights = {
        chat: 0,
        behavior: originalWeights.behavior / remaining,
        popularity: originalWeights.popularity / remaining,
        price: originalWeights.price / remaining,
      };
    }

    // Recalculate total score with effective weights
    const adjustedRecs = topRecs.map(r => {
      const adjustedScore = 
        effectiveWeights.chat * r.scoreBreakdown.chatScore +
        effectiveWeights.behavior * r.scoreBreakdown.behaviorScore +
        effectiveWeights.popularity * r.scoreBreakdown.popularityScore +
        effectiveWeights.price * r.scoreBreakdown.priceScore;

      return { ...r, adjustedScore };
    });

    // Re-sort by adjusted score
    adjustedRecs.sort((a, b) => b.adjustedScore - a.adjustedScore);

    // Build user behavior summary
    const userBehavior = {
      viewedCategories: [...new Set(userContext.viewedCategories)],
      cartBrands: [...new Set(userContext.cartBrands)],
      viewedProductCount: userContext.viewedProductIds.length,
      cartProductCount: userContext.cartProductIds.length,
      wishlistProductCount: userContext.wishlistProductIds.length,
      priceRange: userContext.priceRange,
      preferredColors: [...new Set(userContext.preferredColors)],
    };

    res.json({
      success: true,
      data: {
        recommendations: adjustedRecs.map(r => ({
          productId: r.product.id,
          title: r.product.title,
          category: r.product.category,
          brand: r.product.brand,
          price: r.product.price,
          image: r.product.image || '',
          slug: r.product.slug || '',
          rating: r.product.rating,
          totalSales: r.product.totalSales,
          score: Math.round(r.adjustedScore * 10) / 10,
          scoreBreakdown: {
            chatScore: Math.round(r.scoreBreakdown.chatScore * 10) / 10,
            behaviorScore: Math.round(r.scoreBreakdown.behaviorScore * 10) / 10,
            popularityScore: Math.round(r.scoreBreakdown.popularityScore * 10) / 10,
            priceScore: Math.round(r.scoreBreakdown.priceScore * 10) / 10,
          },
          matchReasons: r.matchReasons,
        })),
        userBehavior,
        chatSession: chatKeywords ? {
          keywords: chatKeywords.rawKeywords || [],
          categories: chatKeywords.categories || [],
          brands: chatKeywords.brands || [],
          active: true,
        } : { keywords: [], categories: [], brands: [], active: false },
        scoringWeights: {
          chat: Math.round(effectiveWeights.chat * 100) / 100,
          behavior: Math.round(effectiveWeights.behavior * 100) / 100,
          popularity: Math.round(effectiveWeights.popularity * 100) / 100,
          price: Math.round(effectiveWeights.price * 100) / 100,
        },
      },
    });
  } catch (error) {
    console.error('[UserRecommendations] Error:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

export default router;
