"use client";
import { useSiteConfig } from 'apps/user-ui/src/hooks/useSiteConfig';
import { ArrowUpRight, MapPin, StarIcon, Store, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { motion } from 'framer-motion';

interface ShopCardProps {
  shop: {
    id: string;
    name: string;
    description?: string;
    address?: string;
    images: {
      file_url: string;
      type: string;
    }[];
    followers?: string[];
    rating?: number;
    category?: string;
    sellers?: {
      id: string;
      name: string;
      country?: string;
    };
    _count?: {
      products: number;
    };
  }
}

const ShopCard: React.FC<ShopCardProps & { variant?: 'light' | 'dark' }> = ({ shop, variant = 'light' }) => {
  const { data: siteConfig } = useSiteConfig();
  const shopCategories = siteConfig?.shopCategories || [];
  const countries = siteConfig?.countries || [];
  
  // Tìm label của category từ value trong database
  const categoryLabel = shopCategories.find(cat => cat.value === shop?.category)?.label || shop?.category;
  
  // Tìm tên country từ country code của seller
  const countryName = countries.find(country => country.code === shop?.sellers?.country)?.name;
  
  const avatar = shop?.images?.find((img) => img.type === 'avatar')?.file_url;
  const cover = shop?.images?.find((img) => img.type === 'cover')?.file_url;

  const isDark = variant === 'dark';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0 }}
      whileHover={{ y: -8 }}
      className="relative group h-full"
    >
      <div className={`h-full w-full flex flex-col items-center backdrop-blur-xl rounded-2xl border shadow-lg transition-all duration-300 overflow-hidden ${
        isDark 
          ? 'bg-white/5 border-white/10 hover:border-[#C9A86C]/30 hover:shadow-[#C9A86C]/10' 
          : 'bg-white border-gray-200 hover:border-[#C9A86C]/30 hover:shadow-xl'
      }`}>
        {/* Cover Banner */}
        <div className={`h-28 w-full relative ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
          {cover ? (
            <Image src={cover} alt="Cover" fill className="object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500" />
          ) : (
            <div className={`w-full h-full bg-gradient-to-r ${
              isDark ? 'from-gray-900 via-gray-800 to-gray-900' : 'from-gray-100 via-gray-200 to-gray-100'
            }`} />
          )}
          <div className={`absolute inset-0 bg-gradient-to-t opacity-60 ${
            isDark ? 'from-[#0f0f0f] to-transparent' : 'from-white/50 to-transparent'
          }`} />
        </div>

        {/* Avatar with Ring Effect - positioned at top center */}
        <div className="relative -mt-14 mb-3">
          <div className={`absolute inset-0 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
            isDark ? 'bg-[#C9A86C]/20' : 'bg-[#C9A86C]/30'
          }`} />
          <div className={`relative w-24 h-24 rounded-full border-4 shadow-xl overflow-hidden transition-colors duration-300 bg-white ${
            isDark 
              ? 'border-[#1a1a1a] group-hover:border-[#C9A86C]/30' 
              : 'border-white group-hover:border-[#C9A86C]/50'
          }`}>
            {!avatar ? (
              <div className="aspect-square bg-white flex items-center justify-center">
                <Store size={40} className="text-gray-400" />
              </div>
            ) : (
              <Image
                src={avatar}
                alt={shop.name}
                width={96}
                height={96}
                className="object-contain p-1"
              />
            )}
          </div>
          {/* Verified Badge */}
          <div className={`absolute bottom-0 right-0 rounded-full p-1 border-2 shadow-sm bg-[#C9A86C] ${
            isDark ? 'border-[#1a1a1a]' : 'border-white'
          }`}>
            <ShieldCheck size={14} className={isDark ? "text-black" : "text-white"} />
          </div>
        </div>

        {/* Shop Info */}
        <div className="w-full text-center p-6 pt-0 flex-1 flex flex-col">
          <h3 className={`text-xl font-bold mb-1 transition-colors truncate px-2 ${
            isDark ? 'text-white group-hover:text-[#C9A86C]' : 'text-gray-900 group-hover:text-[#C9A86C]'
          }`}>{shop?.name}</h3>
          
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{shop?.followers?.length ?? 0} Followers</span>
            <span className="w-1 h-1 bg-gray-400 rounded-full" />
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{shop?._count?.products ?? 0} Products</span>
          </div>
          
          {/* Rating */}
          <div className={`flex items-center justify-center gap-2 mb-4 mx-auto px-4 py-1.5 rounded-full w-fit border ${
            isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'
          }`}>
            <div className='flex items-center gap-1'>
              <StarIcon size={16} className="text-[#C9A86C] fill-[#C9A86C]"/>
              <span className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {shop?.rating ? shop?.rating.toFixed(1) : '5.0'}
              </span>
            </div>
            <span className="text-gray-300">|</span>
            <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>98% Positive</span>
          </div>

          {/*Shop address*/}
          {shop?.address && (
              <div className={`flex items-center justify-center text-sm mb-4 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                <MapPin size={14} className="mr-1 text-[#C9A86C]"/>
                <span className="truncate max-w-[200px]">{shop?.address}</span>
            </div>
          )}

          {/*Shop category and country*/}
          <div className='mb-6 flex items-center justify-center gap-2 flex-wrap min-h-[28px]'>
            {categoryLabel &&
              <span className='inline-block bg-[#C9A86C]/10 border border-[#C9A86C]/20 text-[#C9A86C] text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full'>
                {categoryLabel}
              </span>
            }
            {countryName &&
              <span className={`inline-block border text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${
                isDark ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-600'
              }`}>
                {countryName}
              </span>
            }
          </div>

          {/*Visit Shop Button*/}
          <Link href={`/shop/${shop?.id}`} className="w-full block mt-auto">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className='w-full px-6 py-3 bg-gradient-to-r from-[#C9A86C] to-[#B8956A] text-black font-bold rounded-xl hover:from-[#E8D5B5] hover:to-[#C9A86C] transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-[#C9A86C]/10'
            >
              <span>Visit Shop</span>
              <ArrowUpRight size={18} />
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

export default ShopCard;