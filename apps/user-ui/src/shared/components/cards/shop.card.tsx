"use client";
import { categories } from 'apps/user-ui/src/utils/categories';
import { countries } from 'apps/user-ui/src/utils/countries';
import { ArrowUpRight, MapPin, StarIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { motion } from 'framer-motion';

interface ShopCardProps {
  shop:{
    id: string;
    name: string;
    description?: string;
    avatar?: string;
    coverBanner?: string;
    address?: string;
    followers?:[];
    rating?: number;
    category?: string;
    sellers?: {
      id: string;
      name: string;
      country?: string;
    };
  }
}
const ShopCard:React.FC<ShopCardProps> = ({ shop }) => {
  // Tìm label của category từ value trong database
  const categoryLabel = categories.find(cat => cat.value === shop?.category)?.label || shop?.category;
  
  // Tìm tên country từ country code của seller
  const countryName = countries.find(country => country.code === shop?.sellers?.country)?.name;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.5 }}
      whileHover={{ y: -8 }}
      className="relative group"
    >
      <div className='w-full flex flex-col items-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300'>
        {/* Avatar with Ring Effect - positioned at top center */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-md opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
            <Image
              src={shop?.avatar || 'https://img.favpng.com/8/20/24/computer-icons-online-shopping-png-favpng-QuiWDXbsc69EE92m3bZ2i0ybS.jpg'}
              alt={shop.name}
              width={96}
              height={96}
              className="object-cover"
            />
          </div>
        </div>

        {/* Shop Info */}
        <div className="w-full text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{shop?.name}</h3>
          <p className='text-sm text-gray-600 mb-4'>{shop?.followers?.length ?? 0} Followers</p>
          
          {/*Shop address and ratings*/}
          <div className='flex items-center justify-center text-sm text-gray-500 mb-4 gap-4 flex-wrap'>
            {shop?.address &&
              <span className='flex items-center gap-1 max-w-[180px]'>
                <MapPin size={16} className="inline-block text-gray-400"/>
                <span className="truncate">{shop?.address || 'No address provided'}</span>
              </span>
            }
          </div>

          {/* Rating */}
          <div className='flex items-center justify-center gap-2 mb-4'>
            <div className='flex items-center gap-1'>
              <StarIcon size={18} className="inline-block text-yellow-400 fill-yellow-400"/>
              <span className="text-base font-semibold text-gray-900">{shop?.rating ? shop?.rating.toFixed(1) : 'N/A'}</span>
            </div>
          </div>

          {/*Shop category and country*/}
          <div className='mb-6 flex items-center justify-center gap-2 flex-wrap'>
            {shop?.category &&
              <span className='inline-block bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 text-xs font-medium px-3 py-1 rounded-full'>{categoryLabel}</span>
            }
            {countryName &&
              <span className='inline-block bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 text-xs font-medium px-3 py-1 rounded-full'>{countryName}</span>
            }
          </div>

          {/*Visit Shop Button*/}
          <Link href={`/shop/${shop?.id}`} className="w-full block">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className='w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold flex items-center justify-center space-x-2 shadow-md hover:shadow-xl'
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

export default ShopCard