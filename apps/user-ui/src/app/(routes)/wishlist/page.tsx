'use client';
import React from 'react'
import useLocationTracking from 'apps/user-ui/src/hooks/useLocationTracking';
import useDeviceTracking from 'apps/user-ui/src/hooks/useDeviceTracking';
import {useStore} from 'apps/user-ui/src/store';
import Link from 'next/link';
import Image from 'next/image';
import {   Clock, Trash2, ShoppingBag, X } from 'lucide-react';
import toast from 'react-hot-toast';
import AddToCartButton from 'apps/user-ui/src/shared/components/buttons/add-to-cart-button';
import useRequiredAuth from 'apps/user-ui/src/hooks/useRequiredAuth';

const WishlistPage = () => {
    const {user} = useRequiredAuth();
    const location = useLocationTracking();
    const deviceInfo = useDeviceTracking();
    const addToCart = useStore((state:any) => state.addToCart);
    const removeFromWishlist = useStore((state:any) => state.removeFromWishlist);
    const wishlist = useStore((state:any) => state.wishlist);
    const clearWishlist = useStore((state:any) => state.clearWishlist);
    const removeItem = (id:string) => {
        removeFromWishlist(id,user,location,deviceInfo);
    }

  return (
    <div className="w-full bg-white">
        <div className="md:w-[80%] w-[95%] mx-auto min-h-screen">
            {/*Breadcrumbs*/}
            <div className="pb-[50px]">
                <div className="flex items-center justify-between mt-2 mb-4">
                    <h1 className='mt-2 md:pt-p[50px] font-medium text-[44px] leading-[1] mb-[16px] font-poppins'>Wishlist ({wishlist.length})</h1>
                </div>
                <Link
                    href={'/'}
                    className='text-[16px] text-gray-500 hover:underline'>
                    Home
                </Link>
                <span className='inline-block p-[1.5px] mx-1 bg-[#a8acbo] rounded-full'>
                    .
                </span>
                <span className='text-[16px] text-gray-500'> 
                    Wishlist
                </span>
            </div>
            {/*If wishlist is empty*/}
            {wishlist.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[300px]">
                    <h2 className="text-2xl font-semibold mb-4">Your wishlist is empty</h2>
                    <p className="text-gray-600 mb-6">Browse products and add them to your wishlist.</p>
                    <Link 
                    href="/products"
                    className="px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition">
                        Shop Now
                    </Link>
                    </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-10">
                            {wishlist.map((item: any) => (
                                <div key={item.id} className="bg-white  overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                    {/* Delete Button */}
                                    <div className="relative">
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="absolute top-2 right-2 z-10 bg-white rounded-full p-2 shadow-md hover:bg-red-50 transition-colors"
                                            title="Remove from wishlist"
                                        >
                                            <Trash2 size={18} className="text-gray-600 hover:text-red-600" />
                                        </button>

                                        {/* Product Image with Hover Effect */}
                                        <Link href={`/product/${item.slug}`}>
                                            <div className="relative group overflow-hidden rounded-t-lg">
                                                {/* Limited Stock Badge - Modern Design */}
                                                {item?.stock <= 5 && item?.stock > 0 && (
                                                    <div className="absolute top-3 left-3 z-10">
                                                        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-pulse">
                                                            <Clock size={14} className="animate-none" />
                                                            <span>Only {item.stock} left</span>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {/* Out of Stock Badge */}
                                                {item?.stock === 0 && (
                                                    <div className="absolute top-3 left-3 z-10">
                                                        <div className="bg-gray-800 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
                                                            Out of Stock
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                <Image
                                                    src={item?.images?.[0]?.file_url || "https://bunchobagels.com/wp-content/uploads/2024/09/placeholder.jpg"}
                                                    alt={item?.title || "Product"}
                                                    width={400}
                                                    height={400}
                                                    className="w-full h-[200px] object-scale-down group-hover:scale-105 transition-transform duration-300 bg-gray-100"
                                                />
                                                {/* Add to Cart Button Component */}
                                                <AddToCartButton product={item} variant="hover" />
                                            </div>
                                        </Link>
                                    </div>

                                    {/* Product Info */}
                                    <div className="p-4">
                                        <Link href={`/product/${item.slug}`}>
                                            <span className="block text-lg text-gray-900 font-semibold truncate hover:text-gray-700 transition-colors">
                                                {item?.title}
                                            </span>
                                        </Link>
                                        
                                        <div className="mt-2 flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg font-medium text-red-600">
                                                    ${item?.sale_price ? item?.sale_price.toFixed(2) : item?.regular_price.toFixed(2)}
                                                </span>
                                                {item?.sale_price && (
                                                    <span className="text-sm text-gray-500 line-through">
                                                        ${item?.regular_price.toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                }
            </div>
            
        </div>
        
    )
}

export default WishlistPage