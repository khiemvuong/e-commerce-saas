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
        // Simulate loading time for better UX
        setTimeout(() => {
            setIsLoadingDetails(false);
            setOpen(true);
        }, 300);
    };

    const handleProductClick = (e: React.MouseEvent) => {
        // Only show loading if not opening in new tab
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
            setIsNavigating(true);
        }
    };

    // Reset navigating state when component unmounts
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
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
            whileHover={{ y: -8 }}
            className="relative group"
        >
            <div className="w-full bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 relative hover:border-gray-300 hover:shadow-2xl transition-all duration-300">

                {/* Badges Container - Top Corners */}
                {isEvent && (
                    <div className="absolute top-2.5 left-2.5 z-10 bg-red-500 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1">
                        <Star size={12} fill='white' />
                        <span>Flash Sale</span>
                    </div>
                )}

                {product?.stock > 0 && product?.stock <= 5 && (
                    <div className="absolute top-2.5 right-2.5 z-10 bg-amber-500 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-sm">
                        {product?.stock} left
                    </div>
                )}

                {/* Out of Stock Overlay - Subtle */}
                {product?.stock === 0 && (
                    <div className="absolute inset-0 bg-gradient-to-b from-gray-900/60 to-gray-900/80 rounded-xl z-20 flex items-center justify-center">
                        <span className="text-white font-bold text-lg tracking-wide">OUT OF STOCK</span>
                    </div>
                )}

                {/* Image Section */}
                <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-gray-50 to-gray-100">
                    <Link href={`/product/${product?.slug}`} onClick={handleProductClick}>
                        <Image
                            src={product?.images?.[0]?.file_url || "https://bunchobagels.com/wp-content/uploads/2024/09/placeholder.jpg"}
                            alt={product?.title}
                            width={500}
                            height={500}
                            className="w-full h-[220px] object-scale-down group-hover:scale-110 transition-transform duration-500"
                        />
                    </Link>
                    <AddToCartButton
                        product={product}
                        variant="hover"
                        onOpenModal={handleOpenDetails}
                    />
                </div>

                {/* Action Buttons - Below Low Stock Badge or Top Right */}
                <div className={`absolute z-10 flex flex-col gap-2 right-3 ${product?.stock > 0 && product?.stock <= 5 ? 'top-12' : 'top-3'}`}>
                    <motion.button
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            isWishlisted
                                ? removeFromWishlist(product.id, user, location, deviceInfo)
                                : addToWishlist({ ...product, quantity: 1 }, user, location, deviceInfo);
                        }}
                        className="bg-white/95 backdrop-blur-md rounded-full p-2.5 shadow-lg hover:shadow-xl transition-all duration-200 ring-1 ring-gray-200/50"
                    >
                        <Heart
                            fill={isWishlisted ? "#ef4444" : "transparent"}
                            size={18}
                            stroke={isWishlisted ? "#ef4444" : "#6b7280"}
                            className="transition-colors"
                        />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleOpenDetails}
                        className="bg-white/95 backdrop-blur-md rounded-full p-2.5 shadow-lg hover:shadow-xl transition-all duration-200 ring-1 ring-gray-200/50"
                    >
                        <Eye size={18} className="text-gray-600" />
                    </motion.button>
                </div>

                {/* Content Section */}
                <div className="p-4">
                    <Link
                        href={`/product/${product?.slug}`}
                        onClick={handleProductClick}
                        className="block text-base font-bold text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors mb-3 leading-snug"
                    >
                        {product?.title}
                    </Link>

                    {/* Price & Sales Row */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                                ${product?.sale_price ? product?.sale_price.toFixed(2) : product?.regular_price.toFixed(2)}
                            </span>
                            {product?.sale_price && (
                                <span className="text-sm text-gray-400 line-through">
                                    ${product?.regular_price.toFixed(2)}
                                </span>
                            )}
                        </div>
                        <span className="text-xs text-gray-600 font-semibold bg-gray-100 px-2 py-1 rounded-full">
                            {formatSales(product?.totalSales || 0)} sold
                        </span>
                    </div>

                    {/* Rating */}
                    <div className="mb-3">
                        <Rating rating={product?.rating} />
                    </div>

                    {/* Event Timer */}
                    {!isEvent && !timeLeft && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                            <motion.div
                                animate={{ scale: [1, 1.02, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="bg-gradient-to-r from-blue-600 to-purple-600  text-white text-center py-2 px-3 rounded-xl shadow-lg"
                            >
                                <div className="text-sm font-bold tracking-wide">
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