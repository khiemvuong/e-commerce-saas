"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ArrowRight, Timer, Percent } from 'lucide-react';
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
        <section className="py-12 md:py-16 relative overflow-hidden">
            {/* Dark gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 -z-10" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(147,51,234,0.3),transparent_50%)] -z-10" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(236,72,153,0.2),transparent_50%)] -z-10" />

            <div className="relative z-10">
                {/* Section Header */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mb-8 md:mb-12"
                >
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <motion.div 
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-14 h-14 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/50"
                            >
                                <Zap className="w-8 h-8 text-white" fill="currentColor" />
                            </motion.div>
                            <div>
                                <h2 className="text-2xl md:text-4xl font-bold text-black tracking-tight flex items-center gap-3">
                                    Deals of the Day
                                    <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full animate-pulse">
                                        <Percent className="w-3 h-3 mr-1" /> HOT
                                    </span>
                                </h2>
                                <p className="text-gray-300 text-sm md:text-base mt-1">
                                    Limited time offers - Don&apos;t miss out!
                                </p>
                            </div>
                        </div>

                        {/* Countdown Timer */}
                        <div className="flex items-center gap-3">
                            <Timer className="w-5 h-5 text-yellow-400" />
                            <div className="flex gap-2">
                                {[
                                    { value: timeLeft.hours, label: 'HRS' },
                                    { value: timeLeft.minutes, label: 'MIN' },
                                    { value: timeLeft.seconds, label: 'SEC' },
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <div className="bg-gradient-to-b from-gray-700 to-gray-800 rounded-xl px-4 py-2 min-w-[60px] text-center border border-gray-600/50 shadow-lg">
                                            <AnimatePresence mode="wait">
                                                <motion.span
                                                    key={item.value}
                                                    initial={{ y: -10, opacity: 0 }}
                                                    animate={{ y: 0, opacity: 1 }}
                                                    exit={{ y: 10, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="text-2xl font-bold text-white tabular-nums"
                                                >
                                                    {String(item.value).padStart(2, '0')}
                                                </motion.span>
                                            </AnimatePresence>
                                            <p className="text-[10px] text-gray-400 mt-0.5">{item.label}</p>
                                        </div>
                                        {idx < 2 && <span className="text-2xl font-bold text-gray-500">:</span>}
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
                                className="h-[320px] bg-gradient-to-br from-gray-800/50 to-gray-700/30 backdrop-blur-sm rounded-2xl animate-pulse border border-gray-700/50"
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
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                className="relative"
                            >
                                {/* Discount Badge */}
                                {product.discountPercentage > 0 && (
                                    <div className="absolute -top-2 -left-2 z-20 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
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
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="mt-8 text-center"
                >
                    <Link 
                        href="/products?sort=discount"
                        className="group inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white font-bold rounded-full shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105"
                    >
                        <span>View All Deals</span>
                        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                </motion.div>
            </div>
        </section>
    );
};

export default DealsOfTheDaySection;
