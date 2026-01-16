"use client"
import axiosInstance from 'apps/user-ui/src/utils/axiosInstance'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import ShopCard from 'apps/user-ui/src/shared/components/cards/shop.card'
import { categories } from 'apps/user-ui/src/utils/categories'
import { countries } from 'apps/user-ui/src/utils/countries'
import PageLoader from 'apps/user-ui/src/shared/components/loading/component-loader'
import { Search } from 'lucide-react'
import MobileFilterDrawer, { FloatingFilterButton } from 'apps/user-ui/src/shared/components/buttons/mobile-filter-drawer'
const Page = () => {
    const router = useRouter();
    const [isShopLoading, setIsShopLoading] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [shops, setShops] = useState<any[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    
    // Temp states for filters (before Apply is clicked)
    const [tempCategories, setTempCategories] = useState<string[]>([]);
    const [tempCountries, setTempCountries] = useState<string[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Count active filters for badge
    const activeFiltersCount = selectedCategories.length + selectedCountries.length;

    const updateURL = () => {
        const params = new URLSearchParams();
        if (search) {
            params.set("search", search);
        }
        if (selectedCategories.length > 0) {
            params.set("categories", selectedCategories.join(","));
        }
        if (selectedCountries.length > 0) {
            params.set("countries", selectedCountries.join(","));
        }
        params.set("page", page.toString());
        router.replace(`/shops?${decodeURIComponent(params.toString())}`);
    }


    const fetchFilteredShops = async () => {
        setIsShopLoading(true);
        try {
            const query = new URLSearchParams();
            if (search) query.set("search", search);
            if (selectedCategories.length > 0) 
                query.set("categories", selectedCategories.join(","));
            if (selectedCountries.length > 0)
                query.set("countries", selectedCountries.join(","));
            query.set("page", page.toString());
            query.set("limit", "12");
            
            const res = await axiosInstance.get(
                `/product/api/get-filtered-shops?${query.toString()}`
            );
            setShops(res.data.shops);
            setTotalPages(res.data.pagination.totalPages);
        } catch (error) {
            console.error("Error fetching filtered shops:", error);
        }
        finally {
            setIsShopLoading(false);
        }

    }
    useEffect(() => {
        updateURL();
        fetchFilteredShops();
    },[selectedCategories, selectedCountries, page, search]);
    

    const toggleCategory = (label: string) => {
        setTempCategories((prev) => 
            prev.includes(label)
            ? prev.filter((cat) => cat !== label)
            : [...prev, label]
        );
    }

    const toggleCountry = (name: string) => {
        setTempCountries((prev) => 
            prev.includes(name)
            ? prev.filter((cou) => cou !== name)
            : [...prev, name]
        );
    }


    // Apply all filters at once
    const applyAllFilters = () => {
        setSelectedCategories(tempCategories);
        setSelectedCountries(tempCountries);
        setPage(1);
    }

    const handleSearch = () => {
        setSearch(searchInput);
        setPage(1);
    }

  return (
    <div className="w-full min-h-screen pb-10 mt-10">
        
        <div className="w-full flex flex-col lg:flex-row gap-8 lg:gap-20 px-4 lg:px-0">
        {/* Mobile Filter Drawer */}
        <MobileFilterDrawer 
            isOpen={isFilterOpen} 
            onClose={() => setIsFilterOpen(false)}
            onApply={applyAllFilters}
        >
            {/* Search */}
            <div className="mb-6">
                <h3 className="text-base font-medium text-gray-800 mb-3">Tìm kiếm</h3>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Tìm cửa hàng..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
                    />
                    <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
                </div>
            </div>

            {/* Categories */}
            <div className="mb-6">
                <h3 className="text-base font-medium text-gray-800 mb-3">Danh mục</h3>
                <div className='space-y-3 max-h-[200px] overflow-y-auto'>
                    {categories?.map((category: any) => (
                        <label key={category.value} className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={tempCategories.includes(category.value)}
                                onChange={() => toggleCategory(category.value)}
                                className="form-checkbox h-4 w-4 text-gray-800 border-gray-300 rounded focus:ring-0"
                            />
                            <span className="ml-3 text-sm text-gray-700">{category.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Countries */}
            <div className="mb-4">
                <h3 className="text-base font-medium text-gray-800 mb-3">Quốc gia</h3>
                <div className='space-y-3 max-h-[200px] overflow-y-auto'>
                    {[...countries].sort((a, b) => a.name.localeCompare(b.name)).map((country: any) => (
                        <label key={country.code} className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={tempCountries.includes(country.code)}
                                onChange={() => toggleCountry(country.code)}
                                className="form-checkbox h-4 w-4 text-gray-800 border-gray-300 rounded focus:ring-0"
                            />
                            <span className="ml-3 text-sm text-gray-700">{country.name}</span>
                        </label>
                    ))}
                </div>
            </div>
        </MobileFilterDrawer>

        {/* Floating Filter Button */}
        <FloatingFilterButton 
            onClick={() => setIsFilterOpen(true)} 
            activeFiltersCount={activeFiltersCount}
        />

        {/*Side Bar for filters*/}
        <aside className='hidden lg:block w-[270px] space-y-6'>
            {/* Search Input */}
            <div className="relative">
                 <input
                    type="text"
                    placeholder="Search shops..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-sm focus:outline-none focus:border-black transition-colors"
                />
                <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
            </div>

            {/*Category Filter*/}
            <div className="bg-white border border-gray-200 rounded-sm p-6">
                <h3 className="text-[18px] font-medium text-gray-800 mb-6 border-l-4 border-black pl-3">Categories</h3>
                <ul className='space-y-4 mb-4'>
                        {categories?.map((category: any) => (
                            <li key={category.value} className="flex items-center">
                                <label className="inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={tempCategories.includes(category.value)}
                                        onChange={() => toggleCategory(category.value)}
                                        className="form-checkbox h-4 w-4 text-gray-800 border-gray-300 rounded focus:ring-0"
                                    />
                                    <span className="ml-3 text-[14px] text-gray-700">{category.label}</span>
                                </label>
                            </li>
                        ))}
                </ul>
            </div>
            {/* Country Filter*/}
            <div className="bg-white border border-gray-200 rounded-sm p-6">
                <h3 className="text-[18px] font-medium text-gray-800 mb-6 border-l-4 border-black pl-3">Countries</h3>
                <ul className='space-y-4 mb-4'>
                    {[...countries].sort((a, b) => a.name.localeCompare(b.name)).map((country: any) => (
                        <li key={country.code} className="flex items-center justify-between">
                        <label className=''>
                            <input
                                type="checkbox"
                                checked={tempCountries.includes(country.code)}
                                onChange={() => toggleCountry(country.code)}
                                className="form-checkbox h-4 w-4 text-gray-800 border-gray-300 rounded focus:ring-0 mr-2"
                            />
                            {country.name}
                        </label>
                        </li>
                    ))}
                </ul>
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

        {/*shop Listing Section*/}
        <div className="flex-1 px-2 lg:px-3">
            <div className=" m-auto">
                    <h1 className="font-medium text-[40px] leading-1 mb-[14px]">Our Shops</h1>
            </div>
            {isShopLoading ? (
                <PageLoader text="Loading shops" />
            ) : shops.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {shops.map((shop) => (
                        <ShopCard
                            key={shop.id}
                            shop={shop}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center text-gray-500">No shops found.</div>
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