/**
 * Performance Metrics Routes
 * 
 * API endpoints for monitoring dashboard to display performance metrics.
 */

import { Router, Request, Response } from 'express';
import {
    getPerformanceSummary,
    getAllMetrics,
    calculateAggregatedStats,
    resetPerformanceMetrics,
} from '@packages/middleware/performanceTracker';
import { getCacheMetrics, checkCacheHealth, resetCacheMetrics } from '@packages/libs/cache-manager';

const router = Router();

/**
 * GET /api/metrics/summary
 * Returns performance summary for dashboard
 */
router.get('/metrics/summary', async (req: Request, res: Response) => {
    try {
        const summary = await getPerformanceSummary();
        const cacheMetrics = getCacheMetrics();
        const cacheHealthy = await checkCacheHealth();

        // Transform lastHour into fastest/slowest endpoint format
        let fastestEndpoint = null;
        let slowestEndpoint = null;
        
        if (summary.lastHour && summary.lastHour.length > 0) {
            // Sort to find fastest (min avgResponseTime) and slowest (max avgResponseTime)
            const sorted = [...summary.lastHour].sort((a, b) => a.avgResponseTime - b.avgResponseTime);
            const fastest = sorted[0];
            const slowest = sorted[sorted.length - 1];
            
            // Parse endpoint string format "METHOD:path"
            const parseFastest = fastest.endpoint.split(':');
            const parseSlowest = slowest.endpoint.split(':');
            
            const fastestMethod = parseFastest[0] || 'GET';
            const fastestPath = parseFastest.slice(1).join(':') || '/unknown';
            const slowestMethod = parseSlowest[0] || 'GET';
            const slowestPath = parseSlowest.slice(1).join(':') || '/unknown';
            
            fastestEndpoint = {
                method: fastestMethod,
                path: fastestPath,
                avgTime: Math.round(fastest.avgResponseTime * 100) / 100,
                endpoint: `${fastestMethod} ${fastestPath}`,
            };
            
            slowestEndpoint = {
                method: slowestMethod,
                path: slowestPath,
                avgTime: Math.round(slowest.avgResponseTime * 100) / 100,
                endpoint: `${slowestMethod} ${slowestPath}`,
            };
        }

        res.json({
            success: true,
            data: {
                performance: {
                    avgResponseTime: Math.round(summary.avgResponseTime * 100) / 100,
                    totalRequests: summary.totalRequests,
                    errorRate: Math.round(summary.errorRate * 100) / 100,
                    cacheHitRate: Math.round(summary.cacheHitRate * 100) / 100,
                    fastestEndpoint,
                    slowestEndpoint,
                },
                cache: {
                    ...cacheMetrics,
                    healthy: cacheHealthy,
                },
            },
        });
    } catch (error) {
        console.error('Failed to get metrics summary:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve performance metrics',
        });
    }
});

/**
 * GET /api/metrics/endpoints
 * Returns per-endpoint metrics
 */
router.get('/metrics/endpoints', async (req: Request, res: Response) => {
    try {
        const metrics = await getAllMetrics();
        const aggregated = calculateAggregatedStats(metrics);

        // Transform aggregated data to frontend expected format
        const endpoints = Array.from(aggregated.values()).map(agg => {
            // Parse endpoint string format "METHOD:path"
            const parts = agg.endpoint.split(':');
            const method = parts[0] || 'GET';
            const path = parts.slice(1).join(':') || '/unknown';
            
            return {
                method,
                path,
                endpoint: `${method} ${path}`,
                count: agg.requestCount,
                avgTime: Math.round(agg.avgResponseTime * 100) / 100,
                minTime: Math.round(agg.minResponseTime * 100) / 100,
                maxTime: Math.round(agg.maxResponseTime * 100) / 100,
                p95: Math.round(agg.p95 * 100) / 100,
                p99: Math.round(agg.p99 * 100) / 100,
                errorCount: agg.errorCount,
                cacheHitRate: Math.round(agg.cacheHitRate * 100) / 100,
            };
        }).sort((a, b) => b.avgTime - a.avgTime); // Sort by slowest first

        res.json({
            success: true,
            data: {
                endpoints,
                totalMetrics: metrics.length,
                summary: {
                    totalEndpoints: endpoints.length,
                    totalRequests: endpoints.reduce((sum, e) => sum + e.count, 0),
                },
            },
        });
    } catch (error) {
        console.error('Failed to get endpoint metrics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve endpoint metrics',
        });
    }
});

/**
 * GET /api/metrics/cache
 * Returns cache-specific metrics
 */
router.get('/metrics/cache', async (req: Request, res: Response) => {
    try {
        const cacheMetrics = getCacheMetrics();
        const cacheHealthy = await checkCacheHealth();

        res.json({
            success: true,
            data: {
                hits: cacheMetrics.hits,
                misses: cacheMetrics.misses,
                hitRate: cacheMetrics.hitRate,
                lastReset: cacheMetrics.lastReset,
                healthy: cacheHealthy,
            },
        });
    } catch (error) {
        console.error('Failed to get cache metrics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve cache metrics',
        });
    }
});

/**
 * GET /api/metrics/health
 * Health check endpoint for monitoring
 */
router.get('/metrics/health', async (req: Request, res: Response) => {
    try {
        const cacheHealthy = await checkCacheHealth();
        
        res.json({
            success: true,
            status: cacheHealthy ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            services: {
                cache: cacheHealthy ? 'up' : 'down',
                api: 'up',
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
        });
    }
});

/**
 * POST /api/metrics/reset
 * Reset all metrics (for debugging/maintenance)
 * Clears both cache metrics and performance metrics from Redis
 */
router.post('/metrics/reset', async (req: Request, res: Response) => {
    try {
        // Reset in-memory cache metrics counters
        resetCacheMetrics();
        
        // Reset Redis performance metrics (delete all keys)
        const perfResult = await resetPerformanceMetrics();
        
        res.json({
            success: true,
            message: 'All metrics reset successfully',
            data: {
                cacheMetricsReset: true,
                performanceMetricsDeleted: perfResult.deletedKeys,
                timestamp: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error('Failed to reset metrics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset metrics',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * DELETE /api/metrics/data
 * Delete all metrics data from Redis (alias for reset)
 */
router.delete('/metrics/data', async (req: Request, res: Response) => {
    try {
        resetCacheMetrics();
        const perfResult = await resetPerformanceMetrics();
        
        res.json({
            success: true,
            message: 'All metrics data deleted from Redis',
            data: {
                deletedKeys: perfResult.deletedKeys,
                timestamp: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error('Failed to delete metrics data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete metrics data',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

export const metricsRoutes = router;
