/**
 * Recommendation Engine
 * 
 * Combines multiple signals to score and recommend products:
 * - Chat-based signals (keywords, intents)
 * - Behavior-based signals (views, cart, wishlist)
 * - Popularity signals (views, sales, ratings)
 */

import { ExtractedKeywords } from './keyword-extractor';

/**
 * User context from analytics
 */
export interface UserContext {
  userId?: string;
  // From chat history
  chatKeywords: string[];
  chatCategories: string[];
  chatBrands: string[];
  // From userAnalytics.actions
  viewedProductIds: string[];
  viewedCategories: string[];
  cartProductIds: string[];
  cartBrands: string[];
  wishlistProductIds: string[];
  // Price preferences
  priceRange?: { min?: number; max?: number };
  preferredColors: string[];
}

/**
 * Product data for scoring
 */
export interface ProductForScoring {
  id: string;
  title: string;
  category: string;
  subCategory?: string;
  brand?: string;
  tags: string[];
  colors: string[];
  price: number;
  rating: number;
  totalSales: number;
  // From productAnalytics
  views?: number;
  cartAdds?: number;
  purchases?: number;
}

/**
 * Scored product result
 */
export interface ScoredProduct {
  product: ProductForScoring;
  score: number;
  scoreBreakdown: {
    chatScore: number;
    behaviorScore: number;
    popularityScore: number;
  };
  matchReasons: string[];
}

/**
 * Scoring weights
 */
const WEIGHTS = {
  chat: 0.4,      // 40% - Keywords from current chat
  behavior: 0.4,  // 40% - User history (views, cart, wishlist)
  popularity: 0.2 // 20% - Product popularity metrics
};

/**
 * Score products based on user context
 */
export function scoreProducts(
  products: ProductForScoring[],
  context: UserContext,
  currentKeywords?: ExtractedKeywords
): ScoredProduct[] {
  const scored = products.map(product => scoreProduct(product, context, currentKeywords));
  
  // Sort by score descending
  return scored.sort((a, b) => b.score - a.score);
}

/**
 * Score a single product
 */
function scoreProduct(
  product: ProductForScoring,
  context: UserContext,
  currentKeywords?: ExtractedKeywords
): ScoredProduct {
  const matchReasons: string[] = [];
  
  // Calculate chat-based score (0-100)
  const chatScore = calculateChatScore(product, context, currentKeywords, matchReasons);
  
  // Calculate behavior-based score (0-100)
  const behaviorScore = calculateBehaviorScore(product, context, matchReasons);
  
  // Calculate popularity score (0-100)
  const popularityScore = calculatePopularityScore(product, matchReasons);
  
  // Weighted total
  const score = Math.round(
    chatScore * WEIGHTS.chat +
    behaviorScore * WEIGHTS.behavior +
    popularityScore * WEIGHTS.popularity
  );
  
  return {
    product,
    score,
    scoreBreakdown: {
      chatScore,
      behaviorScore,
      popularityScore,
    },
    matchReasons,
  };
}

/**
 * Calculate chat-based score
 */
function calculateChatScore(
  product: ProductForScoring,
  context: UserContext,
  currentKeywords?: ExtractedKeywords,
  matchReasons?: string[]
): number {
  let score = 0;
  
  // Current chat keywords match (highest priority)
  if (currentKeywords) {
    // Category match
    if (currentKeywords.categories.some(cat => 
      product.category.toLowerCase().includes(cat) ||
      product.tags.some(tag => tag.toLowerCase().includes(cat))
    )) {
      score += 30;
      matchReasons?.push('Matches your search category');
    }
    
    // Brand match
    if (currentKeywords.brands.some(brand => 
      product.brand?.toLowerCase() === brand.toLowerCase()
    )) {
      score += 25;
      matchReasons?.push(`Brand: ${product.brand}`);
    }
    
    // Color match
    if (currentKeywords.colors.some(color => 
      product.colors.some(c => c.toLowerCase() === color.toLowerCase())
    )) {
      score += 15;
      matchReasons?.push('Matches your color preference');
    }
    
    // Price range match
    if (currentKeywords.priceRange) {
      const { min, max } = currentKeywords.priceRange;
      const inRange = (!min || product.price >= min) && (!max || product.price <= max);
      if (inRange) {
        score += 20;
        matchReasons?.push('Within your budget');
      }
    }
    
    // Tag/keyword match
    const matchedTags = product.tags.filter(tag =>
      currentKeywords.rawKeywords.some(kw => tag.toLowerCase().includes(kw))
    );
    if (matchedTags.length > 0) {
      score += Math.min(matchedTags.length * 5, 10);
    }
  }
  
  // Historical chat context match
  if (context.chatCategories.some(cat => product.category.toLowerCase().includes(cat))) {
    score += 10;
  }
  if (context.chatBrands.some(brand => product.brand?.toLowerCase() === brand.toLowerCase())) {
    score += 10;
  }
  
  return Math.min(score, 100);
}

/**
 * Calculate behavior-based score
 */
function calculateBehaviorScore(
  product: ProductForScoring,
  context: UserContext,
  matchReasons?: string[]
): number {
  let score = 0;
  
  // Previously viewed similar category
  if (context.viewedCategories.some(cat => 
    product.category.toLowerCase().includes(cat.toLowerCase())
  )) {
    score += 25;
    matchReasons?.push('Similar to products you viewed');
  }
  
  // Same brand as items in cart
  if (context.cartBrands.some(brand => 
    product.brand?.toLowerCase() === brand.toLowerCase()
  )) {
    score += 30;
    matchReasons?.push('Same brand as items in your cart');
  }
  
  // Complements cart items (same category)
  if (context.cartProductIds.length > 0) {
    // Boost products from same category but different product
    score += 15;
  }
  
  // Not already in wishlist (slightly lower if already wishlisted)
  if (!context.wishlistProductIds.includes(product.id)) {
    score += 10;
  }
  
  // Color preference match
  if (context.preferredColors.some(color => 
    product.colors.some(c => c.toLowerCase() === color.toLowerCase())
  )) {
    score += 10;
    matchReasons?.push('Matches your color preference');
  }
  
  // Price range preference
  if (context.priceRange) {
    const { min, max } = context.priceRange;
    const inRange = (!min || product.price >= min) && (!max || product.price <= max);
    if (inRange) {
      score += 10;
    }
  }
  
  return Math.min(score, 100);
}

/**
 * Calculate popularity score
 */
function calculatePopularityScore(
  product: ProductForScoring,
  matchReasons?: string[]
): number {
  let score = 0;
  
  // Rating score (0-30)
  if (product.rating >= 4.5) {
    score += 30;
    matchReasons?.push('Highly rated');
  } else if (product.rating >= 4.0) {
    score += 20;
  } else if (product.rating >= 3.5) {
    score += 10;
  }
  
  // Sales score (0-30)
  if (product.totalSales >= 100) {
    score += 30;
    matchReasons?.push('Best seller');
  } else if (product.totalSales >= 50) {
    score += 20;
  } else if (product.totalSales >= 10) {
    score += 10;
  }
  
  // Views/engagement score (0-20)
  if (product.views && product.views >= 1000) {
    score += 20;
    matchReasons?.push('Popular');
  } else if (product.views && product.views >= 100) {
    score += 10;
  }
  
  // Cart conversion rate (0-20)
  if (product.views && product.cartAdds) {
    const conversionRate = product.cartAdds / product.views;
    if (conversionRate >= 0.1) {
      score += 20;
    } else if (conversionRate >= 0.05) {
      score += 10;
    }
  }
  
  return Math.min(score, 100);
}

/**
 * Get top recommendations
 */
export function getTopRecommendations(
  scoredProducts: ScoredProduct[],
  limit: number = 5,
  minScore: number = 30
): ScoredProduct[] {
  return scoredProducts
    .filter(sp => sp.score >= minScore)
    .slice(0, limit);
}

/**
 * Build context from userAnalytics actions
 */
export function buildUserContextFromActions(
  actions: Array<{ action: string; productId?: string; shopId?: string }>,
  productLookup: Map<string, { category: string; brand?: string; colors: string[]; price: number }>
): Partial<UserContext> {
  const viewedProductIds: string[] = [];
  const viewedCategories: string[] = [];
  const cartProductIds: string[] = [];
  const cartBrands: string[] = [];
  const wishlistProductIds: string[] = [];
  const preferredColors: string[] = [];
  const prices: number[] = [];

  for (const action of actions) {
    if (!action.productId) continue;
    
    const product = productLookup.get(action.productId);
    
    if (action.action === 'product_view') {
      viewedProductIds.push(action.productId);
      if (product) {
        viewedCategories.push(product.category);
        if (product.colors) preferredColors.push(...product.colors);
        prices.push(product.price);
      }
    }
    
    if (action.action === 'add_to_cart') {
      cartProductIds.push(action.productId);
      if (product?.brand) cartBrands.push(product.brand);
    }
    
    if (action.action === 'add_to_wishlist') {
      wishlistProductIds.push(action.productId);
    }
  }

  // Calculate average price range
  let priceRange: { min?: number; max?: number } | undefined;
  if (prices.length > 0) {
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    priceRange = {
      min: avgPrice * 0.5,
      max: avgPrice * 2,
    };
  }

  return {
    viewedProductIds: [...new Set(viewedProductIds)],
    viewedCategories: [...new Set(viewedCategories)],
    cartProductIds: [...new Set(cartProductIds)],
    cartBrands: [...new Set(cartBrands)],
    wishlistProductIds: [...new Set(wishlistProductIds)],
    preferredColors: [...new Set(preferredColors)],
    priceRange,
  };
}
