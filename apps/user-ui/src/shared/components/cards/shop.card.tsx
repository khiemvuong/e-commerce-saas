import { categories } from 'apps/user-ui/src/utils/categories';
import { countries } from 'apps/user-ui/src/utils/countries';
import { ArrowUp, MapPin, StarIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

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
    <div className='w-full rounded-md cursor-pointer bg-white border border-gray-200 shadow-sm overflow-hidden transition'>
        {/* Cover */}
        <div className="h-[120px] w-full relative">
            <Image
                src={shop?.coverBanner || 'https://png.pngtree.com/png-vector/20221007/ourmid/pngtree-cute-shopping-woman-character-in-vector-illustration-with-colorful-graphic-background-and-placeholder-text-vector-png-image_49176370.jpg'}
                alt="Cover"
                fill
                className="object-cover h-full w-full"
            />
        </div>
        {/* Avatar */}
        <div className="relative flex justify-center -mt-8 ">
            <div className="w-16 h-16 rounded-full border-4 border-white overflow-hidden shadow-md">
                <Image
                    src={shop?.avatar || 'https://img.favpng.com/8/20/24/computer-icons-online-shopping-png-favpng-QuiWDXbsc69EE92m3bZ2i0ybS.jpg'}
                    alt={shop.name}
                    width={64}
                    height={64}
                    className="object-cover"
                />
            </div>
        </div>
        {/* Shop Info */}
        <div className="px-4 pb-4 text-center">
            <h3 className="text-lg font-semibold text-gray-900">{shop?.name}</h3>
            <p className='text-xs text-gray-500 mt-0.5'>{shop?.followers?.length ?? 0} Followers</p>
            {/*Shop address and ratings*/}
            <div className='flex items-center justify-center text-xs text-gray-500 mt-2 gap-4 flex-wrap'>
                {shop?.address &&
                    <span className='flex items-center gap-1 max-w-[120px]'>
                        <MapPin size={14} className="inline-block text-gray-400"/>
                        <span className="truncate">{shop?.address || 'No address provided'}</span>
                    </span>
                }
                <span className='flex items-center gap-1'>
                    <StarIcon size={14} className="inline-block text-yellow-400 fill-yellow-400"/>
                    <span className="truncate">{shop?.rating ? shop?.rating.toFixed(1) : 'N/A'}</span>
                </span>
            </div>
            {/*Shop category and country*/}
            <div className='mt-2 flex items-center justify-center gap-2 flex-wrap'>
              {shop?.category &&
                <span className='inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full'>{categoryLabel}</span>
              }
              {countryName &&
                <span className='inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full'>{countryName}</span>
              }
            </div>
            {/*Vist Shop Button*/}
            <div className='mt-4'>
              <Link
                href={`/shop/${shop?.id}`}
                className='inline-block px-4 py-2 bg-black text-white text-sm rounded-md hover:bg-gray-800 transition'
              >
                Visit Shop
                <ArrowUp size={14} className="inline-block ml-1"/>
              </Link>
              </div>
        </div>
    </div>
  )
}

export default ShopCard