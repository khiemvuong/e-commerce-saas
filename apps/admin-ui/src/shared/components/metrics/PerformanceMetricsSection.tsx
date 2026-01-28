'use client';

import React from 'react';
import { Activity, Zap, TrendingUp, Database, Clock, CheckCircle, AlertCircle, RotateCcw, Wifi, WifiOff } from 'lucide-react';
import StatCardWithGrowth from '../cards/StatCardWithGrowth';
import { useMetricsSummary, useEndpointsMetrics, useHealthStatus, useResetMetrics } from '../../hooks/useMetrics';
import { useMetricsWebSocket } from '../../hooks/useMetricsWebSocket';
import { toast } from 'react-hot-toast';

export default function PerformanceMetricsSection() {
    const { data: metricsSummary, isLoading: isLoadingSummary } = useMetricsSummary();
    const { data: endpointsData, isLoading: isLoadingEndpoints } = useEndpointsMetrics();
    const { data: healthStatus } = useHealthStatus();
    const resetMutation = useResetMetrics();
    const { isConnected: wsConnected, lastUpdate } = useMetricsWebSocket();

    const isHealthy = healthStatus?.status === 'healthy';

    const handleResetMetrics = async () => {
        try {
            await resetMutation.mutateAsync();
            toast.success('✓ All metrics reset successfully!', {
                duration: 3000,
                position: 'top-right',
                style: {
                    background: '#10b981',
                    color: '#fff',
                },
            });
        } catch (error) {
            toast.error('Failed to reset metrics', {
                duration: 3000,
                position: 'top-right',
            });
        }
    };

    // Get top 5 slowest endpoints
    const slowestEndpoints = React.useMemo(() => {
        if (!endpointsData?.endpoints) return [];
        return [...endpointsData.endpoints]
            .sort((a, b) => b.avgTime - a.avgTime)
            .slice(0, 5);
    }, [endpointsData]);

    // Get top 5 fastest endpoints
    const fastestEndpoints = React.useMemo(() => {
        if (!endpointsData?.endpoints) return [];
        return [...endpointsData.endpoints]
            .sort((a, b) => a.avgTime - b.avgTime)
            .slice(0, 5);
    }, [endpointsData]);

    const formatTime = (ms: number) => {
        if (ms < 1000) return `${ms.toFixed(0)}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    return (
        <div className="space-y-4">
            {/* Header with Health Status */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-white">Performance Metrics</h2>
                        {/* WebSocket Status Indicator */}
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${
                            wsConnected 
                                ? 'bg-green-500/10 text-green-400' 
                                : 'bg-gray-500/10 text-gray-400'
                        }`}>
                            {wsConnected ? (
                                <>
                                    <Wifi className="w-3 h-3" />
                                    <span>Live</span>
                                </>
                            ) : (
                                <>
                                    <WifiOff className="w-3 h-3" />
                                    <span>Offline</span>
                                </>
                            )}
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm mt-0.5">
                        Real-time API and cache performance
                        {lastUpdate && (
                            <span className="ml-2 text-gray-600">
                                • Updated {new Date(lastUpdate).toLocaleTimeString()}
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Reset Button */}
                    <button
                        onClick={handleResetMetrics}
                        disabled={resetMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                        title="Reset all metrics data from Redis"
                    >
                        <RotateCcw className={`w-4 h-4 ${resetMutation.isPending ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-300'}`} />
                        <span className="text-sm font-medium hidden sm:inline">
                            {resetMutation.isPending ? 'Resetting...' : 'Reset Cache'}
                        </span>
                    </button>
                    
                    {/* Health Status Badge */}
                    {healthStatus && (
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                            isHealthy 
                                ? 'bg-emerald-500/10 text-emerald-400' 
                                : 'bg-red-500/10 text-red-400'
                        }`}>
                            {isHealthy ? (
                                <CheckCircle className="w-4 h-4" />
                            ) : (
                                <AlertCircle className="w-4 h-4" />
                            )}
                            <span className="text-sm font-medium capitalize">{healthStatus.status}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Performance Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <StatCardWithGrowth
                    title="Avg Response Time"
                    value={isLoadingSummary ? '—' : formatTime(metricsSummary?.performance.avgResponseTime || 0)}
                    icon={<Clock className="w-5 h-5 text-cyan-400" />}
                    iconBgColor="bg-cyan-500/20"
                    isLoading={isLoadingSummary}
                />
                <StatCardWithGrowth
                    title="Total Requests"
                    value={metricsSummary?.performance.totalRequests || 0}
                    icon={<Activity className="w-5 h-5 text-indigo-400" />}
                    iconBgColor="bg-indigo-500/20"
                    isLoading={isLoadingSummary}
                />
                <StatCardWithGrowth
                    title="Cache Hit Rate"
                    value={isLoadingSummary ? '—' : `${(metricsSummary?.cache.hitRate || 0).toFixed(1)}%`}
                    icon={<Zap className="w-5 h-5 text-yellow-400" />}
                    iconBgColor="bg-yellow-500/20"
                    isLoading={isLoadingSummary}
                />
                <StatCardWithGrowth
                    title="Cache Hits"
                    value={metricsSummary?.cache.hits || 0}
                    icon={<Database className="w-5 h-5 text-green-400" />}
                    iconBgColor="bg-green-500/20"
                    isLoading={isLoadingSummary}
                />
            </div>

            {/* Detailed Metrics Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {/* Slowest Endpoints */}
                <div className="bg-[#111] border border-gray-800/60 rounded-xl p-5 md:p-6">
                    <div className="mb-4">
                        <h3 className="text-base md:text-lg font-semibold text-white">Slowest Endpoints</h3>
                        <p className="text-gray-500 text-sm mt-0.5">Top 5 by average response time</p>
                    </div>
                    <div className="space-y-2">
                        {isLoadingEndpoints ? (
                            <div className="text-center py-8 text-gray-500 text-sm">Loading...</div>
                        ) : slowestEndpoints.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 text-sm">No data available</div>
                        ) : (
                            slowestEndpoints.map((endpoint, index) => {
                                const method = endpoint?.method || 'GET';
                                const path = endpoint?.path || 'unknown';
                                return (
                                    <div 
                                        key={`${method}-${path}-${index}`}
                                        className="flex items-center justify-between p-3 bg-white/[0.02] hover:bg-white/[0.04] rounded-lg transition-colors border border-gray-800/40"
                                    >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                                                method === 'GET' ? 'bg-blue-500/20 text-blue-400' :
                                                method === 'POST' ? 'bg-green-500/20 text-green-400' :
                                                method === 'PUT' ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-red-500/20 text-red-400'
                                            }`}>
                                                {method}
                                            </span>
                                            <span className="text-xs text-gray-400 font-medium">#{index + 1}</span>
                                        </div>
                                        <p className="text-sm text-gray-300 truncate font-mono">{path}</p>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                            <span>Calls: {endpoint?.count || 0}</span>
                                            <span>P95: {formatTime(endpoint?.p95 || 0)}</span>
                                            <span>Max: {formatTime(endpoint?.maxTime || 0)}</span>
                                        </div>
                                    </div>
                                    <div className="text-right ml-4">
                                        <p className="text-lg font-bold text-cyan-400">{formatTime(endpoint?.avgTime || 0)}</p>
                                        <p className="text-xs text-gray-500">avg</p>
                                    </div>
                                </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Fastest Endpoints */}
                <div className="bg-[#111] border border-gray-800/60 rounded-xl p-5 md:p-6">
                    <div className="mb-4">
                        <h3 className="text-base md:text-lg font-semibold text-white">Fastest Endpoints</h3>
                        <p className="text-gray-500 text-sm mt-0.5">Top 5 best performing</p>
                    </div>
                    <div className="space-y-2">
                        {isLoadingEndpoints ? (
                            <div className="text-center py-8 text-gray-500 text-sm">Loading...</div>
                        ) : fastestEndpoints.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 text-sm">No data available</div>
                        ) : (
                            fastestEndpoints.map((endpoint, index) => {
                                const method = endpoint?.method || 'GET';
                                const path = endpoint?.path || 'unknown';
                                return (
                                    <div 
                                        key={`fast-${method}-${path}-${index}`}
                                        className="flex items-center justify-between p-3 bg-white/[0.02] hover:bg-white/[0.04] rounded-lg transition-colors border border-emerald-800/40"
                                    >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                                                method === 'GET' ? 'bg-blue-500/20 text-blue-400' :
                                                method === 'POST' ? 'bg-green-500/20 text-green-400' :
                                                method === 'PUT' ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-red-500/20 text-red-400'
                                            }`}>
                                                {method}
                                            </span>
                                            <span className="text-xs text-emerald-400 font-medium">#{index + 1}</span>
                                        </div>
                                        <p className="text-sm text-gray-300 truncate font-mono">{path}</p>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                            <span>Calls: {endpoint?.count || 0}</span>
                                            <span>P95: {formatTime(endpoint?.p95 || 0)}</span>
                                            <span>Min: {formatTime(endpoint?.minTime || 0)}</span>
                                        </div>
                                    </div>
                                    <div className="text-right ml-4">
                                        <p className="text-lg font-bold text-emerald-400">{formatTime(endpoint?.avgTime || 0)}</p>
                                        <p className="text-xs text-gray-500">avg</p>
                                    </div>
                                </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Performance Summary */}
                <div className="bg-[#111] border border-gray-800/60 rounded-xl p-5 md:p-6">
                    <div className="mb-4">
                        <h3 className="text-base md:text-lg font-semibold text-white">Performance Summary</h3>
                        <p className="text-gray-500 text-sm mt-0.5">Best and worst performing endpoints</p>
                    </div>
                    {isLoadingSummary ? (
                        <div className="text-center py-8 text-gray-500 text-sm">Loading...</div>
                    ) : (
                        <div className="space-y-4">
                            {/* Fastest Endpoint */}
                            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                                    <span className="text-sm font-semibold text-emerald-400">Fastest Endpoint</span>
                                </div>
                                <div className="space-y-1">
                                    {metricsSummary?.performance.fastestEndpoint ? (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                                                    {metricsSummary.performance.fastestEndpoint.method}
                                                </span>
                                                <span className="text-sm text-gray-300 font-mono truncate">
                                                    {metricsSummary.performance.fastestEndpoint.path}
                                                </span>
                                            </div>
                                            <p className="text-2xl font-bold text-emerald-400">
                                                {formatTime(metricsSummary.performance.fastestEndpoint.avgTime || 0)}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No data available</p>
                                    )}
                                </div>
                            </div>

                            {/* Slowest Endpoint */}
                            <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Activity className="w-4 h-4 text-red-400" />
                                    <span className="text-sm font-semibold text-red-400">Slowest Endpoint</span>
                                </div>
                                <div className="space-y-1">
                                    {metricsSummary?.performance.slowestEndpoint ? (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
                                                    {metricsSummary.performance.slowestEndpoint.method}
                                                </span>
                                                <span className="text-sm text-gray-300 font-mono truncate">
                                                    {metricsSummary.performance.slowestEndpoint.path}
                                                </span>
                                            </div>
                                            <p className="text-2xl font-bold text-red-400">
                                                {formatTime(metricsSummary.performance.slowestEndpoint.avgTime || 0)}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No data available</p>
                                    )}
                                </div>
                            </div>

                            {/* Cache Stats */}
                            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Database className="w-4 h-4 text-blue-400" />
                                    <span className="text-sm font-semibold text-blue-400">Cache Performance</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs text-gray-500">Hits</p>
                                        <p className="text-lg font-bold text-green-400">
                                            {metricsSummary?.cache.hits.toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Misses</p>
                                        <p className="text-lg font-bold text-amber-400">
                                            {metricsSummary?.cache.misses.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-blue-500/20">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-gray-500">Status</p>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                                            metricsSummary?.cache.healthy 
                                                ? 'bg-emerald-500/20 text-emerald-400' 
                                                : 'bg-red-500/20 text-red-400'
                                        }`}>
                                            {metricsSummary?.cache.healthy ? 'Healthy' : 'Degraded'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
