"use client";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import Link from "next/link";

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
            <div className="py-16 md:py-20">
                <div className="mb-12">
                    <div className="h-10 w-64 bg-gray-200 rounded-lg animate-pulse mb-3"></div>
                    <div className="h-6 w-80 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 auto-rows-[200px] md:auto-rows-[240px]">
                    {[...Array(8)].map((_, i) => (
                        <div 
                            key={i} 
                            className={`bg-gray-200 animate-pulse rounded-2xl ${
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

    // Layout pattern for asymmetric grid - only apply special layouts when we have enough items
    const getCardClasses = (index: number, totalCount: number) => {
        // If we have less than 6 items, use simpler layout
        if (totalCount <= 4) {
            // For 4 or less items, only make first one featured
            if (index === 0) return 'md:col-span-2'; // Wide featured
            return ''; // All others regular
        }
        
        // Full asymmetric layout for 5+ items
        switch(index) {
            case 0: return 'md:col-span-2 md:row-span-2'; // Large featured
            case 3: return 'md:row-span-2'; // Tall
            case 5: return 'md:col-span-2'; // Wide
            default: return ''; // Regular
        }
    };

    return (
        <section className="py-16 md:py-20">
            {/* Header */}
            <div className="mb-12 space-y-3">
                <h2 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">
                    Shop by Category
                </h2>
                <p className="text-lg md:text-xl text-gray-600 max-w-2xl">
                    Discover curated collections designed for every lifestyle
                </p>
            </div>

            {/* Asymmetric Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 auto-rows-[200px] md:auto-rows-[240px]">
                {displayCategories.map((category, index) => {
                    const categoryUrl = `/products?categories=${encodeURIComponent(category.name)}`;
                    const cardClasses = getCardClasses(index, displayCategories.length);
                    
                    return (
                        <Link
                            key={category.name}
                            href={categoryUrl}
                            className={`group relative overflow-hidden rounded-3xl transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] ${cardClasses}`}
                        >
                            {/* Background Image with Parallax Effect */}
                            <div className="absolute inset-0 overflow-hidden">
                                {category.image ? (
                                    <img
                                        src={category.image}
                                        alt={category.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" />
                                )}
                            </div>
                            
                            {/* Gradient Overlay - Dynamic based on hover */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent 
                                group-hover:from-black/90 group-hover:via-black/50 transition-all duration-500" />
                            
                            {/* Accent Border on Hover */}
                            <div className="absolute inset-0 border-2 border-white/0 group-hover:border-white/20 
                                rounded-3xl transition-all duration-500" />
                            
                            {/* Content */}
                            <div className="absolute inset-0 p-5 md:p-6 flex flex-col justify-end">
                                <div className="transform transition-transform duration-500 group-hover:translate-y-[-4px]">
                                    <h3 className="text-white font-bold text-xl md:text-2xl mb-2 line-clamp-2 
                                        drop-shadow-lg">
                                        {category.name}
                                    </h3>
                                    <div className="flex items-center gap-2 text-white/90">
                                        <span className="text-sm md:text-base font-medium">
                                            {category.productCount} {category.productCount === 1 ? 'item' : 'items'}
                                        </span>
                                        <svg 
                                            className="w-5 h-5 transform transition-transform duration-500 group-hover:translate-x-1" 
                                            fill="none" 
                                            viewBox="0 0 24 24" 
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Top Corner Badge for Featured */}
                            {index === 0 && (
                                <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md 
                                    px-3 py-1.5 rounded-full border border-white/20">
                                    <span className="text-white text-xs font-semibold">Featured</span>
                                </div>
                            )}
                        </Link>
                    );
                })}
            </div>

            {/* View All Section */}
            {categories.length > 8 && (
                <div className="mt-10 text-center">
                    <Link 
                        href="/products"
                        className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-gray-900 to-gray-800 
                            text-white rounded-full font-semibold text-lg shadow-lg hover:shadow-2xl 
                            transform hover:scale-105 transition-all duration-300"
                    >
                        Explore All Categories
                        <svg 
                            className="w-5 h-5 transform transition-transform duration-300 group-hover:translate-x-1" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>
            )}
        </section>
    );
};

export default CategorySection;
