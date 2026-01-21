"use client";
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight, Star, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from 'apps/user-ui/src/utils/axiosInstance';
import Image from 'next/image';

interface ShopImage {
    file_url: string;
    type: string;
}

interface Shop {
    id: string;
    name: string;
    bio: string | null;
    address: string;
    rating: number;
    category: string;
    followers: string[];
    images: ShopImage[];
    _count: {
        products: number;
    };
    totalSales: number;
}

const TopShopsSection = () => {
    const { data, isLoading } = useQuery({
        queryKey: ['top-shops'],
        queryFn: async () => {
            const res = await axiosInstance.get('/product/api/top-shops');
            return res.data.shops;
        },
        staleTime: 5 * 60 * 1000,
    });

    const shops: Shop[] = data || [];

    // Helper function to get avatar from images array
    const getAvatar = (images: ShopImage[]) => {
        const avatar = images?.find(img => img.type === 'avatar');
        return avatar?.file_url || null;
    };

    if (!isLoading && shops.length === 0) return null;

    return (
        <section className="py-12 md:py-16 relative overflow-hidden">
            {/* Background - Neutral warm gradient that works with any avatar color */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-slate-50 to-zinc-100 -z-10" />
            <div className="absolute top-10 left-10 w-72 h-72 bg-gray-200/30 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-slate-200/30 rounded-full blur-3xl -z-10" />

            <div className="relative z-10">
                {/* Section Header */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mb-8 md:mb-12"
                >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                <ShoppingBag className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl md:text-4xl font-bold text-gray-900 tracking-tight">
                                    Top Shops
                                </h2>
                                <p className="text-gray-500 text-sm md:text-base mt-1">
                                    Trusted sellers with quality products
                                </p>
                            </div>
                        </div>
                        <Link 
                            href="/shops"
                            className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-full shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105"
                        >
                            <span>All Shops</span>
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                </motion.div>

                {/* Shops Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div
                                key={index}
                                className="h-[280px] bg-white/80 backdrop-blur-sm rounded-3xl animate-pulse border border-white shadow-lg"
                            />
                        ))}
                    </div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                    >
                        {shops.map((shop, index) => {
                            const avatarUrl = getAvatar(shop.images);
                            
                            return (
                                <motion.div
                                    key={shop.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                >
                                    <Link href={`/shop/${shop.id}`}>
                                        <div className="group relative bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/80 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden">
                                            {/* Glass effect overlay on hover */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                            
                                            {/* Avatar */}
                                            <div className="relative flex justify-center mb-4">
                                                <div className="relative">
                                                    {/* White frame with subtle shadow - works with any avatar color */}
                                                    <div className="w-24 h-24 rounded-full bg-white p-1.5 shadow-lg ring-1 ring-gray-100">
                                                        {avatarUrl ? (
                                                            <Image
                                                                src={avatarUrl}
                                                                alt={shop.name}
                                                                width={96}
                                                                height={96}
                                                                className="w-full h-full rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                                                <ShoppingBag className="w-10 h-10 text-gray-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    {/* Verified badge */}
                                                    <div className="absolute -bottom-0.5 -right-0.5 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md ring-2 ring-white">
                                                        <CheckCircle className="w-5 h-5 text-blue-500" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Shop Info */}
                                            <div className="text-center relative z-10">
                                                <h3 className="font-bold text-lg text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                                                    {shop.name}
                                                </h3>
                                                
                                                {/* Rating */}
                                                <div className="flex items-center justify-center gap-1 mt-2">
                                                    <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                                                    <span className="text-sm font-semibold text-gray-700">
                                                        {shop.rating?.toFixed(1) || '5.0'}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        • {shop._count?.products || 0} products
                                                    </span>
                                                </div>

                                                {/* Description (bio) */}
                                                <p className="text-sm text-gray-500 mt-3 line-clamp-2 min-h-[40px]">
                                                    {shop.bio || 'Quality products and excellent service'}
                                                </p>

                                                {/* Visit Button */}
                                                <button className="mt-4 w-full py-2.5 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 font-semibold rounded-xl group-hover:from-indigo-500 group-hover:to-purple-500 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-md">
                                                    Visit Store
                                                </button>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </div>
        </section>
    );
};

export default TopShopsSection;
