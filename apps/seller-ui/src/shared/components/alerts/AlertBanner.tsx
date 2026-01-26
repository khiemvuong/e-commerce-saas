'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, Info, CheckCircle, Package, Clock, XCircle } from 'lucide-react';

interface Alert {
    type: 'warning' | 'info' | 'error' | 'success';
    icon: string;
    text: string;
    count: number;
    link?: string;
}

interface AlertBannerProps {
    alerts: Alert[];
}

const iconMap: Record<string, React.ReactNode> = {
    'package': <Package className="w-4 h-4" />,
    'clock': <Clock className="w-4 h-4" />,
    'alert-circle': <XCircle className="w-4 h-4" />,
};

const typeConfig: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
    warning: { 
        bg: 'bg-amber-500/5', 
        border: 'border-amber-500/20', 
        text: 'text-amber-400',
        iconBg: 'bg-amber-500/20'
    },
    info: { 
        bg: 'bg-blue-500/5', 
        border: 'border-blue-500/20', 
        text: 'text-blue-400',
        iconBg: 'bg-blue-500/20'
    },
    error: { 
        bg: 'bg-red-500/5', 
        border: 'border-red-500/20', 
        text: 'text-red-400',
        iconBg: 'bg-red-500/20'
    },
    success: { 
        bg: 'bg-emerald-500/5', 
        border: 'border-emerald-500/20', 
        text: 'text-emerald-400',
        iconBg: 'bg-emerald-500/20'
    },
};

const typeIcons: Record<string, React.ReactNode> = {
    warning: <AlertTriangle className="w-4 h-4" />,
    info: <Info className="w-4 h-4" />,
    error: <XCircle className="w-4 h-4" />,
    success: <CheckCircle className="w-4 h-4" />,
};

// Translate Vietnamese alerts to English
const translateAlert = (text: string): string => {
    const translations: Record<string, string> = {
        'sản phẩm sắp hết hàng': 'products running low',
        'đơn hàng chờ xử lý': 'orders pending',
        'đơn pending': 'pending orders',
    };
    
    let result = text;
    Object.entries(translations).forEach(([vi, en]) => {
        result = result.replace(vi, en);
    });
    return result;
};

export default function AlertBanner({ alerts }: AlertBannerProps) {
    if (!alerts || alerts.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2">
            {alerts.map((alert, index) => {
                const config = typeConfig[alert.type] || typeConfig.info;
                const translatedText = translateAlert(alert.text);
                
                const content = (
                    <div
                        className={`inline-flex items-center gap-2.5 px-3 py-2 rounded-lg border ${config.bg} ${config.border} ${config.text}
                            ${alert.link ? 'cursor-pointer hover:opacity-80 transition-all hover:scale-[1.02]' : ''}`}
                    >
                        <span className={`p-1 rounded-md ${config.iconBg} flex-shrink-0`}>
                            {iconMap[alert.icon] || typeIcons[alert.type]}
                        </span>
                        <span className="text-sm font-medium">{translatedText}</span>
                    </div>
                );

                return alert.link ? (
                    <Link key={index} href={alert.link}>
                        {content}
                    </Link>
                ) : (
                    <div key={index}>{content}</div>
                );
            })}
        </div>
    );
}
