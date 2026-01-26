'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
    title: string;
    value: string | number;
    growth?: number;
    growthLabel?: string;
    icon: React.ReactNode;
    iconBgColor?: string;
}

export default function KPICard({
    title,
    value,
    growth,
    growthLabel = 'vs last period',
    icon,
    iconBgColor = 'bg-blue-500/20',
}: KPICardProps) {
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
            <div className={`flex items-center gap-1 text-xs ${
                isNeutral ? 'text-gray-500' :
                isPositive ? 'text-emerald-400' : 'text-red-400'
            }`}>
                {isNeutral ? (
                    <Minus className="w-3 h-3" />
                ) : isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                ) : (
                    <TrendingDown className="w-3 h-3" />
                )}
                <span>
                    {isPositive ? '+' : ''}{growth}% {growthLabel}
                </span>
            </div>
        );
    };

    return (
        <div className="bg-[#111] border border-gray-800/60 rounded-xl p-4 hover:border-gray-700/60 transition-colors">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <p className="text-gray-500 text-xs md:text-sm mb-1 truncate">{title}</p>
                    <p className="text-xl md:text-2xl font-bold text-white truncate">{formatValue(value)}</p>
                    <div className="mt-1.5">
                        {renderGrowth()}
                    </div>
                </div>
                <div className={`p-2 md:p-2.5 ${iconBgColor} rounded-lg flex-shrink-0`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}
