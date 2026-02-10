/**
 * Chat Routes
 * 
 * REST API endpoints for the AI chatbox.
 */

import { Router, Request, Response } from 'express';
import {
  startConversation,
  processMessage,
  getConversation,
  getConversationHistory,
  getAccumulatedKeywords,
} from '../core/chat-service';
import { UserContext, ProductForScoring } from '../core/recommendation-engine';

const router = Router();

/**
 * POST /api/chat/start
 * Start a new chat conversation
 */
router.post('/start', (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const conversation = startConversation(userId);
    
    res.json({
      success: true,
      data: {
        conversationId: conversation.conversationId,
        message: 'How can I help you today?',
        quickReplies: ['Search products', 'Get recommendations', 'Check my orders'],
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
 * Send a message and get AI response
 */
router.post('/message', async (req: Request, res: Response) => {
  try {
    const { conversationId, message, products, userContext } = req.body;
    
    if (!conversationId || !message) {
      return res.status(400).json({
        success: false,
        error: 'conversationId and message are required',
      });
    }
    
    // Use provided products or empty array (in production, fetch from database)
    const productList: ProductForScoring[] = products || [];
    
    // Use provided context or empty context
    const context: UserContext = userContext || {
      chatKeywords: [],
      chatCategories: [],
      chatBrands: [],
      viewedProductIds: [],
      viewedCategories: [],
      cartProductIds: [],
      cartBrands: [],
      wishlistProductIds: [],
      preferredColors: [],
    };
    
    const response = processMessage(conversationId, message, productList, context);
    
    res.json({
      success: true,
      data: {
        message: response.message,
        quickReplies: response.quickReplies,
        recommendations: response.recommendations?.map(r => ({
          productId: r.product.id,
          title: r.product.title,
          price: r.product.price,
          score: r.score,
          matchReasons: r.matchReasons,
        })),
        intent: response.intent,
        extractedKeywords: response.keywords,
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
router.get('/:conversationId', (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const conversation = getConversation(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
    }
    
    res.json({
      success: true,
      data: {
        conversationId: conversation.conversationId,
        userId: conversation.userId,
        startedAt: conversation.startedAt,
        lastMessageAt: conversation.lastMessageAt,
        messageCount: conversation.messages.length,
        detectedIntents: conversation.detectedIntents,
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
 * Get accumulated keywords/context
 */
router.get('/:conversationId/context', (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const keywords = getAccumulatedKeywords(conversationId);
    
    if (!keywords) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
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

export default router;
