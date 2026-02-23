/**
 * User Context Loader
 * 
 * Loads user behavior data from MongoDB (userAnalytics) for recommendation scoring.
 * Only fetches RECENT actions — not the full history.
 * 
 * For logged-in users: loads from userAnalytics.actions
 * For anonymous users: returns empty context (session-only, handled by chat-service)
 */

import prisma from '@packages/libs/prisma';
import { UserContext } from '../core/recommendation-engine';

/** Maximum number of recent actions to use for context building */
const MAX_RECENT_ACTIONS = 50;

/** Action types we care about for recommendations */
type ActionType = 'product_view' | 'add_to_cart' | 'add_to_wishlist' | 'purchase';

interface UserAction {
  action: ActionType;
  productId?: string;
  shopId?: string;
  timestamp: Date | string;
}

/**
 * Load user context from MongoDB userAnalytics.
 * Returns null if user not found or no analytics exist.
 */
export async function loadUserContext(userId: string): Promise<UserContext | null> {
  try {
    const analytics = await prisma.userAnalytics.findUnique({
      where: { userId },
      select: { actions: true },
    });

    if (!analytics || !analytics.actions) {
      return createEmptyContext(userId);
    }

    let actions = analytics.actions as unknown as UserAction[];
    if (!Array.isArray(actions)) return createEmptyContext(userId);

    // Only use the most recent actions
    actions = actions.slice(-MAX_RECENT_ACTIONS);

    // Get unique product IDs from recent actions
    const productIds = [
      ...new Set(
        actions
          .filter((a) => a.productId)
          .map((a) => a.productId as string)
      ),
    ];

    // Fetch product details for context enrichment (category, brand, colors, price)
    const productLookup = await buildProductLookup(productIds);

    // Build context from actions
    return buildContextFromActions(userId, actions, productLookup);
  } catch (error) {
    console.error('[UserContextLoader] Error loading context for user:', userId, error);
    return createEmptyContext(userId);
  }
}

/**
 * Build a lookup map of product details for context enrichment.
 * Only fetches fields needed for scoring — lightweight query.
 */
async function buildProductLookup(
  productIds: string[]
): Promise<Map<string, { category: string; brand?: string; colors: string[]; price: number }>> {
  const lookup = new Map<string, { category: string; brand?: string; colors: string[]; price: number }>();

  if (productIds.length === 0) return lookup;

  try {
    const products = await prisma.products.findMany({
      where: {
        id: { in: productIds },
        isDeleted: { not: true },
      },
      select: {
        id: true,
        category: true,
        brand: true,
        colors: true,
        price: true,
        sale_price: true,
      },
    });

    for (const p of products) {
      lookup.set(p.id, {
        category: p.category,
        brand: p.brand || undefined,
        colors: p.colors || [],
        price: p.price || p.sale_price || 0,
      });
    }
  } catch (error) {
    console.error('[UserContextLoader] Error fetching product lookup:', error);
  }

  return lookup;
}

/**
 * Build UserContext from raw actions + product lookup.
 * Extracts:
 * - Recently viewed categories & products
 * - Cart items & their brands
 * - Wishlist items
 * - Preferred colors (from viewed & carted items)
 * - Inferred price range (from viewed items' prices)
 */
function buildContextFromActions(
  userId: string,
  actions: UserAction[],
  productLookup: Map<string, { category: string; brand?: string; colors: string[]; price: number }>
): UserContext {
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

    switch (action.action) {
      case 'product_view':
        viewedProductIds.push(action.productId);
        if (product) {
          viewedCategories.push(product.category);
          if (product.colors.length > 0) preferredColors.push(...product.colors);
          if (product.price > 0) prices.push(product.price);
        }
        break;

      case 'add_to_cart':
        cartProductIds.push(action.productId);
        if (product?.brand) cartBrands.push(product.brand);
        break;

      case 'add_to_wishlist':
        wishlistProductIds.push(action.productId);
        break;

      case 'purchase':
        // Purchases validate interest — boost category & brand
        if (product) {
          viewedCategories.push(product.category);
          if (product.brand) cartBrands.push(product.brand);
        }
        break;
    }
  }

  // Calculate inferred price range (±50% of median price)
  let priceRange: { min?: number; max?: number } | undefined;
  if (prices.length > 0) {
    prices.sort((a, b) => a - b);
    const median = prices[Math.floor(prices.length / 2)];
    priceRange = {
      min: Math.round(median * 0.5),
      max: Math.round(median * 2),
    };
  }

  return {
    userId,
    chatKeywords: [],
    chatCategories: [],
    chatBrands: [],
    viewedProductIds: [...new Set(viewedProductIds)],
    viewedCategories: [...new Set(viewedCategories)],
    cartProductIds: [...new Set(cartProductIds)],
    cartBrands: [...new Set(cartBrands)],
    wishlistProductIds: [...new Set(wishlistProductIds)],
    preferredColors: [...new Set(preferredColors)],
    priceRange,
  };
}

/**
 * Create empty context for a user with no analytics data.
 */
function createEmptyContext(userId?: string): UserContext {
  return {
    userId,
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
}

/**
 * Create anonymous session context.
 * Used for non-logged-in users — only contains chat-derived signals.
 */
export function createAnonymousContext(): UserContext {
  return createEmptyContext();
}
