/**
 * Performance Tracking Middleware
 * 
 * Tracks API response times and provides metrics for monitoring dashboard.
 * Records timing data to Redis for real-time dashboard visualization.
 */

import { Request, Response, NextFunction } from 'express';
import redis from '../libs/redis';

// WebSocket broadcast functions (will be set from product-service)
let broadcastMetricsFunc: ((data: any) => void) | null = null;
let broadcastSummaryFunc: ((data: any) => void) | null = null;

export const setBroadcastFunction = (func: (data: any) => void) => {
    broadcastMetricsFunc = func;
};

export const setBroadcastSummaryFunction = (func: (data: any) => void) => {
    broadcastSummaryFunc = func;
};


// Metrics storage key prefix
const METRICS_PREFIX = 'perf:metrics';
const METRICS_TTL = 3600; // 1 hour retention for detailed metrics

/**
 * Performance metric data structure
 */
export interface PerformanceMetric {
    endpoint: string;
    method: string;
    responseTime: number;
    statusCode: number;
    timestamp: number;
    fromCache?: boolean;
}

/**
 * Aggregated metrics for dashboard
 */
export interface AggregatedMetrics {
    endpoint: string;
    avgResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    p50: number;
    p95: number;
    p99: number;
    requestCount: number;
    errorCount: number;
    cacheHitRate: number;
}

// In-memory buffer for batch writes
let metricsBuffer: PerformanceMetric[] = [];
const BUFFER_FLUSH_SIZE = 50;
const BUFFER_FLUSH_INTERVAL = 5000; // 5 seconds

/**
 * Flush metrics buffer to Redis
 */
const flushMetricsBuffer = async (): Promise<void> => {
    if (metricsBuffer.length === 0) return;
    
    const toFlush = [...metricsBuffer];
    metricsBuffer = [];
    
    try {
        const key = `${METRICS_PREFIX}:buffer:${Date.now()}`;
        await redis.setex(key, METRICS_TTL, JSON.stringify(toFlush));
        
        // Broadcast new metrics to WebSocket clients
        if (broadcastMetricsFunc && toFlush.length > 0) {
            broadcastMetricsFunc(toFlush);
        }
        
        // After flushing, broadcast updated summary to WebSocket clients
        if (broadcastSummaryFunc && toFlush.length > 0) {
            // Get updated summary and broadcast it
            const summary = await getPerformanceSummary();
            broadcastSummaryFunc(summary);
        }
    } catch (error) {
        console.error('Failed to flush metrics buffer:', error);
        // Put items back in buffer on failure
        metricsBuffer = [...toFlush, ...metricsBuffer];
    }
};

// Start periodic flush
setInterval(flushMetricsBuffer, BUFFER_FLUSH_INTERVAL);

/**
 * Performance tracking middleware
 * Add to Express app to track all API response times
 */
export const performanceTracker = () => {
    return (req: Request, res: Response, next: NextFunction): void => {
        // Skip tracking for metrics API endpoints to avoid tracking the metrics themselves
        if (req.path.startsWith('/api/metrics')) {
            return next();
        }
        
        const startTime = process.hrtime.bigint();
        const startTimestamp = Date.now();
        
        // Store original end function
        const originalEnd = res.end;
        const originalJson = res.json;
        
        // Track if response came from cache (set by cache layer)
        let fromCache = false;
        
        // Override res.json to capture cache status
        res.json = function(body: any) {
            if (body && typeof body === 'object' && body._fromCache !== undefined) {
                fromCache = body._fromCache;
                delete body._fromCache;
            }
            return originalJson.call(this, body);
        };
        
        // Override res.end to capture timing
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const wrappedEnd = function(this: Response, ...args: any[]): Response {
            const endTime = process.hrtime.bigint();
            const responseTimeNs = Number(endTime - startTime);
            const responseTimeMs = responseTimeNs / 1_000_000;
            
            // Create metric record
            // Prefer route pattern if available, otherwise use actual path
            // Strip query params and ensure we have a valid path
            const rawPath = req.route?.path || req.path || req.url?.split('?')[0] || '/unknown';
            const cleanPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
            
            const metric: PerformanceMetric = {
                endpoint: cleanPath,
                method: req.method,
                responseTime: Math.round(responseTimeMs * 100) / 100,
                statusCode: res.statusCode,
                timestamp: startTimestamp,
                fromCache,
            };
            
            // Add to buffer
            metricsBuffer.push(metric);
            
            // Flush if buffer is full
            if (metricsBuffer.length >= BUFFER_FLUSH_SIZE) {
                flushMetricsBuffer();
            }
            
            // Set response header for debugging (only if headers not sent)
            if (!res.headersSent) {
                res.setHeader('X-Response-Time', `${metric.responseTime}ms`);
                if (fromCache) {
                    res.setHeader('X-Cache', 'HIT');
                }
            }
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (originalEnd as any).apply(this, args);
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        res.end = wrappedEnd as any;
        
        next();
    };
};

/**
 * Get aggregated metrics for an endpoint
 */
export const getEndpointMetrics = async (endpoint: string): Promise<AggregatedMetrics | null> => {
    try {
        const key = `${METRICS_PREFIX}:agg:${endpoint}`;
        const data = await redis.get<AggregatedMetrics>(key);
        return data;
    } catch (error) {
        console.error('Failed to get endpoint metrics:', error);
        return null;
    }
};

/**
 * Get all recent metrics for dashboard
 */
export const getAllMetrics = async (): Promise<PerformanceMetric[]> => {
    try {
        const keys = await redis.keys(`${METRICS_PREFIX}:buffer:*`);
        const allMetrics: PerformanceMetric[] = [];
        
        for (const key of keys) {
            const data = await redis.get<PerformanceMetric[]>(key);
            if (data) {
                allMetrics.push(...data);
            }
        }
        
        // Sort by timestamp descending
        return allMetrics.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
        console.error('Failed to get all metrics:', error);
        return [];
    }
};

/**
 * Calculate percentile from sorted array
 */
const percentile = (arr: number[], p: number): number => {
    if (arr.length === 0) return 0;
    const index = Math.ceil((p / 100) * arr.length) - 1;
    return arr[Math.max(0, index)];
};

/**
 * Calculate aggregated stats from metrics array
 */
export const calculateAggregatedStats = (metrics: PerformanceMetric[]): Map<string, AggregatedMetrics> => {
    const groupedByEndpoint = new Map<string, PerformanceMetric[]>();
    
    // Group by endpoint
    for (const metric of metrics) {
        const key = `${metric.method}:${metric.endpoint}`;
        if (!groupedByEndpoint.has(key)) {
            groupedByEndpoint.set(key, []);
        }
        groupedByEndpoint.get(key)!.push(metric);
    }
    
    // Calculate stats for each endpoint
    const result = new Map<string, AggregatedMetrics>();
    
    for (const [endpoint, endpointMetrics] of groupedByEndpoint) {
        const responseTimes = endpointMetrics.map(m => m.responseTime).sort((a, b) => a - b);
        const cacheHits = endpointMetrics.filter(m => m.fromCache).length;
        const errors = endpointMetrics.filter(m => m.statusCode >= 400).length;
        
        result.set(endpoint, {
            endpoint,
            avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
            minResponseTime: responseTimes[0] || 0,
            maxResponseTime: responseTimes[responseTimes.length - 1] || 0,
            p50: percentile(responseTimes, 50),
            p95: percentile(responseTimes, 95),
            p99: percentile(responseTimes, 99),
            requestCount: endpointMetrics.length,
            errorCount: errors,
            cacheHitRate: (cacheHits / endpointMetrics.length) * 100,
        });
    }
    
    return result;
};

/**
 * Health check endpoint data
 */
export const getPerformanceSummary = async (): Promise<{
    totalRequests: number;
    avgResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
    lastHour: AggregatedMetrics[];
}> => {
    const metrics = await getAllMetrics();
    const lastHour = metrics.filter(m => m.timestamp > Date.now() - 3600000);
    
    const stats = calculateAggregatedStats(lastHour);
    
    const totalRequests = lastHour.length;
    const avgResponseTime = lastHour.length > 0
        ? lastHour.reduce((sum, m) => sum + m.responseTime, 0) / lastHour.length
        : 0;
    const errors = lastHour.filter(m => m.statusCode >= 400).length;
    const cacheHits = lastHour.filter(m => m.fromCache).length;
    
    return {
        totalRequests,
        avgResponseTime: Math.round(avgResponseTime * 100) / 100,
        errorRate: totalRequests > 0 ? (errors / totalRequests) * 100 : 0,
        cacheHitRate: totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0,
        lastHour: Array.from(stats.values()),
    };
};

/**
 * Reset all performance metrics from Redis
 * Deletes all metric buffer keys to clear historical data
 */
export const resetPerformanceMetrics = async (): Promise<{ deletedKeys: number }> => {
    try {
        // Clear in-memory buffer first
        metricsBuffer = [];
        
        // Delete all metric buffer keys from Redis
        const keys = await redis.keys(`${METRICS_PREFIX}:*`);
        
        if (keys.length === 0) {
            return { deletedKeys: 0 };
        }
        
        // Delete all matching keys
        for (const key of keys) {
            await redis.del(key);
        }
        
        console.log(`✓ Reset performance metrics: deleted ${keys.length} Redis keys`);
        return { deletedKeys: keys.length };
    } catch (error) {
        console.error('Failed to reset performance metrics:', error);
        throw error;
    }
};

export default performanceTracker;
