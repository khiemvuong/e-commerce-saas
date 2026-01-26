'use client';
import React from 'react'
import {useStore} from 'apps/user-ui/src/store';
import Link from 'next/link';
import ProductCard from 'apps/user-ui/src/shared/components/cards/product-card';

const WishlistPage = () => {
    const wishlist = useStore((state:any) => state.wishlist);

    return (
        <div className="w-full bg-white">
            <div className="md:w-[80%] w-[95%] mx-auto min-h-screen">
                {/* Breadcrumbs */}
                <div className="pb-[50px]">
                    <div className="flex items-center justify-between mt-2 mb-4">
                        <h1 className='mt-2 md:pt-p[50px] font-medium text-[44px] leading-[1] mb-[16px] font-poppins'>
                            Wishlist ({wishlist.length})
                        </h1>
                    </div>
                    <Link href={'/'} className='text-[16px] text-gray-500 hover:underline'>
                        Home
                    </Link>
                    <span className='inline-block p-[1.5px] mx-1 bg-[#a8acbo] rounded-full'>.</span>
                    <span className='text-[16px] text-gray-500'>Wishlist</span>
                </div>

                {/* Empty State */}
                {wishlist.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[300px]">
                        <h2 className="text-2xl font-semibold mb-4">Your wishlist is empty</h2>
                        <p className="text-gray-600 mb-6">Browse products and add them to your wishlist.</p>
                        <Link 
                            href="/products"
                            className="px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition"
                        >
                            Shop Now
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 pb-10">
                        {wishlist.map((item: any) => (
                            <ProductCard key={item.id} product={item} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default WishlistPage