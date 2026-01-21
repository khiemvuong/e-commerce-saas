"use client";
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Crown, ArrowUpRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from 'apps/user-ui/src/utils/axiosInstance';
import ProductCard from '../../components/cards/product-card';

const BestSellersSection = () => {
    const { data, isLoading } = useQuery({
        queryKey: ['best-sellers'],
        queryFn: async () => {
            const res = await axiosInstance.get('/product/api/best-sellers?limit=8');
            return res.data.products;
        },
        staleTime: 5 * 60 * 1000,
    });

    const products = data || [];

    if (!isLoading && products.length === 0) return null;

    return (
        <section className="py-16 md:py-20 relative">
            {/* Subtle accent */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#C9A86C]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

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
                            <div className="w-12 h-12 bg-gradient-to-br from-[#C9A86C]/20 to-[#C9A86C]/5 rounded-xl flex items-center justify-center border border-[#C9A86C]/20">
                                <Crown className="w-6 h-6 text-[#C9A86C]" />
                            </div>
                            <div className="w-12 h-[2px] bg-gradient-to-r from-[#C9A86C] to-transparent" />
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">
                            Best Sellers
                        </h2>
                        <p className="text-gray-500 text-base md:text-lg mt-3 max-w-lg">
                            Our most popular products, loved by thousands of customers
                        </p>
                    </div>

                    <Link
                        href="/products?sort=best-selling"
                        className="group inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-full hover:bg-gray-800 transition-all duration-300 cursor-pointer"
                    >
                        <span>View All</span>
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
                            className="h-[350px] bg-gradient-to-br from-[#C9A86C]/5 to-gray-100 rounded-2xl animate-pulse"
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
                            className="relative"
                        >
                            {/* Best Seller Rank Badge for top 3 */}
                            {index < 3 && (
                                <div className="absolute -top-2 -left-2 z-20 w-8 h-8 bg-gradient-to-br from-[#C9A86C] to-[#8B6914] rounded-full flex items-center justify-center shadow-lg">
                                    <span className="text-white text-xs font-bold">#{index + 1}</span>
                                </div>
                            )}
                            <ProductCard product={product} />
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </section>
    );
};

export default BestSellersSection;
