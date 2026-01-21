"use client";
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ArrowUpRight, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from 'apps/user-ui/src/utils/axiosInstance';
import ProductCard from '../../components/cards/product-card';

const FeaturedSection = () => {
    const { data, isLoading } = useQuery({
        queryKey: ['featured-products'],
        queryFn: async () => {
            const res = await axiosInstance.get('/product/api/featured-products?limit=8');
            return res.data.products;
        },
        staleTime: 5 * 60 * 1000,
    });

    const products = data || [];

    if (!isLoading && products.length === 0) return null;

    return (
        <section className="py-16 md:py-20 relative overflow-hidden">
            {/* Elegant Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-[#C9A86C]/5 -z-10" />
            <div className="absolute top-20 left-20 w-96 h-96 bg-[#C9A86C]/5 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-20 right-20 w-80 h-80 bg-[#C9A86C]/5 rounded-full blur-3xl -z-10" />

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
                                <div className="relative w-12 h-12 bg-gradient-to-br from-[#C9A86C]/20 to-[#C9A86C]/5 rounded-xl flex items-center justify-center border border-[#C9A86C]/20">
                                    <Sparkles className="w-6 h-6 text-[#C9A86C]" />
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#C9A86C] rounded-full flex items-center justify-center">
                                        <Star className="w-2.5 h-2.5 text-white" fill="currentColor" />
                                    </div>
                                </div>
                                <span className="text-[#C9A86C] text-sm font-medium tracking-wider uppercase">
                                    Editor's Pick
                                </span>
                            </div>
                            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">
                                Featured Products
                            </h2>
                            <p className="text-gray-500 text-base md:text-lg mt-3 max-w-lg">
                                Hand-picked premium products rated 4.5+ stars by our customers
                            </p>
                        </div>

                        <Link
                            href="/products?sort=rating"
                            className="group inline-flex items-center gap-2 px-6 py-3 bg-[#C9A86C] text-black font-semibold rounded-full hover:bg-[#B8956A] transition-all duration-300 cursor-pointer"
                        >
                            <span>Explore All</span>
                            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </Link>
                    </div>
                </motion.div>

                {/* Products Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
                        {Array.from({ length: 8 }).map((_, index) => (
                            <div
                                key={index}
                                className="h-[350px] bg-white/60 backdrop-blur-sm rounded-2xl animate-pulse border border-[#C9A86C]/10"
                            />
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6"
                    >
                        {products.map((product: any, index: number) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: index * 0.05 }}
                            >
                                <ProductCard product={product} />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </section>
    );
};

export default FeaturedSection;
