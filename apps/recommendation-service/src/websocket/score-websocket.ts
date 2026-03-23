/**
 * Score WebSocket Gateway
 * 
 * Provides realtime score updates via Socket.IO.
 * - Client connects with userId → joins room `user:{userId}`
 * - Server emits `score:update` whenever user performs an action
 * - Client can request manual refresh via `score:refresh`
 */

import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { loadUserContext } from '../data/user-context-loader';
import { loadProducts } from '../data/product-loader';
import { scoreProducts, getTopRecommendations } from '../core/recommendation-engine';
import { getActiveSessionKeywords } from '../core/chat-service';

let io: Server | null = null;

export interface ScorePayload {
  totalScore: number;
  breakdown: {
    chatScore: number;
    behaviorScore: number;
    popularityScore: number;
    priceScore: number;
  };
  userBehavior: {
    viewedCategories: string[];
    cartBrands: string[];
    viewedProductCount: number;
    cartProductCount: number;
    wishlistProductCount: number;
    priceRange?: { min?: number; max?: number };
    preferredColors: string[];
  };
  topProducts: Array<{
    title: string;
    score: number;
    category: string;
    brand?: string;
    price: number;
    breakdown: {
      chatScore: number;
      behaviorScore: number;
      popularityScore: number;
      priceScore: number;
    };
    matchReasons: string[];
  }>;
  scoringWeights: {
    chat: number;
    behavior: number;
    popularity: number;
    price: number;
  };
  /** What triggered the update */
  trigger?: {
    action: string;
    productId?: string;
    productTitle?: string;
    timestamp: string;
  };
  timestamp: string;
}

/**
 * Initialize Socket.IO on the existing HTTP server
 */
export function initScoreWebSocket(server: HttpServer): void {
  io = new Server(server, {
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:4200'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/ws/score',
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.handshake.query.userId as string;
    console.log(`[ScoreWS] Client connected: ${socket.id}, userId: ${userId || 'anonymous'}`);

    if (userId) {
      socket.join(`user:${userId}`);
      // Send initial score on connect
      computeAndEmit(userId, socket);
    }

    // Manual refresh request from client
    socket.on('score:refresh', async () => {
      if (userId) {
        await computeAndEmit(userId, socket);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[ScoreWS] Client disconnected: ${socket.id}`);
    });
  });

  console.log('[ScoreWS] WebSocket gateway initialized on /ws/score');
}

/**
 * Emit score update to a specific user's room.
 * Call this from any route handler after a user action.
 */
export async function emitScoreUpdate(
  userId: string,
  trigger?: { action: string; productId?: string; productTitle?: string; timestamp: string }
): Promise<void> {
  if (!io || !userId) return;
  const payload = await buildScorePayload(userId);
  if (payload) {
    if (trigger) payload.trigger = trigger;
    io.to(`user:${userId}`).emit('score:update', payload);
  }
}

/**
 * Compute and emit score directly to a specific socket
 */
async function computeAndEmit(userId: string, socket: Socket): Promise<void> {
  const payload = await buildScorePayload(userId);
  if (payload) {
    socket.emit('score:update', payload);
  }
}

/**
 * Build the full score payload for a user
 */
async function buildScorePayload(userId: string): Promise<ScorePayload | null> {
  try {
    const userContext = await loadUserContext(userId);
    if (!userContext) return null;

    const categories = userContext.viewedCategories.length > 0
      ? userContext.viewedCategories : undefined;
    const brands = userContext.cartBrands.length > 0
      ? userContext.cartBrands : undefined;

    let products = await loadProducts({ categories, brands, limit: 30 });
    if (products.length === 0) {
      products = await loadProducts({ limit: 30 });
    }
    if (products.length === 0) return null;

    // Merge chat session keywords
    const chatKeywords = getActiveSessionKeywords(userId);
    if (chatKeywords) {
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

    const scored = scoreProducts(products, userContext, chatKeywords);
    const topRecs = getTopRecommendations(scored, 5, 0);

    // Calculate effective weights
    const hasChat = userContext.chatKeywords.length > 0 || userContext.chatCategories.length > 0;
    const origW = { chat: 0.35, behavior: 0.30, popularity: 0.20, price: 0.15 };
    let ew = { ...origW };
    if (!hasChat) {
      const rem = origW.behavior + origW.popularity + origW.price;
      ew = { chat: 0, behavior: origW.behavior / rem, popularity: origW.popularity / rem, price: origW.price / rem };
    }

    // Compute average scores across top products
    const avgBreakdown = { chatScore: 0, behaviorScore: 0, popularityScore: 0, priceScore: 0 };
    for (const r of topRecs) {
      avgBreakdown.chatScore += r.scoreBreakdown.chatScore;
      avgBreakdown.behaviorScore += r.scoreBreakdown.behaviorScore;
      avgBreakdown.popularityScore += r.scoreBreakdown.popularityScore;
      avgBreakdown.priceScore += r.scoreBreakdown.priceScore;
    }
    const n = topRecs.length || 1;
    avgBreakdown.chatScore = Math.round((avgBreakdown.chatScore / n) * 10) / 10;
    avgBreakdown.behaviorScore = Math.round((avgBreakdown.behaviorScore / n) * 10) / 10;
    avgBreakdown.popularityScore = Math.round((avgBreakdown.popularityScore / n) * 10) / 10;
    avgBreakdown.priceScore = Math.round((avgBreakdown.priceScore / n) * 10) / 10;

    const totalScore = Math.round(
      (ew.chat * avgBreakdown.chatScore +
       ew.behavior * avgBreakdown.behaviorScore +
       ew.popularity * avgBreakdown.popularityScore +
       ew.price * avgBreakdown.priceScore) * 10
    ) / 10;

    return {
      totalScore,
      breakdown: avgBreakdown,
      userBehavior: {
        viewedCategories: [...new Set(userContext.viewedCategories)],
        cartBrands: [...new Set(userContext.cartBrands)],
        viewedProductCount: userContext.viewedProductIds.length,
        cartProductCount: userContext.cartProductIds.length,
        wishlistProductCount: userContext.wishlistProductIds.length,
        priceRange: userContext.priceRange,
        preferredColors: [...new Set(userContext.preferredColors)],
      },
      topProducts: topRecs.slice(0, 3).map(r => ({
        title: r.product.title,
        score: Math.round(r.score * 10) / 10,
        category: r.product.category,
        brand: r.product.brand,
        price: r.product.price,
        breakdown: {
          chatScore: Math.round(r.scoreBreakdown.chatScore * 10) / 10,
          behaviorScore: Math.round(r.scoreBreakdown.behaviorScore * 10) / 10,
          popularityScore: Math.round(r.scoreBreakdown.popularityScore * 10) / 10,
          priceScore: Math.round(r.scoreBreakdown.priceScore * 10) / 10,
        },
        matchReasons: r.matchReasons,
      })),
      scoringWeights: {
        chat: Math.round(ew.chat * 100) / 100,
        behavior: Math.round(ew.behavior * 100) / 100,
        popularity: Math.round(ew.popularity * 100) / 100,
        price: Math.round(ew.price * 100) / 100,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    console.error('[ScoreWS] Error building payload:', err);
    return null;
  }
}
