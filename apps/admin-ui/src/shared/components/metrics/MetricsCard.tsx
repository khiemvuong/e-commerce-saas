'use client';

import React from 'react';
import { Activity, Database } from 'lucide-react';
import { useMetricsSummary } from '../../hooks/useMetrics';

interface MetricsCardProps {
    className?: string;
}

export default function MetricsCard({ className = '' }: MetricsCardProps) {
    const { data: metricsSummary, isLoading } = useMetricsSummary();

    const formatTime = (ms: number) => {
        if (ms < 1000) return `${ms.toFixed(0)}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    if (isLoading) {
        return (
            <div className={`bg-[#111] border border-gray-800/60 rounded-xl p-4 ${className}`}>
                <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-800 rounded w-1/2"></div>
                    <div className="h-8 bg-gray-800 rounded"></div>
                    <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-[#111] border border-gray-800/60 rounded-xl p-4 ${className}`}>
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">API Performance</h3>
                    <div className={`w-2 h-2 rounded-full ${
                        metricsSummary?.cache.healthy ? 'bg-emerald-400' : 'bg-red-400'
                    }`}></div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <div className="flex items-center gap-1.5 mb-1">
                            <Activity className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="text-xs text-gray-500">Avg Time</span>
                        </div>
                        <p className="text-xl font-bold text-cyan-400">
                            {formatTime(metricsSummary?.performance.avgResponseTime || 0)}
                        </p>
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5 mb-1">
                            <Database className="w-3.5 h-3.5 text-yellow-400" />
                            <span className="text-xs text-gray-500">Cache Hit</span>
                        </div>
                        <p className="text-xl font-bold text-yellow-400">
                            {(metricsSummary?.cache.hitRate || 0).toFixed(1)}%
                        </p>
                    </div>
                </div>

                <div className="pt-3 border-t border-gray-800/60">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Total Requests</span>
                        <span className="font-mono text-gray-300">
                            {(metricsSummary?.performance.totalRequests || 0).toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
