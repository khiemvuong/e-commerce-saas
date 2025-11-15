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
import FlashsaleLogo from 'apps/user-ui/src/assets/svgs/flashsale-logo';

const ProductCard = ({product, isEvent: isEventProp}:{product: any; isEvent?: boolean}) => {
  // Auto-detect event status from product data, with manual override option
  const isEvent = isEventProp ?? !!(product?.starting_date && product?.ending_date);
  
  const [timeLeft, setTimeLeft] = useState("")
  const [open, setOpen] = useState(false);
  const{user} =useUser();
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();
  const addToWishlist = useStore((state:any) => state.addToWishlist);
  const removeFromWishlist = useStore((state:any) => state.removeFromWishlist);
  const wishlist = useStore((state:any) => state.wishlist);
  const isWishlisted = wishlist.some((item:any) => item.id === product.id);

  // Format total sales: 1234 -> "1.2k", 567 -> "567"
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

    // Initial update
    const shouldContinue = updateTimer();
    
    if (!shouldContinue) return;
    
    // Update every second for better UX
    const interval = setInterval(() => {
      const shouldContinue = updateTimer();
      if (!shouldContinue) clearInterval(interval);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isEvent, product?.ending_date]);
  return (
    <div className="w-full min-h-[350px] h-max bg-white rounded-lg relative shadow-sm hover:shadow-md transition-shadow">
        {isEvent && (
            <div className="flex flex-col absolute top-1 backdrop-brightness-105 text-amber-400 text-xs font-bold rounded-md z-10 items-center gap-1">
              <FlashsaleLogo size={60}/>              
                <span>SPECIAL OFFER</span>
            </div>
        )}
        {product?.stock <= 5 && (
            <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-lg z-10">
                Only {product?.stock} left!
            </div>
        )}
        <div className="relative group overflow-hidden rounded-t-lg">
            <Link href={`/product/${product?.slug}`}>
                <Image
                src={product?.images?.[0]?.file_url || "https://bunchobagels.com/wp-content/uploads/2024/09/placeholder.jpg"}
                alt={product?.title}
                width={500}
                height={500}
                className="w-full h-[200px] object-scale-down group-hover:scale-105 transition-transform duration-300"
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
            <div className="px-2 mt-2 text-sm text-gray-00">
                {formatSales(product?.totalSales || 0)} sold
            </div>
        </div>
        <div className="mt-2 px-2">
            <Rating rating={product?.rating}/>
        </div>
        {isEvent && timeLeft && (
          <div className="mx-3 mt-3 mb-2">
            <div className="bg-gradient-to-br from-[#e7b55a] via-amber-600 to-[#e7b55a] text-white text-center py-1 px-4 rounded-xl shadow-lg">
              
              <div className="text-sm font-semibold tracking-wide drop-shadow-sm">
                {timeLeft === "Event ended" ? (
                  <span className="text-white/90">Event Ended</span>
                ) : (
                  <span>Ends in: <br/>{timeLeft}</span>
                )}
              </div>
            </div>
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