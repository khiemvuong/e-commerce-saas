"use client";
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Store, ArrowUpRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from 'apps/user-ui/src/utils/axiosInstance';
import ShopCard from '../../components/cards/shop.card';

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
    sellers?: {
        id: string;
        name: string;
        country?: string;
    };
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

    if (!isLoading && shops.length === 0) return null;

    return (
        <section className="py-16 md:py-20 px-6 md:px-12 relative overflow-hidden rounded-3xl">
            {/* Luxury Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-[#0f0f0f] to-gray-900 rounded-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(201,168,108,0.08),transparent_70%)]" />
            
            {/* Decorative elements */}
            <div className="absolute top-10 left-10 w-32 h-32 border border-[#C9A86C]/10 rounded-full" />
            <div className="absolute bottom-10 right-10 w-48 h-48 border border-[#C9A86C]/10 rounded-full" />

            <div className="relative z-10">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="mb-10 md:mb-14"
                >
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-[#C9A86C] to-[#8B6914] rounded-xl flex items-center justify-center shadow-lg shadow-[#C9A86C]/20">
                                    <Store className="w-6 h-6 text-white" />
                                </div>
                                <div className="w-12 h-[2px] bg-gradient-to-r from-[#C9A86C] to-transparent" />
                            </div>
                            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
                                Top Shops
                            </h2>
                            <p className="text-gray-400 text-base md:text-lg mt-3 max-w-lg">
                                Verified sellers with exceptional products and service
                            </p>
                        </div>

                        <Link
                            href="/shops"
                            className="group inline-flex items-center gap-2 px-6 py-3 bg-[#C9A86C] text-black font-semibold rounded-full hover:bg-[#E8D5B5] transition-all duration-300 cursor-pointer"
                        >
                            <span>View All Shops</span>
                            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </Link>
                    </div>
                </motion.div>

                {/* Shops Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div
                                key={index}
                                className="h-[380px] bg-white/5 backdrop-blur-sm rounded-2xl animate-pulse border border-white/10"
                            />
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-fr"
                    >
                        {shops.map((shop, index) => (
                            <ShopCard key={shop.id} shop={shop} variant="dark" />
                        ))}
                    </motion.div>
                )}
            </div>
        </section>
    );
};

export default TopShopsSection;
