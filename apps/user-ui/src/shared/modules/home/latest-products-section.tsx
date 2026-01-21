"use client";
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Clock } from 'lucide-react';
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
                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/30">
                            <Clock className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 tracking-tight">
                                New Arrivals
                            </h2>
                            <p className="text-gray-500 text-sm md:text-base mt-1">
                                Fresh products just added to our collection
                            </p>
                        </div>
                    </div>
                    <Link 
                        href="/products?sort=latest"
                        className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-full shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/40 transition-all duration-300 hover:scale-105"
                    >
                        <span>Shop New</span>
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
                            className="h-[320px] bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl animate-pulse"
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
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: index * 0.03 }}
                            className="relative"
                        >
                            {/* New Badge */}
                            <div className="absolute -top-2 -right-2 z-20 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md">
                                NEW
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
