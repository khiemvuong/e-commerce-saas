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
} from '@packages/middleware/performanceTracker';
import { getCacheMetrics, checkCacheHealth } from '@packages/libs/cache-manager';

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

        res.json({
            success: true,
            data: {
                performance: summary,
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

        res.json({
            success: true,
            data: {
                endpoints: Array.from(aggregated.values()),
                totalMetrics: metrics.length,
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

export const metricsRoutes = router;
