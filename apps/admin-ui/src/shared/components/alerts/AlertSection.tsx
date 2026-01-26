'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, Info, CheckCircle, Clock, XCircle, UserPlus } from 'lucide-react';

interface Alert {
    type: 'warning' | 'info' | 'error' | 'success';
    icon: string;
    text: string;
    count: number;
    link?: string;
}

interface AlertSectionProps {
    alerts: Alert[];
    title?: string;
}

const iconMap: Record<string, React.ReactNode> = {
    'clock': <Clock className="w-4 h-4" />,
    'alert-circle': <XCircle className="w-4 h-4" />,
    'user-plus': <UserPlus className="w-4 h-4" />,
    'user-check': <CheckCircle className="w-4 h-4" />,
};

const typeConfig: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
    warning: { bg: 'bg-amber-500/5', border: 'border-amber-500/20', text: 'text-amber-400', iconBg: 'bg-amber-500/20' },
    info: { bg: 'bg-blue-500/5', border: 'border-blue-500/20', text: 'text-blue-400', iconBg: 'bg-blue-500/20' },
    error: { bg: 'bg-red-500/5', border: 'border-red-500/20', text: 'text-red-400', iconBg: 'bg-red-500/20' },
    success: { bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-400', iconBg: 'bg-emerald-500/20' },
};

const typeIcons: Record<string, React.ReactNode> = {
    warning: <AlertTriangle className="w-4 h-4" />,
    info: <Info className="w-4 h-4" />,
    error: <XCircle className="w-4 h-4" />,
    success: <CheckCircle className="w-4 h-4" />,
};

// Translate Vietnamese to English
const translateAlert = (text: string): string => {
    const translations: Record<string, string> = {
        'đơn hàng Failed cần review': 'failed orders need review',
        'đơn hàng Pending chờ xử lý': 'pending orders to process',
        'users mới đăng ký hôm nay': 'new users today',
    };
    
    let result = text;
    Object.entries(translations).forEach(([vi, en]) => {
        result = result.replace(vi, en);
    });
    return result;
};

export default function AlertSection({ alerts, title = 'Action Required' }: AlertSectionProps) {
    if (!alerts || alerts.length === 0) return null;

    return (
        <div className="bg-[#111] border border-gray-800/60 rounded-xl p-4 md:p-5">
            <h3 className="text-sm font-medium text-gray-400 mb-3">{title}</h3>
            <div className="space-y-2">
                {alerts.map((alert, index) => {
                    const config = typeConfig[alert.type] || typeConfig.info;
                    const translatedText = translateAlert(alert.text);
                    
                    const content = (
                        <div
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${config.bg} ${config.border} ${config.text}
                                ${alert.link ? 'cursor-pointer hover:opacity-80 transition-all' : ''}`}
                        >
                            <div className={`p-1.5 rounded-md ${config.iconBg} flex-shrink-0`}>
                                {iconMap[alert.icon] || typeIcons[alert.type]}
                            </div>
                            <span className="text-sm flex-1">{translatedText}</span>
                            <span className="text-lg font-semibold tabular-nums">{alert.count}</span>
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
        </div>
    );
}
