/**
 * Product Loader
 * 
 * Loads products from MongoDB (products + productAnalytics) for recommendation scoring.
 * Replaces the demo catalog fallback with real DB data.
 * 
 * Strategies:
 * 1. Search by keyword → use MongoDB text/regex search
 * 2. General browse → top products by popularity metrics
 * 3. Category browse → filtered by category
 * 4. Personalized → based on user's viewed categories & brands
 */

import prisma from '@packages/libs/prisma';
import { ProductForScoring } from '../core/recommendation-engine';
import { PRICE_MODIFIERS } from '../config/keywords.config';

/** Cache TTL for general product queries */
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes
/** Max cache entries to prevent unbounded memory growth */
const MAX_CACHE_SIZE = 200;

/** Product cache */
interface CacheEntry {
  products: ProductForScoring[];
  timestamp: number;
}
const productCache = new Map<string, CacheEntry>();

/** Shared price-modifier terms from keyword config (single source of truth). */
const PRICE_MODIFIER_TERMS = new Set(Object.keys(PRICE_MODIFIERS));

/**
 * Evict expired + overflow entries from cache.
 */
function evictCache(): void {
  const now = Date.now();
  // Remove expired entries
  for (const [key, entry] of productCache) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      productCache.delete(key);
    }
  }
  // If still over max, evict oldest
  if (productCache.size > MAX_CACHE_SIZE) {
    const entries = [...productCache.entries()]
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = productCache.size - MAX_CACHE_SIZE;
    for (let i = 0; i < toRemove; i++) {
      productCache.delete(entries[i][0]);
    }
  }
}

// Periodic cache cleanup every 5 minutes
setInterval(evictCache, 5 * 60 * 1000);

/** Short-term cache for recent sales counts (1 minute TTL) */
const recentSalesCache = new Map<string, { counts: Map<string, number>; timestamp: number }>();
const RECENT_SALES_CACHE_TTL = 60 * 1000; // 1 minute

/**
 * Fetch sales counts for the last `days` days from orderItems.
 * Groups by productId where parent order.createdAt >= now - days.
 * No DB schema change needed — uses existing orderItems → orders relation.
 */
async function getRecentSalesCounts(productIds: string[], days = 30): Promise<Map<string, number>> {
  if (productIds.length === 0) return new Map();

  const cacheKey = `${days}d`;
  const cached = recentSalesCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < RECENT_SALES_CACHE_TTL) {
    return cached.counts;
  }

  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const grouped = await (prisma as any).orderItems.groupBy({
      by: ['productId'],
      where: {
        productId: { in: productIds },
        order: { createdAt: { gte: since } },
      },
      _sum: { quantity: true },
    });

    const counts = new Map<string, number>();
    for (const row of grouped) {
      counts.set(row.productId, row._sum.quantity || 0);
    }

    recentSalesCache.set(cacheKey, { counts, timestamp: Date.now() });
    return counts;
  } catch (err) {
    // Silently degrade — scoring will fall back to totalSales
    console.warn('[ProductLoader] Recent sales query failed, using totalSales fallback:', (err as Error).message);
    return new Map();
  }
}

/**
 * Enrich a list of products with their recent sales counts (last 30 days).
 * Sets product.recentSalesCount for use in the popularity scoring formula.
 */
async function enrichWithRecentSales(products: ProductForScoring[]): Promise<ProductForScoring[]> {
  if (products.length === 0) return products;
  const counts = await getRecentSalesCounts(products.map(p => p.id));
  return products.map(p => ({
    ...p,
    recentSalesCount: counts.get(p.id) ?? 0,
  }));
}


/**
 * Load products for scoring — the main entry point.
 * 
 * @param options.keyword - search keyword from chat
 * @param options.categories - categories to filter by
 * @param options.brands - brands to filter by
 * @param options.colors - colors to filter by
 * @param options.limit - max products to return
 * @param options.skip - offset for pagination (skip N products)
 */
export async function loadProducts(options: {
  keyword?: string;
  categories?: string[];
  brands?: string[];
  colors?: string[];
  limit?: number;
  skip?: number;
}): Promise<ProductForScoring[]> {
  const { keyword, categories, brands, colors, limit = 30, skip = 0 } = options;

  // Build cache key
  const cacheKey = JSON.stringify({ keyword, categories, brands, colors, limit, skip });
  const cached = productCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.products;
  }

  try {
    let products: ProductForScoring[];

    if (keyword) {
      products = await searchByKeyword(keyword, categories, brands, colors, limit, skip);
    } else if (categories && categories.length > 0) {
      products = await loadByCategories(categories, brands, colors, limit, skip);
    } else {
      products = await loadPopularProducts(limit, skip);
    }

    // Enrich with recent sales counts (last 30 days) for trending-aware scoring
    products = await enrichWithRecentSales(products);

    console.log(`[ProductLoader] Found ${products.length} products (keyword=${keyword}, categories=${categories?.join(',')}, brands=${brands?.join(',')}, colors=${colors?.join(',')}, skip=${skip})`);

    // Cache result (with eviction if over max)
    productCache.set(cacheKey, { products, timestamp: Date.now() });
    if (productCache.size > MAX_CACHE_SIZE) {
      evictCache();
    }

    return products;
  } catch (error) {
    console.error('[ProductLoader] Error loading products:', error);
    return [];
  }
}

/**
 * Search products by keyword with progressive fallback:
 * 1. keyword + brand + category (narrowest)
 * 2. keyword + brand only
 * 3. keyword + category only
 * 4. keyword only (broadest fallback)
 */
async function searchByKeyword(
  keyword: string,
  categories?: string[],
  brands?: string[],
  colors?: string[],
  limit: number = 30,
  skip: number = 0,
): Promise<ProductForScoring[]> {
  // Normalize terms to avoid noisy broad matches.
  // Example: "budget laptops" -> ["laptop"] (drops price modifiers, singularizes plurals)
  const keywordTerms = keyword
    .toLowerCase()
    .split(/\s+/)
    .map(w => w.replace(/[^a-z0-9-]/gi, ''))
    .filter(w => w.length > 2 && !PRICE_MODIFIER_TERMS.has(w))
    .map(w => (w.endsWith('s') && w.length > 3 && !w.endsWith('ss') ? w.slice(0, -1) : w));

  const keywordConditions: any[] = [
    { title: { contains: keyword, mode: 'insensitive' } },
    { category: { contains: keyword, mode: 'insensitive' } },
    { subCategory: { contains: keyword, mode: 'insensitive' } },
    { sub_category: { contains: keyword, mode: 'insensitive' } },
    { brand: { contains: keyword, mode: 'insensitive' } },
    { tags: { hasSome: keywordTerms.length > 0 ? keywordTerms : [keyword.toLowerCase()] } },
  ];

  for (const term of keywordTerms) {
    if (term !== keyword.toLowerCase()) {
      keywordConditions.push({ title: { contains: term, mode: 'insensitive' } });
      keywordConditions.push({ subCategory: { contains: term, mode: 'insensitive' } });
    }
  }

  const baseWhere: any = {
    isDeleted: { not: true },
    isPublic: { not: false },
  };

  // Color AND filter
  if (colors && colors.length > 0) {
    baseWhere.colors = { hasSome: colors.map(c => c.toLowerCase()) };
  }

  const categoryFilter = categories && categories.length > 0
    ? { OR: categories.flatMap(cat => [
        { category: { contains: cat, mode: 'insensitive' as const } },
        { subCategory: { contains: cat, mode: 'insensitive' as const } },
      ])}
    : null;

  const brandFilter = brands && brands.length > 0
    ? { brand: { in: brands, mode: 'insensitive' as const } }
    : null;

  // Progressive search strategies (narrowest → broadest)
  const strategies: any[] = [];

  if (brandFilter && categoryFilter) {
    strategies.push({ ...baseWhere, ...brandFilter, AND: [{ OR: keywordConditions }, categoryFilter] });
  }
  if (brandFilter) {
    strategies.push({ ...baseWhere, ...brandFilter, OR: keywordConditions });
  }
  if (categoryFilter) {
    strategies.push({ ...baseWhere, AND: [{ OR: keywordConditions }, categoryFilter] });
  }
  strategies.push({ ...baseWhere, OR: keywordConditions });

  for (const where of strategies) {
    const products = await prisma.products.findMany({
      where,
      include: { analytics: true, images: true },
      take: limit,
      skip,
      orderBy: { totalSales: 'desc' },
    });

    if (products.length > 0) {
      return products.map(mapToProductForScoring);
    }
  }

  return [];
}

/**
 * Load products by categories (and optionally brands/colors).
 */
async function loadByCategories(
  categories: string[],
  brands?: string[],
  colors?: string[],
  limit: number = 30,
  skip: number = 0,
): Promise<ProductForScoring[]> {
  const where: any = {
    isDeleted: { not: true },
    isPublic: { not: false },
    OR: categories.flatMap((cat) => [
      { category: { contains: cat, mode: 'insensitive' as const } },
      { subCategory: { contains: cat, mode: 'insensitive' as const } },
    ]),
  };

  if (brands && brands.length > 0) {
    where.brand = { in: brands, mode: 'insensitive' as const };
  }

  if (colors && colors.length > 0) {
    where.colors = { hasSome: colors.map(c => c.toLowerCase()) };
  }

  const products = await prisma.products.findMany({
    where,
    include: { analytics: true, images: true },
    take: limit,
    skip,
    orderBy: { totalSales: 'desc' },
  });

  return products.map(mapToProductForScoring);
}

/**
 * Load popular products (general browse, no filters).
 */
async function loadPopularProducts(limit: number, skip: number = 0): Promise<ProductForScoring[]> {
  const products = await prisma.products.findMany({
    where: {
      isDeleted: { not: true },
      isPublic: { not: false },
    },
    include: { analytics: true, images: true },
    take: limit,
    skip,
    orderBy: [
      { totalSales: 'desc' },
      { rating: 'desc' },
    ],
  });

  return products.map(mapToProductForScoring);
}

/**
 * Load a specific set of products by IDs.
 * Used when we need to score products the user has interacted with.
 */
export async function loadProductsByIds(productIds: string[]): Promise<ProductForScoring[]> {
  if (productIds.length === 0) return [];

  try {
    const products = await prisma.products.findMany({
      where: {
        id: { in: productIds },
        isDeleted: { not: true },
      },
      include: {
        analytics: true,
      },
    });

    return products.map(mapToProductForScoring);
  } catch (error) {
    console.error('[ProductLoader] Error loading products by IDs:', error);
    return [];
  }
}

/**
 * Map Prisma product + analytics to ProductForScoring interface.
 */
function mapToProductForScoring(product: any): ProductForScoring {
  return {
    id: product.id,
    title: product.title,
    category: product.category || '',
    subCategory: product.subCategory || product.sub_category || '',
    brand: product.brand || '',
    tags: product.tags || [],
    colors: product.colors || [],
    price: product.price || product.sale_price || 0,
    image: product.images?.[0]?.file_url || '',
    slug: product.slug || '',
    rating: product.rating || 0,
    totalSales: product.totalSales || 0,
    // From productAnalytics
    views: product.analytics?.views || 0,
    cartAdds: product.analytics?.cartAdds || 0,
    purchases: product.analytics?.purchases || 0,
    // Structured technical specs
    customSpecs: product.custom_specifications || undefined,
  };
}

/**
 * Clear product cache (for testing)
 */
export function clearProductLoaderCache(): void {
  productCache.clear();
}

