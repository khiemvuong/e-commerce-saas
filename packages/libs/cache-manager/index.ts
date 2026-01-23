/**
 * Cache Manager Package
 * 
 * Centralized caching utility with TTL strategies for e-commerce platform.
 * Provides a consistent interface for caching frequently accessed data.
 */

import redis from '../redis';


// Cache TTL constants (in seconds)
export const CACHE_TTL = {
    PRODUCTS_LIST: 600,      // 10 minutes - for product lists
    PRODUCT_DETAIL: 300,     // 5 minutes - for individual product
    SHOP_DETAIL: 300,        // 5 minutes - for shop details
    CATEGORIES: 1800,        // 30 minutes - rarely changes
    SEARCH_RESULTS: 180,     // 3 minutes - for search results
    FEATURED: 600,           // 10 minutes - for featured/best sellers
    STATS: 60,               // 1 minute - for statistics
} as const;

// Cache key prefixes for organization
export const CACHE_PREFIX = {
    PRODUCTS: 'products',
    PRODUCT: 'product',
    SHOP: 'shop',
    CATEGORY: 'category',
    SEARCH: 'search',
    FEATURED: 'featured',
    STATS: 'stats',
} as const;

/**
 * Cache metrics for monitoring
 */
interface CacheMetrics {
    hits: number;
    misses: number;
    lastReset: Date;
}

let cacheMetrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    lastReset: new Date(),
};

/**
 * Generate a cache key from prefix and parameters
 */
export const generateCacheKey = (prefix: string, params: Record<string, any> = {}): string => {
    const sortedParams = Object.keys(params)
        .sort()
        .filter(key => params[key] !== undefined && params[key] !== null)
        .map(key => `${key}:${JSON.stringify(params[key])}`)
        .join('|');
    
    return sortedParams ? `${prefix}:${sortedParams}` : prefix;
};

/**
 * Get data from cache or fetch from source
 * This is the main caching wrapper function
 */
export const getOrSetCache = async <T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = CACHE_TTL.PRODUCTS_LIST
): Promise<{ data: T; fromCache: boolean; responseTime: number }> => {
    const startTime = Date.now();
    
    try {
        // Try to get from cache first
        const cachedData = await redis.get<T>(key);
        
        if (cachedData !== null && cachedData !== undefined) {
            cacheMetrics.hits++;
            return {
                data: cachedData as T,
                fromCache: true,
                responseTime: Date.now() - startTime,
            };
        }
        
        // Cache miss - fetch from source
        cacheMetrics.misses++;
        const data = await fetcher();
        
        // Store in cache with TTL
        await redis.setex(key, ttlSeconds, JSON.stringify(data));
        
        return {
            data,
            fromCache: false,
            responseTime: Date.now() - startTime,
        };
    } catch (error) {
        console.error(`Cache error for key ${key}:`, error);
        // Fallback to fetcher if cache fails
        const data = await fetcher();
        return {
            data,
            fromCache: false,
            responseTime: Date.now() - startTime,
        };
    }
};

/**
 * Invalidate cache by key pattern
 * Useful when data is updated
 */
export const invalidateCache = async (pattern: string): Promise<number> => {
    try {
        // Get all keys matching pattern
        const keys = await redis.keys(`${pattern}*`);
        
        if (keys.length === 0) return 0;
        
        // Delete all matching keys
        for (const key of keys) {
            await redis.del(key);
        }
        
        console.log(`Invalidated ${keys.length} cache keys matching "${pattern}*"`);
        return keys.length;
    } catch (error) {
        console.error('Cache invalidation error:', error);
        return 0;
    }
};

/**
 * Invalidate specific cache key
 */
export const invalidateCacheKey = async (key: string): Promise<boolean> => {
    try {
        await redis.del(key);
        return true;
    } catch (error) {
        console.error(`Failed to invalidate cache key ${key}:`, error);
        return false;
    }
};

/**
 * Get cache metrics for monitoring dashboard
 */
export const getCacheMetrics = (): CacheMetrics & { hitRate: number } => {
    const total = cacheMetrics.hits + cacheMetrics.misses;
    return {
        ...cacheMetrics,
        hitRate: total > 0 ? (cacheMetrics.hits / total) * 100 : 0,
    };
};

/**
 * Reset cache metrics (for monitoring periods)
 */
export const resetCacheMetrics = (): void => {
    cacheMetrics = {
        hits: 0,
        misses: 0,
        lastReset: new Date(),
    };
};

/**
 * Warm up cache with frequently accessed data
 * Call this on service startup
 */
export const warmupCache = async (
    items: Array<{ key: string; fetcher: () => Promise<any>; ttl: number }>
): Promise<void> => {
    console.log('Starting cache warmup...');
    
    for (const item of items) {
        try {
            const data = await item.fetcher();
            await redis.setex(item.key, item.ttl, JSON.stringify(data));
            console.log(`Warmed up cache: ${item.key}`);
        } catch (error) {
            console.error(`Failed to warm up cache for ${item.key}:`, error);
        }
    }
    
    console.log('Cache warmup complete');
};

/**
 * Check if Redis connection is healthy
 */
export const checkCacheHealth = async (): Promise<boolean> => {
    try {
        await redis.ping();
        return true;
    } catch (error) {
        console.error('Redis health check failed:', error);
        return false;
    }
};

export default {
    getOrSetCache,
    invalidateCache,
    invalidateCacheKey,
    generateCacheKey,
    getCacheMetrics,
    resetCacheMetrics,
    warmupCache,
    checkCacheHealth,
    CACHE_TTL,
    CACHE_PREFIX,
};
