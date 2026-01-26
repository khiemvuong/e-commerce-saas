'use client';

import React from 'react';
import { Trophy, TrendingUp, ShoppingCart } from 'lucide-react';

interface TopPerformer {
    shopName: string;
    shopId: string;
    avatar: string | null;
    revenue?: number;
    growth?: number;
    orders?: number;
}

interface TopPerformersProps {
    topRevenue: TopPerformer | null;
    fastestGrowth: TopPerformer | null;
    mostOrders: TopPerformer | null;
}

export default function TopPerformers({ topRevenue, fastestGrowth, mostOrders }: TopPerformersProps) {
    const performers = [
        {
            label: 'Top Revenue',
            data: topRevenue,
            icon: <Trophy className="w-4 h-4 text-yellow-400" />,
            iconBg: 'bg-yellow-500/20',
            value: topRevenue?.revenue ? `$${topRevenue.revenue.toLocaleString()}` : null,
        },
        {
            label: 'Fastest Growth',
            data: fastestGrowth,
            icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
            iconBg: 'bg-emerald-500/20',
            value: fastestGrowth?.growth ? `+${fastestGrowth.growth}%` : null,
        },
        {
            label: 'Most Orders',
            data: mostOrders,
            icon: <ShoppingCart className="w-4 h-4 text-blue-400" />,
            iconBg: 'bg-blue-500/20',
            value: mostOrders?.orders ? `${mostOrders.orders} orders` : null,
        },
    ];

    const hasAnyData = topRevenue || fastestGrowth || mostOrders;
    if (!hasAnyData) return null;

    return (
        <div className="bg-[#111] border border-gray-800/60 rounded-xl p-4 md:p-5">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Top Performers</h3>
            <div className="space-y-2">
                {performers.map((performer, index) => {
                    if (!performer.data) return null;
                    
                    return (
                        <div 
                            key={index} 
                            className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer"
                        >
                            <div className={`p-1.5 rounded-lg ${performer.iconBg} flex-shrink-0`}>
                                {performer.icon}
                            </div>
                            {performer.data.avatar ? (
                                <img 
                                    src={performer.data.avatar} 
                                    alt={performer.data.shopName}
                                    className="w-8 h-8 rounded-full object-cover border border-gray-800"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs text-gray-500 border border-gray-700">
                                    {performer.data.shopName.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-200 truncate">
                                    {performer.data.shopName}
                                </p>
                                <p className="text-xs text-gray-500">{performer.label}</p>
                            </div>
                            <p className="text-sm font-semibold text-white tabular-nums">
                                {performer.value}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
