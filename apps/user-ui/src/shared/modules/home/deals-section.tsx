"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ArrowUpRight, Timer } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from 'apps/user-ui/src/utils/axiosInstance';
import ProductCard from '../../components/cards/product-card';

const DealsOfTheDaySection = () => {
    const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

    const { data, isLoading } = useQuery({
        queryKey: ['deals-of-the-day'],
        queryFn: async () => {
            const res = await axiosInstance.get('/product/api/deals-of-the-day?limit=6');
            return res.data.products;
        },
        staleTime: 5 * 60 * 1000,
    });

    const products = data || [];

    // Daily countdown timer - resets at midnight
    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const midnight = new Date(now);
            midnight.setHours(24, 0, 0, 0);
            const diff = midnight.getTime() - now.getTime();

            return {
                hours: Math.floor(diff / (1000 * 60 * 60)),
                minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((diff % (1000 * 60)) / 1000),
            };
        };

        setTimeLeft(calculateTimeLeft());
        const interval = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    if (!isLoading && products.length === 0) return null;

    return (
        <section className="py-16 md:py-20 relative overflow-hidden rounded-3xl">
            {/* Premium Dark Background */}
            <div className="absolute inset-0 bg-[#070707] -z-10" />
            
            {/* Subtle patterns */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,168,108,0.08),transparent_70%)]" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#C9A86C]/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#C9A86C]/5 rounded-full blur-3xl" />
            </div>

            {/* Decorative border */}
            <div className="absolute inset-0 border border-[#C9A86C]/10 rounded-3xl pointer-events-none" />

            <div className="relative z-10 px-6 md:px-10">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="mb-10 md:mb-14"
                >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="flex items-center gap-5">
                            <motion.div
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-16 h-16 bg-gradient-to-br from-[#C9A86C] to-[#8B6914] rounded-2xl flex items-center justify-center shadow-lg shadow-[#C9A86C]/30"
                            >
                                <Zap className="w-8 h-8 text-white" fill="currentColor" />
                            </motion.div>
                            <div>
                                <h2 className="text-3xl md:text-5xl font-bold text-black tracking-tight">
                                    Deals of the Day
                                </h2>
                                <p className="text-gray-400 text-base md:text-lg mt-2">
                                    Exclusive discounts that refresh daily
                                </p>
                            </div>
                        </div>

                        {/* Countdown Timer */}
                        <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10">
                            <Timer className="w-5 h-5 text-[#C9A86C]" />
                            <span className="text-gray-400 text-sm font-medium">Ends in</span>
                            <div className="flex gap-2">
                                {[
                                    { value: timeLeft.hours, label: 'HRS' },
                                    { value: timeLeft.minutes, label: 'MIN' },
                                    { value: timeLeft.seconds, label: 'SEC' },
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <div className="bg-[#C9A86C]/10 rounded-xl px-3 py-2 min-w-[56px] text-center border border-[#C9A86C]/20">
                                            <AnimatePresence mode="wait">
                                                <motion.span
                                                    key={item.value}
                                                    initial={{ y: -8, opacity: 0 }}
                                                    animate={{ y: 0, opacity: 1 }}
                                                    exit={{ y: 8, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="text-xl font-bold text-[#C9A86C] tabular-nums block"
                                                >
                                                    {String(item.value).padStart(2, '0')}
                                                </motion.span>
                                            </AnimatePresence>
                                            <p className="text-[10px] text-gray-500 mt-0.5">{item.label}</p>
                                        </div>
                                        {idx < 2 && <span className="text-xl font-bold text-[#C9A86C]/50">:</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Products Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div
                                key={index}
                                className="h-[350px] bg-white/5 backdrop-blur-sm rounded-2xl animate-pulse border border-white/10"
                            />
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6"
                    >
                        {products.map((product: any, index: number) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: index * 0.05 }}
                                className="relative"
                            >
                                {/* Discount Badge */}
                                {product.discountPercentage > 0 && (
                                    <div className="absolute -top-2 -left-2 z-20 bg-gradient-to-r from-[#C9A86C] to-[#8B6914] text-black text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                                        -{product.discountPercentage}% OFF
                                    </div>
                                )}
                                <ProductCard product={product} />
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {/* View All Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="mt-10 text-center"
                >
                    <Link
                        href="/products?sort=discount"
                        className="group inline-flex items-center gap-2 px-8 py-4 bg-[#C9A86C] text-black font-semibold rounded-full hover:bg-[#E8D5B5] transition-all duration-300 shadow-lg shadow-[#C9A86C]/20 cursor-pointer"
                    >
                        <span>View All Deals</span>
                        <ArrowUpRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>
                </motion.div>
            </div>
        </section>
    );
};

export default DealsOfTheDaySection;
