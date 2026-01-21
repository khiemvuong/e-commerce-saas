'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from 'apps/user-ui/src/utils/axiosInstance';
import { debounce } from '../../../utils/helpers';

interface SearchSuggestion {
    suggestions: string[];
    products: {
        id: string;
        title: string;
        slug: string;
        sale_price: number;
        images: { file_url: string }[];
    }[];
}

interface SearchBarProps {
    isTransparent?: boolean;
    className?: string;
}

const SearchBar = ({ isTransparent = false, className = '' }: SearchBarProps) => {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch suggestions with debounce
    const { data: suggestions, isLoading, refetch } = useQuery<SearchSuggestion>({
        queryKey: ['searchSuggestions', query],
        queryFn: async () => {
            if (query.length < 2) return { suggestions: [], products: [] };
            const res = await axiosInstance.get(`/product/api/search-suggestions?keyword=${encodeURIComponent(query)}&limit=5`);
            return res.data;
        },
        enabled: query.length >= 2,
        staleTime: 30000,
    });

    // Debounced search
    const debouncedSearch = useCallback(
        debounce((value: string) => {
            if (value.length >= 2) {
                refetch();
            }
        }, 300),
        [refetch]
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        setSelectedIndex(-1);
        if (value.length >= 2) {
            setIsOpen(true);
            debouncedSearch(value);
        } else {
            setIsOpen(false);
        }
    };

    const handleSearch = (searchQuery?: string) => {
        const finalQuery = searchQuery || query;
        if (finalQuery.trim()) {
            router.push(`/products?search=${encodeURIComponent(finalQuery.trim())}`);
            setIsOpen(false);
            setQuery('');
        }
    };

    const handleProductClick = (slug: string) => {
        router.push(`/product/${slug}`);
        setIsOpen(false);
        setQuery('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        const totalItems = (suggestions?.suggestions?.length || 0) + (suggestions?.products?.length || 0);
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, totalItems - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, -1));
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0) {
                    const suggestionCount = suggestions?.suggestions?.length || 0;
                    if (selectedIndex < suggestionCount) {
                        handleSearch(suggestions?.suggestions?.[selectedIndex]);
                    } else {
                        const productIndex = selectedIndex - suggestionCount;
                        const product = suggestions?.products?.[productIndex];
                        if (product) handleProductClick(product.slug);
                    }
                } else {
                    handleSearch();
                }
                break;
            case 'Escape':
                setIsOpen(false);
                inputRef.current?.blur();
                break;
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node) &&
                !inputRef.current?.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const hasResults = (suggestions?.suggestions?.length || 0) + (suggestions?.products?.length || 0) > 0;

    return (
        <div className={`relative ${className}`}>
            {/* Search Input */}
            <div className={`relative flex items-center rounded-full overflow-hidden transition-all duration-200 ${
                isTransparent 
                    ? 'bg-white/10 border border-white/30 focus-within:bg-white/20' 
                    : 'bg-gray-100 border border-gray-200 focus-within:border-[#C9A86C] focus-within:bg-white'
            }`}>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => query.length >= 2 && setIsOpen(true)}
                    placeholder="What are you looking for?..."
                    className={`w-full pl-4 pr-10 py-2.5 text-sm bg-transparent outline-none ${
                        isTransparent 
                            ? 'text-white placeholder-white/70' 
                            : 'text-gray-800 placeholder-gray-400'
                    }`}
                />
                
                {/* Search/Clear Button */}
                <button
                    onClick={() => query ? (setQuery(''), setIsOpen(false)) : handleSearch()}
                    className={`absolute right-2 p-1.5 rounded-full transition-colors ${
                        isTransparent 
                            ? 'text-white/80 hover:bg-white/20' 
                            : 'text-gray-400 hover:text-[#C9A86C] hover:bg-gray-100'
                    }`}
                >
                    {isLoading ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : query ? (
                        <X size={18} />
                    ) : (
                        <Search size={18} />
                    )}
                </button>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div
                    ref={dropdownRef}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-[400px] overflow-y-auto"
                >
                    {!hasResults && query.length >= 2 && !isLoading && (
                        <div className="px-4 py-6 text-center text-gray-500">
                            <Search size={32} className="mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">No result for "{query}"</p>
                            <p className="text-xs text-gray-400 mt-1">Try another keyword?</p>
                        </div>
                    )}

                    {/* Keyword Suggestions */}
                    {suggestions?.suggestions && suggestions.suggestions.length > 0 && (
                        <div className="py-2">
                            <p className="px-4 py-1 text-xs font-medium text-gray-400 uppercase tracking-wide">
                                Suggestion
                            </p>
                            {suggestions.suggestions.map((suggestion, index) => (
                                <button
                                    key={`suggestion-${index}`}
                                    onClick={() => handleSearch(suggestion)}
                                    className={`w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors ${
                                        selectedIndex === index 
                                            ? 'bg-[#C9A86C]/10 text-[#C9A86C]' 
                                            : 'hover:bg-gray-50 text-gray-700'
                                    }`}
                                >
                                    <TrendingUp size={16} className="text-gray-400" />
                                    <span className="text-sm">{suggestion}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Product Previews */}
                    {suggestions?.products && suggestions.products.length > 0 && (
                        <div className="border-t border-gray-100 py-2">
                            <p className="px-4 py-1 text-xs font-medium text-gray-400 uppercase tracking-wide">
                                Product
                            </p>
                            {suggestions.products.map((product, index) => {
                                const itemIndex = (suggestions.suggestions?.length || 0) + index;
                                return (
                                    <button
                                        key={product.id}
                                        onClick={() => handleProductClick(product.slug)}
                                        className={`w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors ${
                                            selectedIndex === itemIndex 
                                                ? 'bg-[#C9A86C]/10' 
                                                : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        {product.images?.[0]?.file_url ? (
                                            <img 
                                                src={product.images[0].file_url} 
                                                alt={product.title}
                                                className="w-10 h-10 object-cover rounded-lg"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                                <Search size={16} className="text-gray-300" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate">
                                                {product.title}
                                            </p>
                                            <p className="text-sm text-[#C9A86C] font-semibold">
                                                {product.sale_price?.toLocaleString('vi-VN')}$
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Search Action */}
                    {query.length >= 2 && (
                        <button
                            onClick={() => handleSearch()}
                            className="w-full px-4 py-3 border-t border-gray-100 text-sm text-[#C9A86C] hover:bg-[#C9A86C]/5 transition-colors flex items-center justify-center gap-2"
                        >
                            <Search size={16} />
                            Search "{query}"
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchBar;
