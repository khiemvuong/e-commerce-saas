"use client";
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Flame, ArrowUpRight } from 'lucide-react';
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
        <section className="py-16 md:py-20 relative overflow-hidden rounded-3xl">
            {/* Luxury Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-3xl -z-10" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,168,108,0.08),transparent_70%)] -z-10" />
            
            {/* Animated particles */}
            <div className="absolute inset-0 overflow-hidden">
                {[...Array(5)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-[#C9A86C]/30 rounded-full"
                        style={{
                            left: `${20 + i * 15}%`,
                            top: `${10 + i * 20}%`,
                        }}
                        animate={{
                            y: [0, -30, 0],
                            opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{
                            duration: 3 + i,
                            repeat: Infinity,
                            delay: i * 0.5,
                        }}
                    />
                ))}
            </div>

            <div className="relative z-10 mx-2">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="mb-10 md:mb-14"
                >
                    <div className="ml-2 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className="w-12 h-12 bg-gradient-to-br from-[#C9A86C] to-[#8B6914] rounded-xl flex items-center justify-center shadow-lg shadow-[#C9A86C]/20"
                                >
                                    <Flame className="w-6 h-6 text-white" />
                                </motion.div>
                                <div className="flex items-center gap-2">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C9A86C] opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C9A86C]"></span>
                                    </span>
                                    <span className="text-[#C9A86C] text-sm font-semibold tracking-wider uppercase">
                                        Live Now
                                    </span>
                                </div>
                            </div>
                            <h2 className="text-3xl md:text-5xl font-bold text-black tracking-tight">
                                Flash Sales
                            </h2>
                            <p className="text-gray-400 text-base md:text-lg mt-3 max-w-lg">
                                Exclusive limited-time offers. Act fast before they're gone.
                            </p>
                        </div>

                        <Link
                            href="/products?sale=true"
                            className="group inline-flex items-center gap-2 px-6 py-3 bg-[#C9A86C] text-black font-semibold rounded-full hover:bg-[#E8D5B5] transition-all duration-300 cursor-pointer"
                        >
                            <span>View All Sales</span>
                            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </Link>
                    </div>
                </motion.div>

                {/* Products Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
                        {Array.from({ length: 10 }).map((_, index) => (
                            <div
                                key={index}
                                className="h-[350px] bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl animate-pulse border border-gray-800/50"
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
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: index * 0.03 }}
                            >
                                <ProductCard product={product} isEvent={true} />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </section>
    );
};

export default FlashSaleSection;
