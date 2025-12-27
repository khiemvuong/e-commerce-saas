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
            transition={{ duration: 0.5, delay: 0.5 }}
            whileHover={{ y: -8 }}
            className="relative group"
        >
            <div className="w-full bg-white rounded-2xl border-2 border-purple-200 relative hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-200/50 transition-all duration-300">

                {/* Badges Container - Top Corners */}
                {isEvent && (
                    <div className="absolute top-2.5 left-2.5 z-10 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-lg flex items-center gap-1">
                        <Star size={12} fill='white' />
                        <span>Flash Sale</span>
                    </div>
                )}

                {product?.stock > 0 && product?.stock <= 5 && (
                    <div className="absolute top-2.5 right-2.5 z-10 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-lg">
                        {product?.stock} left
                    </div>
                )}

                {/* Out of Stock Overlay */}
                {product?.stock === 0 && (
                    <div className="absolute inset-0 bg-gradient-to-b from-gray-800/70 to-gray-900/80 rounded-2xl z-20 flex items-center justify-center backdrop-blur-sm">
                        <span className="text-white font-bold text-lg tracking-wide bg-red-500/90 px-4 py-2 rounded-xl">OUT OF STOCK</span>
                    </div>
                )}

                {/* Image Section */}
                <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
                    <Link href={`/product/${product?.slug}`} onClick={handleProductClick}>
                        <Image
                            src={product?.images?.[0]?.file_url || "https://bunchobagels.com/wp-content/uploads/2024/09/placeholder.jpg"}
                            alt={product?.title}
                            width={500}
                            height={500}
                            className="w-full h-auto object-scale-down group-hover:scale-110 transition-transform duration-500"
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
                        className="bg-white rounded-full p-2.5 shadow-lg hover:shadow-xl transition-all duration-200 ring-2 ring-purple-200 hover:ring-purple-400"
                    >
                        <Heart
                            fill={isWishlisted ? "#ec4899" : "transparent"}
                            size={18}
                            stroke={isWishlisted ? "#ec4899" : "#a855f7"}
                            className="transition-colors"
                        />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleOpenDetails}
                        className="bg-white rounded-full p-2.5 shadow-lg hover:shadow-xl transition-all duration-200 ring-2 ring-purple-200 hover:ring-purple-400"
                    >
                        <Eye size={18} className="text-purple-600" />
                    </motion.button>
                </div>

                {/* Content Section */}
                <div className="p-4">
                    <Link
                        href={`/product/${product?.slug}`}
                        onClick={handleProductClick}
                        className="text-base font-bold text-gray-900 line-clamp-2 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 transition-all mb-3 leading-snug"
                    >
                        {product?.title}
                    </Link>

                    {/* Price & Sales Row */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
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
                    {isEvent && timeLeft && (
                        <div className="mt-3 pt-3 border-t border-purple-200">
                            <motion.div
                                animate={{ scale: [1, 1.02, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center py-2 px-3 rounded-xl shadow-lg"
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