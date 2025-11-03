import Link from 'next/link';
import React, {  useEffect, useState } from 'react'
import Rating from '../ratings';
import { Eye, Heart } from 'lucide-react';
import ProductDetailsCard from './product-details.card';
import Image from 'next/image';
import { useStore } from 'apps/user-ui/src/store';
import useUser from 'apps/user-ui/src/hooks/useUser';
import useLocationTracking from 'apps/user-ui/src/hooks/useLocationTracking';
import useDeviceTracking from 'apps/user-ui/src/hooks/useDeviceTracking';
import AddToCartButton from '../buttons/add-to-cart-button';

const ProductCard = ({product,isEvent}:{product: any;isEvent?: boolean}) => {
  const [timeLeft, setTimeLeft] = useState("")
  const [open, setOpen] = useState(false);
  const{user} =useUser();
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();
  const addToWishlist = useStore((state:any) => state.addToWishlist);
  const removeFromWishlist = useStore((state:any) => state.removeFromWishlist);
  const wishlist = useStore((state:any) => state.wishlist);
  const isWishlisted = wishlist.some((item:any) => item.id === product.id);
  useEffect(() => {
    if (isEvent && product?.ending_date) {
      const interval = setInterval(() => {
        const now = Date.now();
        const eventTime = new Date(product.ending_date).getTime();
        const diff = eventTime - now;

        if (diff <= 0) {
          clearInterval(interval);
          setTimeLeft("Event ended");
          return;
        }
        const days= Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [isEvent, product?.ending_date]);
  return (
    <div className="w-full min-h-[350px] h-max bg-white rounded-lg relative">
        {isEvent &&(
            <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-semibold px-2 py-1 rounded-sm shadow-md">
                OFFER
            </div>
        )}
        {product?.stock <=5 &&(
            <div className="absolute top-2 right-2 bg-yellow-500 text-slate-700 text-[10px] font-semibold px-2 py-1 rounded-sm shadow-md">
                Limmited Stock
            </div>
        )}
        <div className="relative group overflow-hidden rounded-t-lg">
            <Link href={`/product/${product?.slug}`}>
                <Image
                src={product?.images?.[0]?.file_url || "https://bunchobagels.com/wp-content/uploads/2024/09/placeholder.jpg"}
                alt={product?.title}
                width={400}
                height={400}
                className="w-full h-[200px] object-scale-down group-hover:scale-105 transition-transform duration-300 bg-gray-100"
                />
            </Link>
            {/* Add to Cart Button Component */}
            <AddToCartButton product={product} variant="hover" />
        </div>
        <Link
          href={`/product/${product?.slug}`}
          className="block px-4 pt-2 text-xl text-gray-900 font-semibold truncate"
        >
            {product?.title}
        </Link>
        <div className="mt-2 flex justify-between items-center px-3">
            <div className="flex items-center gap-2">
                <span className="text-lg font-medium text-red-600">
                    ${product?.sale_price ? product?.sale_price.toFixed(2) : product?.regular_price.toFixed(2)}
                </span>
                {product?.sale_price && (
                    <span className="text-sm text-gray-500 line-through">
                        ${product?.regular_price.toFixed(2)}
                    </span>
                )}
            </div>
            {/* Total sales */}
            <div className="px-2 mt-2 text-sm font-medium text-green-600">
                {product?.totalSales || 0} sold
            </div>
        </div>
        <div className="mt-2 px-2">
            <Rating rating={product?.rating}/>
        </div>
        {isEvent && timeLeft &&(
          <div className="mt-2">
            <span className='inline-block text-xs bg-orange-100 text-orange-400'>
              {timeLeft}
            </span>
          </div>
        )}
        <div className="absolute z-10 flex flex-col gap-2 right-3 top-3">
          <div className="bg-white rounded-full p-[6px] shadow-md hover:scale-110 transition-transform duration-300 cursor-pointer">
            <Heart 
            fill={isWishlisted ? "red" : "transparent"}
            onClick={() => {
              isWishlisted 
                ? removeFromWishlist(product.id, user, location, deviceInfo) 
                : addToWishlist({...product, quantity: 1}, user, location, deviceInfo);
            }}
            size={20}
            stroke={isWishlisted ? "red" : "gray"}
            className="text-gray-600"/>
          </div>
          <div className="bg-white rounded-full p-[6px] shadow-md hover:scale-110 transition-transform duration-300 cursor-pointer">
            <Eye 
            size={20} 
            className="text-gray-600" 
            onClick={()=> setOpen(!open)}
            />
          </div>

        </div>
        
        {open && (
          <ProductDetailsCard data={product} setOpen={setOpen} />
        )}
    </div>
  )
}

export default ProductCard