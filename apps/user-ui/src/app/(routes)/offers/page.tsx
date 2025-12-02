"use client"
import { useQuery } from '@tanstack/react-query'
import axiosInstance from 'apps/user-ui/src/utils/axiosInstance'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import {Range} from "react-range"
import ProductCard from 'apps/user-ui/src/shared/components/cards/product-card'
import PageLoader from 'apps/user-ui/src/shared/components/loading/page-loader'
const MIN=0;
const MAX=1199;
const Page = () => {
    const router = useRouter();
    const [isProductLoading, setIsProductLoading] = useState(false);
    const [priceRange, setPriceRange] = useState([0,1199]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [products, setProducts] = useState<any[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    
    // Temp states for filters (before Apply is clicked)
    const [tempPriceRange, setTempPriceRange] = useState([0, 1199]);
    const [tempCategories, setTempCategories] = useState<string[]>([]);
    const [tempColors, setTempColors] = useState<string[]>([]);
    const [tempSizes, setTempSizes] = useState<string[]>([]);

    const colors = [
        { name: 'Red', hex: '#FF0000' },
        { name: 'Blue', hex: '#0000FF' },
        { name: 'Green', hex: '#00FF00' },
        { name: 'Yellow', hex: '#FFFF00' },
        { name: 'White', hex: '#FFFFFF' },
        { name: 'Magenta', hex: '#FF00FF' },
        { name: 'Cyan', hex: '#00FFFF' },
        { name: 'Black', hex: '#000000' },
    ];

    const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

    const updateURL = () => {
        const params = new URLSearchParams();
        params.set("priceRange", priceRange.join(","));
        if (selectedCategories.length > 0) {
            params.set("categories", selectedCategories.join(","));
        }
        if (selectedColors.length > 0) {
            params.set("colors", selectedColors.join(","));
        }
        if (selectedSizes.length > 0) {
            params.set("sizes", selectedSizes.join(","));
        }
        params.set("page", page.toString());
        router.replace(`/offers?${decodeURIComponent(params.toString())}`);
    }


    const fetchFilteredProducts = async () => {
        setIsProductLoading(true);
        try {
            const query = new URLSearchParams();

            query.set("priceRange", priceRange.join(","));
            if (selectedCategories.length > 0) 
                query.set("categories", selectedCategories.join(","));
            if (selectedColors.length > 0)
                query.set("colors", selectedColors.join(","));
            if (selectedSizes.length > 0) 
                query.set("sizes", selectedSizes.join(","));
            query.set("page", page.toString());
            query.set("limit", "12");
            
            const res = await axiosInstance.get(
                `/product/api/get-filtered-offers?${query.toString()}`
            );
            setProducts(res.data.products);
            setTotalPages(res.data.pagination.totalPages);
        } catch (error) {
            console.error("Error fetching filtered products:", error);
        }
        finally {
            setIsProductLoading(false);
        }

    }
    useEffect(() => {
        updateURL();
        fetchFilteredProducts();
    },[priceRange,selectedCategories,selectedColors,selectedSizes,page]);
    const {data,isLoading} = useQuery({
        queryKey: ["categories"],
        queryFn: async () => {
            const res = await axiosInstance.get('/product/api/get-categories');
            return res.data;
        },
        staleTime: 30 * 60 * 1000, // 30 minutes
    });

    const toggleCategory = (label: string) => {
        setTempCategories((prev) => 
            prev.includes(label)
            ? prev.filter((cat) => cat !== label)
            : [...prev, label]
        );
    }

    const toggleColor = (color: string) => {
        setTempColors((prev) => 
            prev.includes(color)
            ? prev.filter((c) => c !== color)
            : [...prev, color]
        );
    }
    
    const toggleSize = (size: string) => {
        setTempSizes((prev) => 
            prev.includes(size)
            ? prev.filter((s) => s !== size)
            : [...prev, size]
        );
    }

    // Apply all filters at once
    const applyAllFilters = () => {
        setSelectedCategories(tempCategories);
        setSelectedColors(tempColors);
        setSelectedSizes(tempSizes);
        setPriceRange(tempPriceRange);
        setPage(1);
    }
  return (
    <div className="w-full min-h-screen pb-10 mt-10">
        
        <div className="w-full flex flex-col lg:flex-row gap-8 lg:gap-20 px-4 lg:px-0">
        {/*Side Bar for filters*/}
        <aside className='w-full lg:w-[270px] space-y-6'>
            {/*Category Filter*/}
            <div className="bg-white border border-gray-200 rounded-sm p-6">
                <h3 className="text-[18px] font-medium text-gray-800 mb-6 border-l-4 border-black pl-3">Categories</h3>
                <ul className='space-y-4 mb-4'>
                    {isLoading ? (
                        <div className="text-gray-500">Loading...</div>
                    ) : (
                        data?.categories?.map((category: any) => (
                            <li key={category} className="flex items-center">
                                <label className="inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={tempCategories.includes(category)}
                                        onChange={() => toggleCategory(category)}
                                        className="form-checkbox h-4 w-4 text-gray-800 border-gray-300 rounded focus:ring-0"
                                    />
                                    <span className="ml-3 text-[14px] text-gray-700">{category}</span>
                                </label>
                            </li>
                        ))
                    )}
                </ul>
            </div>
            {/*Color Filter*/}
            <div className="bg-white border border-gray-200 rounded-sm p-6">
                <h3 className="text-[18px] font-medium text-gray-800 mb-6 border-l-4 border-black pl-3">Filter by Color</h3>
                <ul className='space-y-4 mb-4'>
                    {colors.map((color) => (
                        <li key={color.name} className="flex items-center">
                            <label className="inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={tempColors.includes(color.name)}
                                    onChange={() => toggleColor(color.name)}
                                    className="form-checkbox h-4 w-4 text-gray-800 border-gray-300 rounded focus:ring-0"
                                />
                                <span 
                                    className="w-[16px] h-[16px] inline-block ml-3 border border-gray-300 rounded-full"
                                    style={{backgroundColor: color.hex}}
                                />
                                <span className="ml-2 text-[14px] text-gray-700">{color.name}</span>
                            </label>
                        </li>
                    ))}
                </ul>
            </div>

            {/*Size Filter*/}
            <div className="bg-white border border-gray-200 rounded-sm p-6">
                <h3 className="text-[18px] font-medium text-gray-800 mb-6 border-l-4 border-black pl-3">Filter by Size</h3>
                <ul className='space-y-4 mb-4'>
                    {sizes.map((size) => (
                        <li key={size} className="flex items-center">
                            <label className="inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={tempSizes.includes(size)}
                                    onChange={() => toggleSize(size)}
                                    className="form-checkbox h-4 w-4 text-gray-800 border-gray-300 rounded focus:ring-0"
                                />
                                <span className="ml-3 text-[14px] text-gray-700">{size}</span>
                            </label>
                        </li>
                    ))}
                </ul>
            </div>
            {/*Price Range Filter*/}
            <div className="bg-white border border-gray-200 rounded-sm p-6">
                <h3>Price Filter</h3>
                <div className='ml-2'>
                    <Range
                        step={1}
                        min={MIN}
                        max={MAX}
                        values={tempPriceRange}
                        onChange={(values)=> setTempPriceRange(values)}
                        renderTrack={({props,children})=>{
                            const[min,max]=tempPriceRange;
                            const percentageLeft = ((min - MIN) / (MAX - MIN)) * 100;
                            const percentageRight = ((max - MIN) / (MAX - MIN)) * 100;

                            return(
                                <div
                                    {...props}
                                    className={`mt-2 relative h-2 bg-gray-200 rounded-md`}
                                >
                                    <div
                                        className={`absolute h-2 bg-gray-700 rounded-md`}
                                        style={{
                                            left: `${percentageLeft}%`,
                                            width: `${percentageRight - percentageLeft}%`,
                                        }}
                                    />
                                    {children}
                                </div>
                            )
                        }}
                        renderThumb ={({props})=>{
                            const {key,...rest}=props;
                            return(
                                <div
                                    key={key}
                                    {...rest}
                                    className='h-5 w-5 bg-white border border-gray-500 rounded-full shadow-md flex items-center justify-center'
                                >
                                    <div className='h-1 w-1 bg-gray-500 rounded-full' />
                                </div>
                            )
                        }}
                    />
                </div>
                <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-gray-600">
                        ${tempPriceRange[0]} - ${tempPriceRange[1]}
                    </div>
                </div>
            </div>

            {/* Apply All Filters Button */}
            <div className="sticky bottom-4">
                <button
                    className="w-full px-4 py-3 bg-black text-white font-medium rounded-md hover:bg-gray-800 transition shadow-lg"
                    onClick={applyAllFilters}
                >
                    Apply All Filters
                </button>
            </div>
        </aside>
        {/*Product Listing Section*/}
        <div className="flex-1 px-2 lg:px-3">
            <div className=" m-auto">
                    <h1 className="font-medium text-[40px] leading-1 mb-[14px]">Our Collection Of Products</h1>
            </div>
            {isProductLoading ? (
                <PageLoader text="Loading offers" />
            ) : products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map((product) => (
                        <ProductCard 
                        key={product.id} 
                        product={product}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center text-gray-500">No products found.</div>
            )}
            {totalPages > 1 && (
                <div className="flex justify-center mt-8 gap-2">
                    {Array.from({ length: totalPages }).map((_, i) =>(
                        <button
                            key={i+1}
                            onClick={() => setPage(i+1)}
                            className={`mx-1 px-3 py-1 rounded-md ${page === i+1 ? 'bg-black text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                            {i+1}
                        </button>
                    ))}
                </div>
            )}
            </div>
        </div>
    </div>
  )
}

export default Page