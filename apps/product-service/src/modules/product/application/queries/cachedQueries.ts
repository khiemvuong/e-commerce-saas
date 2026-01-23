/**
 * Cached Product Queries
 * 
 * Wraps product queries with Redis caching for improved performance.
 * All TTLs and cache keys are centralized in cache-manager package.
 */

import {
    CACHE_TTL,
    CACHE_PREFIX,
    generateCacheKey,
    getOrSetCache,
    invalidateCache,
} from '@packages/libs/cache-manager';

import { getAllProducts, GetAllProductsInput, GetAllProductsOutput } from './getAllProducts';
import { getFilteredProducts, GetFilteredProductsInput, GetFilteredProductsOutput } from './getFilteredProducts';
import { searchProducts, SearchProductsInput, SearchProductsOutput } from './searchProducts';
import { getProductDetails, GetProductDetailsInput } from './getProductDetails';
import { getBestSellers, GetBestSellersInput } from './getBestSellers';
import { getFeaturedProducts, GetFeaturedProductsInput } from './getFeaturedProducts';
import { getDealsOfTheDay, GetDealsOfTheDayInput } from './getDealsOfTheDay';

// Cache info type for responses
interface CacheInfo {
    fromCache: boolean;
    responseTime: number;
}

/**
 * Cached version of getAllProducts
 * TTL: 10 minutes
 */
export const getAllProductsCached = async (
    input: GetAllProductsInput = {}
): Promise<GetAllProductsOutput & { _cacheInfo: CacheInfo }> => {
    const cacheKey = generateCacheKey(`${CACHE_PREFIX.PRODUCTS}:all`, {
        page: input.page || 1,
        limit: input.limit || 20,
        type: input.type || 'topSales',
    });

    const result = await getOrSetCache(
        cacheKey,
        () => getAllProducts(input),
        CACHE_TTL.PRODUCTS_LIST
    );

    return {
        ...result.data,
        _cacheInfo: {
            fromCache: result.fromCache,
            responseTime: result.responseTime,
        },
    };
};

/**
 * Cached version of getFilteredProducts
 * TTL: 10 minutes
 */
export const getFilteredProductsCached = async (
    input: GetFilteredProductsInput = {}
): Promise<GetFilteredProductsOutput & { _cacheInfo: CacheInfo }> => {
    const cacheKey = generateCacheKey(`${CACHE_PREFIX.PRODUCTS}:filtered`, {
        search: input.search,
        priceRange: input.priceRange,
        categories: input.categories,
        colors: input.colors,
        sizes: input.sizes,
        page: input.page || 1,
        limit: input.limit || 12,
    });

    const result = await getOrSetCache(
        cacheKey,
        () => getFilteredProducts(input),
        CACHE_TTL.PRODUCTS_LIST
    );

    return {
        ...result.data,
        _cacheInfo: {
            fromCache: result.fromCache,
            responseTime: result.responseTime,
        },
    };
};

/**
 * Cached version of searchProducts
 * TTL: 3 minutes (shorter for search results)
 */
export const searchProductsCached = async (
    input: SearchProductsInput
): Promise<SearchProductsOutput & { _cacheInfo: CacheInfo }> => {
    const cacheKey = generateCacheKey(`${CACHE_PREFIX.SEARCH}`, {
        keyword: input.keyword,
        page: input.page || 1,
        limit: input.limit || 12,
    });

    const result = await getOrSetCache(
        cacheKey,
        () => searchProducts(input),
        CACHE_TTL.SEARCH_RESULTS
    );

    return {
        ...result.data,
        _cacheInfo: {
            fromCache: result.fromCache,
            responseTime: result.responseTime,
        },
    };
};

/**
 * Cached version of getProductDetails
 * TTL: 5 minutes
 */
export const getProductDetailsCached = async (
    input: GetProductDetailsInput
): Promise<any & { _cacheInfo: CacheInfo }> => {
    const cacheKey = generateCacheKey(`${CACHE_PREFIX.PRODUCT}:detail`, { slug: input.slug });

    const result = await getOrSetCache(
        cacheKey,
        () => getProductDetails(input),
        CACHE_TTL.PRODUCT_DETAIL
    );

    return {
        ...result.data,
        _cacheInfo: {
            fromCache: result.fromCache,
            responseTime: result.responseTime,
        },
    };
};

/**
 * Cached version of getBestSellers
 * TTL: 10 minutes
 */
export const getBestSellersCached = async (
    input: GetBestSellersInput = {}
): Promise<any & { _cacheInfo: CacheInfo }> => {
    const cacheKey = generateCacheKey(`${CACHE_PREFIX.FEATURED}:bestsellers`, {
        limit: input.limit || 8,
    });

    const result = await getOrSetCache(
        cacheKey,
        () => getBestSellers(input),
        CACHE_TTL.FEATURED
    );

    return {
        ...result.data,
        _cacheInfo: {
            fromCache: result.fromCache,
            responseTime: result.responseTime,
        },
    };
};

/**
 * Cached version of getFeaturedProducts
 * TTL: 10 minutes
 */
export const getFeaturedProductsCached = async (
    input: GetFeaturedProductsInput = {}
): Promise<any & { _cacheInfo: CacheInfo }> => {
    const cacheKey = generateCacheKey(`${CACHE_PREFIX.FEATURED}:featured`, {
        limit: input.limit || 8,
    });

    const result = await getOrSetCache(
        cacheKey,
        () => getFeaturedProducts(input),
        CACHE_TTL.FEATURED
    );

    return {
        ...result.data,
        _cacheInfo: {
            fromCache: result.fromCache,
            responseTime: result.responseTime,
        },
    };
};

/**
 * Cached version of getDealsOfTheDay
 * TTL: 5 minutes (deals may change more frequently)
 */
export const getDealsOfTheDayCached = async (
    input: GetDealsOfTheDayInput = {}
): Promise<any & { _cacheInfo: CacheInfo }> => {
    const cacheKey = generateCacheKey(`${CACHE_PREFIX.FEATURED}:deals`, {
        limit: input.limit || 6,
    });

    const result = await getOrSetCache(
        cacheKey,
        () => getDealsOfTheDay(input),
        CACHE_TTL.FEATURED
    );

    return {
        ...result.data,
        _cacheInfo: {
            fromCache: result.fromCache,
            responseTime: result.responseTime,
        },
    };
};

/**
 * Invalidate all product-related caches
 * Call this when products are created/updated/deleted
 */
export const invalidateProductCaches = async (): Promise<void> => {
    await Promise.all([
        invalidateCache(CACHE_PREFIX.PRODUCTS),
        invalidateCache(CACHE_PREFIX.PRODUCT),
        invalidateCache(CACHE_PREFIX.SEARCH),
        invalidateCache(CACHE_PREFIX.FEATURED),
    ]);
    console.log('All product caches invalidated');
};

/**
 * Invalidate specific product cache
 */
export const invalidateProductCache = async (productSlug: string): Promise<void> => {
    await invalidateCache(`${CACHE_PREFIX.PRODUCT}:detail:slug:"${productSlug}"`);
    // Also invalidate list caches as the product might appear in lists
    await invalidateCache(CACHE_PREFIX.PRODUCTS);
    console.log(`Product ${productSlug} cache invalidated`);
};
