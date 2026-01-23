/**
 * Page Header Component
 * Luxury styled header for listing pages with gold gradient
 */

"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    Icon?: LucideIcon;
    badge?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, Icon, badge }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative bg-[#070707] rounded-3xl mb-8 overflow-hidden"
        >
            {/* Background effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(201,168,108,0.15),transparent_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(201,168,108,0.10),transparent_70%)]" />
            
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-48 h-48 border border-[#C9A86C]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 border border-[#C9A86C]/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            {/* Border accent */}
            <div className="absolute inset-0 border border-[#C9A86C]/20 rounded-3xl pointer-events-none" />

            <div className="relative z-10 px-6 py-10 md:px-12 md:py-14">
                <div className="flex flex-col md:flex-row items-center md:items-end gap-4">
                    {Icon && (
                        <div className="p-4 bg-[#C9A86C]/10 rounded-2xl border border-[#C9A86C]/20">
                            <Icon className="w-8 h-8 text-[#C9A86C]" />
                        </div>
                    )}
                    <div className="text-center md:text-left">
                        {badge && (
                            <span className="inline-block px-3 py-1 mb-3 text-xs font-semibold uppercase tracking-wider text-[#C9A86C] bg-[#C9A86C]/10 border border-[#C9A86C]/20 rounded-full">
                                {badge}
                            </span>
                        )}
                        <h1 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#C9A86C] via-[#E8D5B5] to-[#C9A86C]">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="mt-2 text-gray-400 text-lg">{subtitle}</p>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default PageHeader;
