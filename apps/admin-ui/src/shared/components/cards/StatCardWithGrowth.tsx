'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardWithGrowthProps {
    title: string;
    value: string | number;
    growth?: number;
    icon: React.ReactNode;
    iconBgColor?: string;
    isLoading?: boolean;
}

export default function StatCardWithGrowth({
    title,
    value,
    growth,
    icon,
    iconBgColor = 'bg-blue-500/20',
    isLoading = false,
}: StatCardWithGrowthProps) {
    const formatValue = (val: string | number) => {
        if (typeof val === 'number') {
            return val.toLocaleString();
        }
        return val;
    };

    const renderGrowth = () => {
        if (growth === undefined || growth === null) return null;
        
        const isPositive = growth > 0;
        const isNeutral = growth === 0;
        
        return (
            <div className={`inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded ${
                isNeutral ? 'text-gray-500 bg-gray-500/10' :
                isPositive ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
            }`}>
                {isNeutral ? (
                    <Minus className="w-3 h-3" />
                ) : isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                ) : (
                    <TrendingDown className="w-3 h-3" />
                )}
                <span className="font-medium">{isPositive ? '+' : ''}{growth}%</span>
            </div>
        );
    };

    return (
        <div className="bg-[#111] border border-gray-800/60 rounded-xl p-4 hover:border-gray-700/60 transition-colors">
            <div className="flex items-center gap-3">
                <div className={`p-2 ${iconBgColor} rounded-lg flex-shrink-0`}>
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-gray-500 text-xs mb-0.5">{title}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xl font-bold text-white">
                            {isLoading ? '—' : formatValue(value)}
                        </p>
                        {renderGrowth()}
                    </div>
                </div>
            </div>
        </div>
    );
}
