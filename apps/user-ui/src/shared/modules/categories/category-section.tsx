"use client";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";

interface Category {
    name: string;
    image: string | null;
    productCount: number;
}

const CategorySection = () => {
    const { data, isLoading } = useQuery({
        queryKey: ["categories-with-images"],
        queryFn: async () => {
            const res = await axiosInstance.get("/product/api/get-categories-with-images");
            return res.data.categories as Category[];
        },
        staleTime: 60 * 60 * 1000,
    });

    const categories = data || [];
    const displayCategories = categories.slice(0, 8);

    if (isLoading) {
        return (
            <div className="py-20 md:py-24">
                <div className="mb-12">
                    <div className="h-10 w-64 bg-gray-800/50 rounded-lg animate-pulse mb-3"></div>
                    <div className="h-6 w-80 bg-gray-800/30 rounded-lg animate-pulse"></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 auto-rows-[200px] md:auto-rows-[260px]">
                    {[...Array(8)].map((_, i) => (
                        <div
                            key={i}
                            className={`bg-gradient-to-br from-gray-800/50 to-gray-900/50 animate-pulse rounded-2xl border border-gray-800/50 ${
                                i === 0 ? 'md:col-span-2 md:row-span-2' :
                                i === 3 ? 'md:row-span-2' :
                                i === 5 ? 'md:col-span-2' : ''
                            }`}
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (displayCategories.length === 0) return null;

    const getCardClasses = (index: number, totalCount: number) => {
        if (totalCount <= 4) {
            if (index === 0) return 'md:col-span-2';
            return '';
        }
        
        switch(index) {
            case 0: return 'md:col-span-2 md:row-span-2';
            case 3: return 'md:row-span-2';
            case 5: return 'md:col-span-2';
            default: return '';
        }
    };

    return (
        <section className="py-20 md:py-24 relative overflow-hidden">
            {/* Subtle background accent */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#C9A86C]/5 rounded-full blur-3xl pointer-events-none" />
            
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="mb-14 relative"
            >
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-12 h-[2px] bg-gradient-to-r from-[#C9A86C] to-transparent" />
                            <span className="text-[#C9A86C] text-sm font-medium tracking-wider uppercase">
                                Collections
                            </span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">
                            Shop by Category
                        </h2>
                        <p className="text-lg text-gray-500 mt-3 max-w-xl">
                            Explore our curated categories for premium lifestyle products
                        </p>
                    </div>
                    
                    {categories.length > 8 && (
                        <Link
                            href="/products"
                            className="group inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-full hover:bg-gray-800 transition-all duration-300 cursor-pointer"
                        >
                            <span>View All</span>
                            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </Link>
                    )}
                </div>
            </motion.div>

            {/* Asymmetric Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 auto-rows-[200px] md:auto-rows-[260px] relative">
                {displayCategories.map((category, index) => {
                    const categoryUrl = `/products?categories=${encodeURIComponent(category.name)}`;
                    const cardClasses = getCardClasses(index, displayCategories.length);
                    const isFeatured = index === 0 && displayCategories.length > 4;

                    return (
                        <motion.div
                            key={category.name}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.05 }}
                        >
                            <Link
                                href={categoryUrl}
                                className={`group relative block h-full overflow-hidden rounded-2xl md:rounded-3xl cursor-pointer ${cardClasses}`}
                            >
                                {/* Background Image */}
                                <div className="absolute inset-0">
                                    {category.image ? (
                                        <img
                                            src={category.image}
                                            alt={category.name}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-gray-800 via-gray-900 to-black" />
                                    )}
                                </div>

                                {/* Overlay gradients */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 group-hover:from-black/95 group-hover:via-black/50 transition-all duration-500" />
                                
                                {/* Shine effect on hover */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-x-[-100%] group-hover:translate-x-[100%]" />

                                {/* Border accent */}
                                <div className="absolute inset-0 border border-white/0 group-hover:border-[#C9A86C]/30 rounded-2xl md:rounded-3xl transition-all duration-500" />

                                {/* Content */}
                                <div className="absolute inset-0 p-5 md:p-6 flex flex-col justify-end">
                                    <div className="transform transition-transform duration-500 group-hover:-translate-y-1">
                                        <h3 className={`text-white font-bold mb-2 line-clamp-2 ${
                                            isFeatured ? 'text-2xl md:text-4xl' : 'text-lg md:text-xl'
                                        }`}>
                                            {category.name}
                                        </h3>
                                        <div className="flex items-center gap-3">
                                            <span className="text-gray-300 text-sm md:text-base font-medium">
                                                {category.productCount} {category.productCount === 1 ? 'Product' : 'Products'}
                                            </span>
                                            <div className="w-6 h-6 rounded-full bg-[#C9A86C]/20 flex items-center justify-center group-hover:bg-[#C9A86C]/40 transition-colors">
                                                <ArrowUpRight className="w-3 h-3 text-[#C9A86C] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Featured badge */}
                                {isFeatured && (
                                    <div className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 bg-[#C9A86C]/20 backdrop-blur-md rounded-full border border-[#C9A86C]/30">
                                        <Sparkles className="w-4 h-4 text-[#C9A86C]" />
                                        <span className="text-[#C9A86C] text-xs font-semibold uppercase tracking-wider">Featured</span>
                                    </div>
                                )}
                            </Link>
                        </motion.div>
                    );
                })}
            </div>
        </section>
    );
};

export default CategorySection;
