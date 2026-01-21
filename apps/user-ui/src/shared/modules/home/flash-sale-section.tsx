"use client";
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from 'apps/user-ui/src/utils/axiosInstance';
import ProductCard from '../../components/cards/product-card';

const FlashSaleSection = () => {
    const { data, isLoading } = useQuery({
        queryKey: ['flash-sale-events'],
        queryFn: async () => {
            const res = await axiosInstance.get('/product/api/get-all-events?page=1&limit=10');
            return res.data.events;
        },
        staleTime: 2 * 60 * 1000,
    });

    const events = data || [];

    if (!isLoading && events.length === 0) return null;

    return (
        <section className="py-12 md:py-16">
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
                        <motion.div 
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="w-14 h-14 bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/30"
                        >
                            <Star className="w-7 h-7 text-white" fill="currentColor" />
                        </motion.div>
                        <div>
                            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                                Flash Sales
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                                </span>
                            </h2>
                            <p className="text-gray-500 text-sm md:text-base mt-1">
                                Limited time offers - Grab them before they&apos;re gone!
                            </p>
                        </div>
                    </div>
                    <Link 
                        href="/products?sale=true"
                        className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold rounded-full shadow-lg shadow-pink-500/25 hover:shadow-xl hover:shadow-pink-500/40 transition-all duration-300 hover:scale-105"
                    >
                        <span>All Sales</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>
            </motion.div>

            {/* Products Grid */}
            {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
                    {Array.from({ length: 10 }).map((_, index) => (
                        <div
                            key={index}
                            className="h-[320px] bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl animate-pulse"
                        />
                    ))}
                </div>
            ) : (
                <motion.div 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6"
                >
                    {events.map((product: any, index: number) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: index * 0.03 }}
                        >
                            <ProductCard product={product} isEvent={true} />
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </section>
    );
};

export default FlashSaleSection;
