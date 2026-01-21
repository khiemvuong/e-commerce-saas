"use client";
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from 'apps/user-ui/src/utils/axiosInstance';
import ProductCard from '../../components/cards/product-card';

const LatestProductsSection = () => {
    const { data, isLoading } = useQuery({
        queryKey: ['latest-products'],
        queryFn: async () => {
            const res = await axiosInstance.get('/product/api/get-all-products?page=1&limit=10&type=latest');
            return res.data.products;
        },
        staleTime: 2 * 60 * 1000,
    });

    const products = data || [];

    if (!isLoading && products.length === 0) return null;

    return (
        <section className="py-16 md:py-20 relative overflow-hidden">
            {/* Subtle accent */}
            <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-emerald-50 to-transparent rounded-full blur-3xl opacity-60 pointer-events-none -z-10" />

            {/* Section Header */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="mb-10 md:mb-14 relative"
            >
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <motion.div
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                className="w-12 h-12 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20"
                            >
                                <Sparkles className="w-6 h-6 text-emerald-600" />
                            </motion.div>
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-emerald-600 text-sm font-semibold tracking-wider uppercase">
                                    Just In
                                </span>
                            </div>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">
                            New Arrivals
                        </h2>
                        <p className="text-gray-500 text-base md:text-lg mt-3 max-w-lg">
                            Fresh additions to our collection. Be the first to discover.
                        </p>
                    </div>

                    <Link
                        href="/products?sort=latest"
                        className="group inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-full hover:bg-emerald-700 transition-all duration-300 cursor-pointer"
                    >
                        <span>Shop New</span>
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
                            className="h-[350px] bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl animate-pulse"
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
                    {products.map((product: any, index: number) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: index * 0.03 }}
                            className="relative"
                        >
                            {/* New Badge */}
                            <div className="absolute -top-2 -right-2 z-20 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wider">
                                New
                            </div>
                            <ProductCard product={product} />
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </section>
    );
};

export default LatestProductsSection;
