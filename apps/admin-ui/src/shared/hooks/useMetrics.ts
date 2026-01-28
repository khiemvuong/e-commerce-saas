import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../utils/axiosInstance';

interface PerformanceSummary {
    avgResponseTime: number;
    totalRequests: number;
    slowestEndpoint: {
        method: string;
        path: string;
        avgTime: number;
    } | null;
    fastestEndpoint: {
        method: string;
        path: string;
        avgTime: number;
    } | null;
}

interface CacheMetrics {
    hits: number;
    misses: number;
    hitRate: number;
    lastReset: string;
    healthy: boolean;
}

interface EndpointMetric {
    method: string;
    path: string;
    count: number;
    avgTime: number;
    minTime: number;
    maxTime: number;
    p95: number;
    p99: number;
}

interface MetricsSummary {
    performance: PerformanceSummary;
    cache: CacheMetrics;
}

interface EndpointsData {
    endpoints: EndpointMetric[];
    totalMetrics: number;
}

interface HealthStatus {
    success: boolean;
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    services: {
        cache: 'up' | 'down';
        api: 'up' | 'down';
    };
}

const fetchMetricsSummary = async (): Promise<MetricsSummary> => {
    const res = await axiosInstance.get('/product/api/metrics/summary');
    return res.data.data;
};

const fetchEndpointsMetrics = async (): Promise<EndpointsData> => {
    const res = await axiosInstance.get('/product/api/metrics/endpoints');
    return res.data.data;
};

const fetchCacheMetrics = async (): Promise<CacheMetrics> => {
    const res = await axiosInstance.get('/product/api/metrics/cache');
    return res.data.data;
};

const fetchHealthStatus = async (): Promise<HealthStatus> => {
    const res = await axiosInstance.get('/product/api/metrics/health');
    return res.data;
};

export const useMetricsSummary = () => {
    return useQuery({
        queryKey: ['metrics-summary'],
        queryFn: fetchMetricsSummary,
        staleTime: 30 * 1000, // Refresh every 30 seconds
        refetchInterval: 30 * 1000, // Auto-refresh
    });
};

export const useEndpointsMetrics = () => {
    return useQuery({
        queryKey: ['endpoints-metrics'],
        queryFn: fetchEndpointsMetrics,
        staleTime: 60 * 1000, // Refresh every 60 seconds
        refetchInterval: 60 * 1000,
    });
};

export const useCacheMetrics = () => {
    return useQuery({
        queryKey: ['cache-metrics'],
        queryFn: fetchCacheMetrics,
        staleTime: 30 * 1000,
        refetchInterval: 30 * 1000,
    });
};

export const useHealthStatus = () => {
    return useQuery({
        queryKey: ['health-status'],
        queryFn: fetchHealthStatus,
        staleTime: 15 * 1000, // Refresh every 15 seconds
        refetchInterval: 15 * 1000,
    });
};

/**
 * Reset all metrics (cache + performance metrics)
 */
const resetMetrics = async (): Promise<{ success: boolean; message: string; data: any }> => {
    const res = await axiosInstance.post('/product/api/metrics/reset');
    return res.data;
};

export const useResetMetrics = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: resetMetrics,
        onSuccess: () => {
            // Invalidate and refetch all metrics queries
            queryClient.invalidateQueries({ queryKey: ['metrics-summary'] });
            queryClient.invalidateQueries({ queryKey: ['endpoints-metrics'] });
            queryClient.invalidateQueries({ queryKey: ['cache-metrics'] });
            queryClient.invalidateQueries({ queryKey: ['health-status'] });
        },
    });
};
