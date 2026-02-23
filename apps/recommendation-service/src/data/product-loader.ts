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

/**
 * Load products for scoring — the main entry point.
 * 
 * @param options.keyword - search keyword from chat
 * @param options.categories - categories to filter by (from user context)
 * @param options.brands - brands to filter by (from user context)
 * @param options.limit - max products to return
 */
export async function loadProducts(options: {
  keyword?: string;
  categories?: string[];
  brands?: string[];
  limit?: number;
}): Promise<ProductForScoring[]> {
  const { keyword, categories, brands, limit = 30 } = options;

  // Build cache key
  const cacheKey = JSON.stringify({ keyword, categories, brands, limit });
  const cached = productCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.products;
  }

  try {
    let products: ProductForScoring[];

    if (keyword) {
      // Pass categories & brands alongside keyword for combined search
      products = await searchByKeyword(keyword, categories, brands, limit);
    } else if (categories && categories.length > 0) {
      products = await loadByCategories(categories, brands, limit);
    } else {
      products = await loadPopularProducts(limit);
    }

    console.log(`[ProductLoader] Found ${products.length} products (keyword=${keyword}, categories=${categories?.join(',')}, brands=${brands?.join(',')})`);

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
 * Search products by keyword using regex matching on title, category, brand, tags.
 */
async function searchByKeyword(
  keyword: string,
  categories?: string[],
  brands?: string[],
  limit: number = 30
): Promise<ProductForScoring[]> {
  // Split multi-word keywords for broader matching
  const keywordTerms = keyword.toLowerCase().split(/\s+/).filter(w => w.length > 2);

  // Build OR conditions for keyword matching
  const keywordConditions: any[] = [
    { title: { contains: keyword, mode: 'insensitive' } },
    { category: { contains: keyword, mode: 'insensitive' } },
    { subCategory: { contains: keyword, mode: 'insensitive' } },
    { sub_category: { contains: keyword, mode: 'insensitive' } },
    { brand: { contains: keyword, mode: 'insensitive' } },
    { tags: { hasSome: keywordTerms } },
  ];

  // Also try each individual word in title (e.g. "Nike shoes" → title contains "Nike" OR title contains "shoes")
  for (const term of keywordTerms) {
    if (term !== keyword.toLowerCase()) {
      keywordConditions.push({ title: { contains: term, mode: 'insensitive' } });
      keywordConditions.push({ subCategory: { contains: term, mode: 'insensitive' } });
    }
  }

  // If categories were extracted, also include category matches
  if (categories && categories.length > 0) {
    for (const cat of categories) {
      keywordConditions.push({ category: { equals: cat, mode: 'insensitive' } });
    }
  }

  // If brands were extracted, also include brand matches
  if (brands && brands.length > 0) {
    for (const brand of brands) {
      keywordConditions.push({ brand: { equals: brand, mode: 'insensitive' } });
    }
  }

  const products = await prisma.products.findMany({
    where: {
      isDeleted: { not: true },
      isPublic: { not: false },
      OR: keywordConditions,
    },
    include: {
      analytics: true,
      images: true,
    },
    take: limit,
    orderBy: { totalSales: 'desc' },
  });

  return products.map(mapToProductForScoring);
}

/**
 * Load products by categories (and optionally brands).
 * Used for personalized recommendations based on user behavior.
 */
async function loadByCategories(
  categories: string[],
  brands?: string[],
  limit: number = 30
): Promise<ProductForScoring[]> {
  const where: any = {
    isDeleted: { not: true },
    isPublic: { not: false },
    OR: categories.map((cat) => ({
      category: { contains: cat, mode: 'insensitive' as const },
    })),
  };

  // Also include brand matches if available
  if (brands && brands.length > 0) {
    where.OR.push(
      ...brands.map((brand) => ({
        brand: { equals: brand, mode: 'insensitive' as const },
      }))
    );
  }

  const products = await prisma.products.findMany({
    where,
    include: {
      analytics: true,
      images: true,
    },
    take: limit,
    orderBy: { totalSales: 'desc' },
  });

  return products.map(mapToProductForScoring);
}

/**
 * Load popular products (general browse, no filters).
 * Uses a mix of total sales and recent views.
 */
async function loadPopularProducts(limit: number): Promise<ProductForScoring[]> {
  const products = await prisma.products.findMany({
    where: {
      isDeleted: { not: true },
      isPublic: { not: false },
    },
    include: {
      analytics: true,
      images: true,
    },
    take: limit,
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
  };
}

/**
 * Clear product cache (for testing)
 */
export function clearProductLoaderCache(): void {
  productCache.clear();
}

