"use client";
import Link from 'next/link';
import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom';
import Rating from '../ratings';
import { Eye, Heart, Star } from 'lucide-react';
import ProductDetailsCard from './product-details.card';
import Image from 'next/image';
import { useStore } from 'apps/user-ui/src/store';
import useUser from 'apps/user-ui/src/hooks/useUser';
import useLocationTracking from 'apps/user-ui/src/hooks/useLocationTracking';
import useDeviceTracking from 'apps/user-ui/src/hooks/useDeviceTracking';
import AddToCartButton from '../buttons/add-to-cart-button';
import OverlayLoader from '../loading/page-loader';
import { motion } from 'framer-motion';
import { optimizeImageUrl, getBlurPlaceholder, IMAGE_PRESETS } from 'apps/user-ui/src/utils/imageOptimizer';

const ProductCard = ({ product, isEvent: isEventProp }: { product: any; isEvent?: boolean }) => {
    const isEvent = isEventProp ?? !!(product?.starting_date && product?.ending_date);

    const [timeLeft, setTimeLeft] = useState("")
    const [open, setOpen] = useState(false);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { user } = useUser();
    const location = useLocationTracking();
    const deviceInfo = useDeviceTracking();
    const addToWishlist = useStore((state: any) => state.addToWishlist);
    const removeFromWishlist = useStore((state: any) => state.removeFromWishlist);
    const wishlist = useStore((state: any) => state.wishlist);
    const isWishlisted = wishlist.some((item: any) => item.id === product.id);

    const formatSales = (sales: number) => {
        if (sales >= 1000) {
            return `${(sales / 1000).toFixed(1)}k`;
        }
        return sales.toString();
    };

    useEffect(() => {
        if (!isEvent || !product?.ending_date) return;

        const updateTimer = () => {
            const now = Date.now();
            const eventTime = new Date(product.ending_date).getTime();
            const diff = eventTime - now;

            if (diff <= 0) {
                setTimeLeft("Event ended");
                return false;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
            return true;
        };

        const shouldContinue = updateTimer();
        if (!shouldContinue) return;

        const interval = setInterval(() => {
            const shouldContinue = updateTimer();
            if (!shouldContinue) clearInterval(interval);
        }, 1000);

        return () => clearInterval(interval);
    }, [isEvent, product?.ending_date]);

    const handleOpenDetails = () => {
        setIsLoadingDetails(true);
        setTimeout(() => {
            setIsLoadingDetails(false);
            setOpen(true);
        }, 300);
    };

    const handleProductClick = (e: React.MouseEvent) => {
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
            setIsNavigating(true);
        }
    };

    useEffect(() => {
        return () => {
            setIsNavigating(false);
        };
    }, []);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ y: -6 }}
            className="relative group"
        >
            <div className="w-full rounded-2xl border border-gray-200 relative hover:border-[#C9A86C]/40 hover:shadow-xl hover:shadow-[#C9A86C]/10 transition-all duration-300">

                {/* Badges Container - Top Corners */}
                {isEvent && (
                    <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-[#C9A86C] to-[#8B6914] text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5">
                        <Star size={12} fill='white' />
                        <span>Flash Sale</span>
                    </div>
                )}

                {product?.stock > 0 && product?.stock <= 5 && (
                    <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg shadow-lg">
                        {product?.stock} left
                    </div>
                )}

                {/* Out of Stock Overlay */}
                {product?.stock === 0 && (
                    <div className="absolute inset-0 bg-gradient-to-b from-gray-900/70 to-gray-900/80 rounded-2xl z-20 flex items-center justify-center backdrop-blur-sm">
                        <span className="text-white font-bold text-lg tracking-wide bg-gray-900/90 px-5 py-2.5 rounded-xl border border-gray-700">OUT OF STOCK</span>
                    </div>
                )}

                {/* Image Section */}
                <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-gray-50 to-gray-100 aspect-[765/850]">
                    <Link href={`/product/${product?.slug}`} onClick={handleProductClick} className="block w-full h-full cursor-pointer">
                        <Image
                            src={optimizeImageUrl(product?.images?.[0]?.file_url, IMAGE_PRESETS.cardThumbnail) || "https://bunchobagels.com/wp-content/uploads/2024/09/placeholder.jpg"}
                            alt={product?.title || 'Product image'}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            placeholder="blur"
                            blurDataURL={getBlurPlaceholder(product?.images?.[0]?.file_url) || "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEERAA="}
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    </Link>
                    <AddToCartButton
                        product={product}
                        variant="hover"
                        onOpenModal={handleOpenDetails}
                    />
                </div>

                {/* Action Buttons - Below Low Stock Badge or Top Right */}
                <div className={`absolute z-10 flex flex-col gap-2 right-3 ${product?.stock > 0 && product?.stock <= 5 ? 'top-14' : 'top-3'}`}>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            isWishlisted
                                ? removeFromWishlist(product.id, user, location, deviceInfo)
                                : addToWishlist({ ...product, quantity: 1 }, user, location, deviceInfo);
                        }}
                        className="bg-white rounded-full p-2.5 shadow-md hover:shadow-lg transition-all duration-200 border border-gray-100 hover:border-[#C9A86C]/30 cursor-pointer"
                    >
                        <Heart
                            fill={isWishlisted ? "#C9A86C" : "transparent"}
                            size={18}
                            stroke={isWishlisted ? "#C9A86C" : "#9ca3af"}
                            className="transition-colors"
                        />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleOpenDetails}
                        className="bg-white rounded-full p-2.5 shadow-md hover:shadow-lg transition-all duration-200 border border-gray-100 hover:border-[#C9A86C]/30 cursor-pointer"
                    >
                        <Eye size={18} className="text-gray-400 hover:text-[#C9A86C] transition-colors" />
                    </motion.button>
                </div>

                {/* Content Section */}
                <div className="p-4">
                    <Link
                        href={`/product/${product?.slug}`}
                        onClick={handleProductClick}
                        className="text-base font-semibold text-gray-900 line-clamp-2 hover:text-[#C9A86C] transition-colors mb-3 leading-snug cursor-pointer block truncate"
                    >
                        {product?.title}
                    </Link>

                    {/* Price & Sales Row */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-[#C9A86C]">
                                ${product?.sale_price ? product?.sale_price.toFixed(2) : product?.regular_price.toFixed(2)}
                            </span>
                            {product?.sale_price && (
                                <span className="text-sm text-gray-400 line-through">
                                    ${product?.regular_price.toFixed(2)}
                                </span>
                            )}
                        </div>
                        <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-full">
                            {formatSales(product?.totalSales || 0)} sold
                        </span>
                    </div>

                    {/* Rating */}
                    <div className="mb-3">
                        <Rating rating={product?.rating} />
                    </div>

                    {/* COD Badge */}
                    {product?.cash_on_delivery === 'yes' && (
                        <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium mb-3">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span>COD Available</span>
                        </div>
                    )}

                    {/* Event Timer */}
                    {isEvent && timeLeft && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                            <motion.div
                                animate={{ scale: [1, 1.01, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="bg-gradient-to-r from-[#C9A86C] to-[#8B6914] text-white text-center py-2.5 px-3 rounded-xl shadow-md"
                            >
                                <div className="flex items-center justify-center gap-2 text-sm font-semibold">
                                    {timeLeft === "Event ended" ? (
                                        <span>Event Ended</span>
                                    ) : (
                                        <span>Ends in: {timeLeft}</span>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </div>

                {open && (
                    <ProductDetailsCard data={product} setOpen={setOpen} />
                )}
            </div>
            {(isLoadingDetails || isNavigating) && mounted && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <OverlayLoader
                        text={isNavigating ? "Loading product..." : "Loading product details..."}
                    />
                </div>,
                document.body
            )}
        </motion.div>
    )
}

export default ProductCard