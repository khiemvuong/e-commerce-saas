/**
 * Recommendation Engine — Unified Hybrid Scoring
 * 
 * Score(P) = α·S_chat(P) + β·S_behavior(P) + γ·S_popularity(P) + δ·S_price(P)
 * 
 * Where:
 *   α = 0.35 — Chat relevance (keywords, categories, brands from current chat)
 *   β = 0.30 — Behavior relevance (user's recent views, cart, wishlist, purchases)
 *   γ = 0.20 — Popularity (views, sales, rating, conversion rate)
 *   δ = 0.15 — Price match (user's price preferences from behavior + chat)
 * 
 * Each sub-score is normalized to [0, 100].
 */

import { ExtractedKeywords } from './keyword-extractor';

/**
 * User context built from userAnalytics + chat session
 */
export interface UserContext {
  userId?: string;
  // From chat history (session)
  chatKeywords: string[];
  chatCategories: string[];
  chatBrands: string[];
  // From userAnalytics.actions (DB)
  viewedProductIds: string[];
  viewedCategories: string[];
  cartProductIds: string[];
  cartBrands: string[];
  wishlistProductIds: string[];
  // Price preferences (inferred from behavior)
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
  image?: string;
  slug?: string;
  rating: number;
  totalSales: number;
  // From productAnalytics
  views?: number;
  cartAdds?: number;
  purchases?: number;
}

/**
 * Scored product result with full breakdown
 */
export interface ScoredProduct {
  product: ProductForScoring;
  score: number;
  scoreBreakdown: {
    chatScore: number;
    behaviorScore: number;
    popularityScore: number;
    priceScore: number;
  };
  matchReasons: string[];
}

/**
 * Scoring weights — the α, β, γ, δ coefficients
 */
const WEIGHTS = {
  alpha: 0.35,  // S_chat — chat relevance
  beta: 0.30,   // S_behavior — user history
  gamma: 0.20,  // S_popularity — product metrics
  delta: 0.15,  // S_price — price compatibility
};

/**
 * Score all products and sort by score descending.
 */
export function scoreProducts(
  products: ProductForScoring[],
  context: UserContext,
  currentKeywords?: ExtractedKeywords
): ScoredProduct[] {
  const scored = products.map(product => scoreProduct(product, context, currentKeywords));
  return scored.sort((a, b) => b.score - a.score);
}

/**
 * Score a single product using the Unified Hybrid Scoring formula.
 */
function scoreProduct(
  product: ProductForScoring,
  context: UserContext,
  currentKeywords?: ExtractedKeywords
): ScoredProduct {
  const matchReasons: string[] = [];
  
  // ========== S_chat (0–100) ==========
  const chatScore = calculateChatScore(product, context, currentKeywords, matchReasons);
  
  // ========== S_behavior (0–100) ==========
  const behaviorScore = calculateBehaviorScore(product, context, matchReasons);
  
  // ========== S_popularity (0–100) ==========
  const popularityScore = calculatePopularityScore(product, matchReasons);
  
  // ========== S_price (0–100) ==========
  const priceScore = calculatePriceScore(product, context, currentKeywords, matchReasons);
  
  // ========== Final Score ==========
  let score = Math.round(
    chatScore * WEIGHTS.alpha +
    behaviorScore * WEIGHTS.beta +
    popularityScore * WEIGHTS.gamma +
    priceScore * WEIGHTS.delta
  );
  
  // ========== Exact Title Match Boost ==========
  // Prevents popular items (like a best-selling jacket) from outranking an exact match (like "White Running Shoes")
  if (currentKeywords && currentKeywords.rawKeywords.length > 0) {
    const titleLower = product.title.toLowerCase();
    const titleMatches = currentKeywords.rawKeywords.filter(kw => 
      titleLower.includes(kw.toLowerCase())
    );
    
    if (titleMatches.length > 0) {
      const matchRatio = titleMatches.length / currentKeywords.rawKeywords.length;
      // If at least 50% of the search keywords are in the title, boost it heavily
      if (matchRatio >= 0.5) {
        score += Math.round(matchRatio * 500); // Massive boost guarantees top placement
        if (!matchReasons.includes('Exact search match')) {
          matchReasons.unshift('Exact search match'); // Put it at the top of reasons
        }
      }
    }
  }
  
  return {
    product,
    score,
    scoreBreakdown: {
      chatScore,
      behaviorScore,
      popularityScore,
      priceScore,
    },
    matchReasons,
  };
}

// =====================================================================
// S_chat — Chat Relevance Score (0–100)
// Measures how well the product matches the current chat keywords
// =====================================================================
function calculateChatScore(
  product: ProductForScoring,
  context: UserContext,
  currentKeywords?: ExtractedKeywords,
  matchReasons?: string[]
): number {
  let score = 0;
  const titleLower = product.title.toLowerCase();
  const categoryLower = product.category.toLowerCase();
  const brandLower = product.brand?.toLowerCase() || '';
  
  if (currentKeywords) {
    // Category match (0-30)
    if (currentKeywords.categories.some(cat => 
      categoryLower.includes(cat) ||
      product.tags.some(tag => tag.toLowerCase().includes(cat))
    )) {
      score += 30;
      matchReasons?.push('Matches your search category');
    }
    
    // Brand match (0-25)
    if (currentKeywords.brands.some(brand => 
      brandLower === brand.toLowerCase()
    )) {
      score += 25;
      matchReasons?.push(`Brand: ${product.brand}`);
    }
    
    // Color match (0-10)
    if (currentKeywords.colors.some(color => 
      product.colors.some(c => c.toLowerCase() === color.toLowerCase())
    )) {
      score += 10;
      matchReasons?.push('Color match');
    }
    
    // Raw keyword match in title (0-40)
    const titleMatches = currentKeywords.rawKeywords.filter(kw => 
      titleLower.includes(kw.toLowerCase())
    );
    if (titleMatches.length > 0) {
      score += Math.min(titleMatches.length * 15, 40);
      matchReasons?.push('Title match');
    }
    
    // Tag/keyword match (0-15)
    const tagMatches = product.tags.filter(tag =>
      currentKeywords.rawKeywords.some(kw => tag.toLowerCase().includes(kw.toLowerCase()))
    );
    if (tagMatches.length > 0) {
      score += Math.min(tagMatches.length * 5, 15);
    }
  }
  
  // Historical chat context (accumulated from conversation)
  if (context.chatCategories.some(cat => categoryLower.includes(cat.toLowerCase()))) {
    score += 8;
  }
  if (context.chatBrands.some(brand => brandLower === brand.toLowerCase())) {
    score += 8;
  }
  if (context.chatKeywords.some(kw => titleLower.includes(kw.toLowerCase()))) {
    score += 4;
  }
  
  return Math.min(score, 100);
}

// =====================================================================
// S_behavior — User Behavior Score (0–100)
// Measures relevance based on user's recent interaction history
// =====================================================================
function calculateBehaviorScore(
  product: ProductForScoring,
  context: UserContext,
  matchReasons?: string[]
): number {
  let score = 0;
  
  // User has no behavior data → neutral score
  if (
    context.viewedCategories.length === 0 &&
    context.cartProductIds.length === 0 &&
    context.wishlistProductIds.length === 0
  ) {
    return 50; // Neutral — don't penalize anonymous/new users
  }
  
  const categoryLower = product.category.toLowerCase();
  const brandLower = product.brand?.toLowerCase() || '';
  
  // Previously viewed same category (0-25)
  if (context.viewedCategories.some(cat => categoryLower.includes(cat.toLowerCase()))) {
    score += 25;
    matchReasons?.push('Similar to products you viewed');
  }
  
  // Same brand as items in cart (0-20)
  if (context.cartBrands.some(brand => brandLower === brand.toLowerCase())) {
    score += 20;
    matchReasons?.push('Same brand as items in your cart');
  }
  
  // Has items in cart → slight boost for complementary products (0-10)
  if (context.cartProductIds.length > 0 && !context.cartProductIds.includes(product.id)) {
    score += 10;
  }
  
  // Already in cart → lower priority (user already has it)
  if (context.cartProductIds.includes(product.id)) {
    score -= 15;
  }
  
  // Already wishlisted → slight boost (user expressed moderate interest)
  if (context.wishlistProductIds.includes(product.id)) {
    score += 10;
    matchReasons?.push('In your wishlist');
  }
  
  // Color preference match (0-10)
  if (context.preferredColors.some(color => 
    product.colors.some(c => c.toLowerCase() === color.toLowerCase())
  )) {
    score += 10;
    matchReasons?.push('Matches your color preference');
  }
  
  // Already viewed this exact product → lower priority (avoid repetition)
  if (context.viewedProductIds.includes(product.id)) {
    score -= 10;
  }
  
  return Math.max(0, Math.min(score, 100));
}

// =====================================================================
// S_popularity — Product Popularity Score (0–100)
// Data-driven score based on product metrics
// =====================================================================
function calculatePopularityScore(
  product: ProductForScoring,
  matchReasons?: string[]
): number {
  let score = 0;
  
  // Rating score (0-30) — logarithmic scaling
  if (product.rating >= 4.5) {
    score += 30;
    matchReasons?.push('Highly rated');
  } else if (product.rating >= 4.0) {
    score += 22;
  } else if (product.rating >= 3.5) {
    score += 15;
  } else if (product.rating >= 3.0) {
    score += 8;
  }
  
  // Sales score (0-25) — logarithmic scaling  
  const salesLog = product.totalSales > 0 ? Math.log10(product.totalSales + 1) : 0;
  const salesScore = Math.min(salesLog * 10, 25);
  score += Math.round(salesScore);
  if (product.totalSales >= 100) {
    matchReasons?.push('Best seller');
  }
  
  // View-based score (0-20)
  if (product.views) {
    const viewsLog = Math.log10(product.views + 1);
    score += Math.min(Math.round(viewsLog * 5), 20);
    if (product.views >= 500) matchReasons?.push('Popular');
  }
  
  // Conversion rate bonus (0-25)
  // cartAdds/views ratio — high conversion = high quality product
  if (product.views && product.views > 10 && product.cartAdds) {
    const conversionRate = product.cartAdds / product.views;
    if (conversionRate >= 0.15) {
      score += 25;
    } else if (conversionRate >= 0.08) {
      score += 15;
    } else if (conversionRate >= 0.03) {
      score += 8;
    }
  }
  
  return Math.min(score, 100);
}

// =====================================================================
// S_price — Price Compatibility Score (0–100)
// How well the product's price matches user's budget signals
// =====================================================================
function calculatePriceScore(
  product: ProductForScoring,
  context: UserContext,
  currentKeywords?: ExtractedKeywords,
  matchReasons?: string[]
): number {
  // No price preferences → neutral score
  const chatPriceRange = currentKeywords?.priceRange;
  const behaviorPriceRange = context.priceRange;
  const priceModifier = currentKeywords?.priceModifier;
  
  if (!chatPriceRange && !behaviorPriceRange && !priceModifier) {
    return 50; // Neutral — no price signal
  }
  
  let score = 0;
  
  // 1. Explicit price range from chat (highest priority)
  if (chatPriceRange) {
    const { min, max } = chatPriceRange;
    const inRange = (!min || product.price >= min) && (!max || product.price <= max);
    if (inRange) {
      score += 60;
      matchReasons?.push('Within your budget');
      
      // Bonus for being in the sweet spot (middle of range)
      if (min && max) {
        const mid = (min + max) / 2;
        const distFromMid = Math.abs(product.price - mid) / (max - min);
        score += Math.round((1 - distFromMid) * 20);
      }
    } else {
      score += 10; // Out of range — low score but not zero
    }
  }
  
  // 2. Price modifier from chat (e.g., "cheap", "premium")
  if (priceModifier) {
    const avgPrice = getAverageProductPrice();
    switch (priceModifier) {
      case 'cheap':
        score += product.price < avgPrice * 0.6 ? 40 : 10;
        if (product.price < avgPrice * 0.6) matchReasons?.push('Budget-friendly');
        break;
      case 'mid':
        score += (product.price >= avgPrice * 0.4 && product.price <= avgPrice * 1.5) ? 40 : 10;
        break;
      case 'expensive':
        score += product.price > avgPrice * 1.5 ? 40 : 10;
        if (product.price > avgPrice * 1.5) matchReasons?.push('Premium');
        break;
    }
  }
  
  // 3. Inferred price range from behavior (lower priority)
  if (behaviorPriceRange && !chatPriceRange) {
    const { min, max } = behaviorPriceRange;
    const inRange = (!min || product.price >= min) && (!max || product.price <= max);
    if (inRange) {
      score += 30;
    } else {
      score += 15;
    }
  }
  
  return Math.min(score, 100);
}

/**
 * Get a rough average product price for modifier calculations.
 * This is a simple heuristic — in production, compute from actual data.
 */
function getAverageProductPrice(): number {
  return 150; // $150 as a reasonable baseline for e-commerce
}

// =====================================================================
// Utility functions
// =====================================================================

/**
 * Get top recommendations filtered by minimum score.
 */
export function getTopRecommendations(
  scoredProducts: ScoredProduct[],
  limit: number = 5,
  minScore: number = 15
): ScoredProduct[] {
  return scoredProducts
    .filter(sp => sp.score >= minScore)
    .slice(0, limit);
}

/**
 * Build context from userAnalytics actions (legacy compatibility).
 * Prefer using data/user-context-loader.ts for DB-backed loading.
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
