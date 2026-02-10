"use client"
import { useQuery } from '@tanstack/react-query'
import axiosInstance from 'apps/user-ui/src/utils/axiosInstance'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useState, Suspense } from 'react'
import {Range} from "react-range"
import ProductCard from 'apps/user-ui/src/shared/components/cards/product-card'
import ComponentLoader from 'apps/user-ui/src/shared/components/loading/component-loader'
import MobileFilterDrawer, { FloatingFilterButton } from 'apps/user-ui/src/shared/components/buttons/mobile-filter-drawer'
import { Search, X, ShoppingBag } from 'lucide-react'
import { PageHeader } from 'apps/user-ui/src/shared/components/page-header'

const MIN=0;
const MAX=1199;
const ProductsContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isProductLoading, setIsProductLoading] = useState(true);
    const [priceRange, setPriceRange] = useState([0,1199]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [products, setProducts] = useState<any[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);
    
    // Search keyword state
    const [searchKeyword, setSearchKeyword] = useState('');
    const [didYouMean, setDidYouMean] = useState<string | null>(null);
    
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
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Count active filters for badge
    const activeFiltersCount = selectedCategories.length + selectedColors.length + selectedSizes.length + 
        (priceRange[0] !== 0 || priceRange[1] !== 1199 ? 1 : 0) +
        (searchKeyword ? 1 : 0);

    const updateURL = () => {
        const params = new URLSearchParams();
        // Preserve search keyword
        if (searchKeyword) {
            params.set("search", searchKeyword);
        }
        // Only add priceRange if it's not default
        if (priceRange[0] !== 0 || priceRange[1] !== 1199) {
            params.set("priceRange", priceRange.join(","));
        }
        if (selectedCategories.length > 0) {
            params.set("categories", selectedCategories.join(","));
        }
        if (selectedColors.length > 0) {
            params.set("colors", selectedColors.join(","));
        }
        if (selectedSizes.length > 0) {
            params.set("sizes", selectedSizes.join(","));
        }
        if (page > 1) {
            params.set("page", page.toString());
        }
        router.replace(`/products?${decodeURIComponent(params.toString())}`);
    }

    // Initialize from URL params on mount
    useEffect(() => {
        // Get search keyword from URL
        const urlSearch = searchParams.get('search');
        if (urlSearch) {
            setSearchKeyword(urlSearch);
        }
        
        const urlPriceRange = searchParams.get('priceRange');
        if (urlPriceRange) {
            const range = urlPriceRange.split(',').map(Number);
            if (range.length === 2) {
                setPriceRange(range);
                setTempPriceRange(range);
            }
        }
        
        const urlCategories = searchParams.get('categories');
        if (urlCategories) {
            const cats = urlCategories.split(',');
            setSelectedCategories(cats);
            setTempCategories(cats);
        }
        
        const urlColors = searchParams.get('colors');
        if (urlColors) {
            const cols = urlColors.split(',');
            setSelectedColors(cols);
            setTempColors(cols);
        }
        
        const urlSizes = searchParams.get('sizes');
        if (urlSizes) {
            const szs = urlSizes.split(',');
            setSelectedSizes(szs);
            setTempSizes(szs);
        }
        
        const urlPage = searchParams.get('page');
        if (urlPage) {
            setPage(Number(urlPage));
        }
    }, [searchParams]); // Re-run when URL changes


    const fetchFilteredProducts = async (signal?: AbortSignal) => {
        setIsProductLoading(true);
        try {
            // Use enhanced-search API when there's a search keyword for better fuzzy matching
            const useEnhancedSearch = searchKeyword && searchKeyword.trim().length > 0;
            
            const query = new URLSearchParams();

            if (useEnhancedSearch) {
                // Enhanced search with fuzzy matching and didYouMean
                query.set("keyword", searchKeyword);
                query.set("page", page.toString());
                query.set("limit", "12");
                
                const res = await axiosInstance.get(
                    `/product/api/enhanced-search?${query.toString()}`,
                    { signal }
                );
                
                // Extract didYouMean suggestion
                setDidYouMean(res.data.didYouMean || null);
                setProducts(res.data.products);
                setTotalPages(res.data.pagination.totalPages);
                setTotalProducts(res.data.pagination.total);
            } else {
                // Regular filtered search
                // Add search keyword
                if (searchKeyword) {
                    query.set("search", searchKeyword);
                }

                // Only send priceRange if it's not default
                if (priceRange[0] !== 0 || priceRange[1] !== 1199) {
                    query.set("priceRange", priceRange.join(","));
                }
                if (selectedCategories.length > 0) 
                    query.set("categories", selectedCategories.join(","));
                if (selectedColors.length > 0)
                    query.set("colors", selectedColors.join(","));
                if (selectedSizes.length > 0) 
                    query.set("sizes", selectedSizes.join(","));
                query.set("page", page.toString());
                query.set("limit", "12");
                
                const res = await axiosInstance.get(
                    `/product/api/get-filtered-products?${query.toString()}`,
                    { signal }
                );
                setDidYouMean(null);
                setProducts(res.data.products);
                setTotalPages(res.data.pagination.totalPages);
                setTotalProducts(res.data.pagination.total);
            }
            setIsProductLoading(false);
        } catch (error) {
            if ((error as any).name !== 'CanceledError') {
                console.error("Error fetching filtered products:", error);
                setIsProductLoading(false);
            }
        }
    }
    useEffect(() => {
        const controller = new AbortController();
        updateURL();
        fetchFilteredProducts(controller.signal);

        return () => {
            controller.abort();
        };
    },[priceRange,selectedCategories,selectedColors,selectedSizes,page,searchKeyword]);

    // Clear search keyword
    const clearSearch = () => {
        setSearchKeyword('');
        setPage(1);
    };
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
    <div className="w-full min-h-screen pb-10">
        {/* Page Header */}
        <div className="md:w-[85%] w-[95%] mx-auto pt-8">
            <PageHeader 
                title="Our Collection" 
                subtitle="Discover our curated selection of premium products"
                Icon={ShoppingBag}
                badge="Premium Quality"
            />
        </div>
        
        <div className="md:w-[85%] w-[95%] mx-auto flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/*Side Bar for filters*/}
        <aside className='hidden lg:block w-[270px] space-y-6'>
            {/*Category Filter*/}
            <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 border-l-4 border-[#C9A86C] pl-3">Categories</h3>
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
            <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 border-l-4 border-[#C9A86C] pl-3">Filter by Color</h3>
                <ul className='space-y-4 mb-4'>
                    {colors.map((color) => (
                        <li key={color.name} className="flex items-center">
                            <label className="inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={tempColors.includes(color.hex)}
                                    onChange={() => toggleColor(color.hex)}
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
            <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 border-l-4 border-[#C9A86C] pl-3">Filter by Size</h3>
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
            <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-l-4 border-[#C9A86C] pl-3">Price Filter</h3>
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
                    className="w-full px-4 py-3.5 bg-gradient-to-r from-[#C9A86C] to-[#B8956A] text-black font-semibold rounded-xl hover:from-[#E8D5B5] hover:to-[#C9A86C] transition-all duration-300 shadow-lg shadow-[#C9A86C]/20"
                    onClick={applyAllFilters}
                >
                    Apply All Filters
                </button>
            </div>
        </aside>

        {/* Mobile Filter Drawer */}
        <MobileFilterDrawer 
            isOpen={isFilterOpen} 
            onClose={() => setIsFilterOpen(false)}
            onApply={applyAllFilters}
        >
            {/* Categories */}
            <div className="mb-6">
                <h3 className="text-base font-medium text-gray-800 mb-4">Danh mục</h3>
                <div className='space-y-3'>
                    {isLoading ? (
                        <div className="text-gray-500">Loading...</div>
                    ) : (
                        data?.categories?.map((category: any) => (
                            <label key={category} className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={tempCategories.includes(category)}
                                    onChange={() => toggleCategory(category)}
                                    className="form-checkbox h-4 w-4 text-gray-800 border-gray-300 rounded focus:ring-0"
                                />
                                <span className="ml-3 text-sm text-gray-700">{category}</span>
                            </label>
                        ))
                    )}
                </div>
            </div>

            {/* Colors */}
            <div className="mb-6">
                <h3 className="text-base font-medium text-gray-800 mb-4">Màu sắc</h3>
                <div className='flex flex-wrap gap-3'>
                    {colors.map((color) => (
                        <button
                            key={color.name}
                            onClick={() => toggleColor(color.hex)}
                            className={`w-8 h-8 rounded-full border-2 transition ${
                                tempColors.includes(color.hex) 
                                    ? 'border-black scale-110' 
                                    : 'border-gray-200'
                            }`}
                            style={{backgroundColor: color.hex}}
                            title={color.name}
                        />
                    ))}
                </div>
            </div>

            {/* Sizes */}
            <div className="mb-6">
                <h3 className="text-base font-medium text-gray-800 mb-4">Kích cỡ</h3>
                <div className='flex flex-wrap gap-2'>
                    {sizes.map((size) => (
                        <button
                            key={size}
                            onClick={() => toggleSize(size)}
                            className={`px-4 py-2 rounded-lg border transition ${
                                tempSizes.includes(size)
                                    ? 'bg-black text-white border-black'
                                    : 'border-gray-200 text-gray-700 hover:border-gray-400'
                            }`}
                        >
                            {size}
                        </button>
                    ))}
                </div>
            </div>

            {/* Price Range */}
            <div className="mb-4">
                <h3 className="text-base font-medium text-gray-800 mb-4">Giá</h3>
                <div className='px-2'>
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
                                <div {...props} className="mt-2 relative h-2 bg-gray-200 rounded-md">
                                    <div
                                        className="absolute h-2 bg-gray-700 rounded-md"
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
                <div className="text-center mt-4 text-sm text-gray-600">
                    ${tempPriceRange[0]} - ${tempPriceRange[1]}
                </div>
            </div>
        </MobileFilterDrawer>

        {/* Floating Filter Button */}
        <FloatingFilterButton 
            onClick={() => setIsFilterOpen(true)} 
            activeFiltersCount={activeFiltersCount}
        />
        {/*Product Listing Section*/}
        <div className="flex-1">
            <div className="m-auto">
                {/* Search Results Header */}
                {searchKeyword ? (
                    <div className="mb-6">
                        {/* Did You Mean Suggestion */}
                        {didYouMean && (
                            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Search size={18} className="text-blue-600" />
                                    <p className="text-sm text-gray-700">
                                        Did you mean:{" "}
                                        <button
                                            onClick={() => {
                                                setSearchKeyword(didYouMean);
                                                setPage(1);
                                            }}
                                            className="font-semibold text-blue-600 hover:underline"
                                        >
                                            {didYouMean}
                                        </button>
                                        ?
                                    </p>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-3 mb-2">
                            <Search size={24} className="text-[#C9A86C]" />
                            <h1 className="font-medium text-[28px] lg:text-[40px] leading-tight">
                                Search results
                            </h1>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <p className="text-gray-600">
                                Found <span className="font-semibold text-[#C9A86C]">{totalProducts}</span> products for the keyword:
                            </p>
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#C9A86C]/10 text-[#C9A86C] rounded-full font-medium">
                                <Search size={14} />
                                "{searchKeyword}"
                                <button 
                                    onClick={clearSearch}
                                    className="ml-1 p-0.5 hover:bg-[#C9A86C]/20 rounded-full transition-colors"
                                    title="Clear search"
                                >
                                    <X size={14} />
                                </button>
                            </span>
                        </div>
                    </div>
                ) : (
                    <h1 className="font-medium text-[40px] leading-1 mb-[14px]">Our Collection Of Products</h1>
                )}
            </div>
            {isProductLoading ? (
                <ComponentLoader text="Loading products..." />
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
                <div className="flex flex-col items-center justify-center py-16">
                    <Search size={48} className="text-gray-300 mb-4" />
                    <p className="text-lg text-gray-500 mb-2">No products found</p>
                    {searchKeyword && (
                        <p className="text-sm text-gray-400 mb-4">
                            Try searching with a different keyword or clear the filter
                        </p>
                    )}
                    {searchKeyword && (
                        <button
                            onClick={clearSearch}
                            className="px-4 py-2 bg-[#C9A86C] text-white rounded-lg hover:bg-[#b89a5c] transition-colors"
                        >
                            Clear search
                        </button>
                    )}
                </div>
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

// Main Page component with Suspense boundary
const Page = () => {
    return (
        <Suspense fallback={<ComponentLoader text="Loading..." />}>
            <ProductsContent />
        </Suspense>
    );
};

export default Page