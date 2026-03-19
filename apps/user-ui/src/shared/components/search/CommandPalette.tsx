'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Loader2,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Star,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from 'apps/user-ui/src/utils/axiosInstance';
import useUser from 'apps/user-ui/src/hooks/useUser';
import { debounce } from '../../../utils/helpers';

// ========== Types ==========

interface SearchSuggestion {
  suggestions: string[];
  didYouMean: string | null;
  products: {
    id: string;
    title: string;
    slug: string;
    price?: number;
    sale_price?: number;
    regular_price?: number;
    compareAtPrice?: number;
    images: { file_url: string }[];
  }[];
}

interface Recommendation {
  productId: string;
  title: string;
  price: number;
  image?: string;
  slug?: string;
  score: number;
  matchReasons: string[];
  brand?: string;
  rating?: number;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

// ========== Component ==========

const CommandPalette = ({ isOpen, onClose }: CommandPaletteProps) => {
  const router = useRouter();
  const { user } = useUser();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  const updateDebounced = useCallback(
    debounce((val: string) => setDebouncedQuery(val), 300),
    []
  );

  // Suggestions from product service (when typing)
  const { data: suggestions, isLoading: isSuggestLoading } = useQuery<SearchSuggestion>({
    queryKey: ['cmdPaletteSuggestions', debouncedQuery],
    queryFn: async () => {
      if (debouncedQuery.length < 2) return { suggestions: [], products: [] };
      const res = await axiosInstance.get(
        `/product/api/search-suggestions?keyword=${encodeURIComponent(debouncedQuery)}&limit=6`
      );
      return res.data;
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 30_000,
  });

  // AI recommendations for empty state
  const { data: recommendations } = useQuery<{ recommendations: Recommendation[] }>({
    queryKey: ['searchRecommendations', user?.id],
    queryFn: async () => {
      const res = await axiosInstance.get(
        `/ai-chat/api/chat/search-recommendations${user?.id ? `?userId=${user.id}` : ''}`
      );
      return res.data;
    },
    enabled: isOpen,
    staleTime: 30_000,
  });

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setDebouncedQuery('');
      setSelectedIndex(-1);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedIndex(-1);
    updateDebounced(val);
  };

  // Track search intent (fire-and-forget)
  const trackSearchIntent = useCallback(
    (keyword: string) => {
      if (!user?.id || keyword.length < 2) return;
      try {
        // Use sendBeacon for non-blocking fire-and-forget
        const payload = JSON.stringify({ userId: user.id, keyword });
        if (navigator.sendBeacon) {
          const blob = new Blob([payload], { type: 'application/json' });
          navigator.sendBeacon(
            `${(axiosInstance.defaults.baseURL || '')}/ai-chat/api/chat/search-intent`,
            blob
          );
        } else {
          // Fallback: keepalive fetch
          fetch(`${(axiosInstance.defaults.baseURL || '')}/ai-chat/api/chat/search-intent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true,
          }).catch(() => {});
        }
      } catch {
        // Silent fail
      }
    },
    [user?.id]
  );

  const handleSearch = (searchQuery?: string) => {
    const final = (searchQuery || query).trim();
    if (!final) return;
    trackSearchIntent(final);
    router.push(`/products?search=${encodeURIComponent(final)}`);
    onClose();
  };

  const handleProductClick = (slug: string) => {
    trackSearchIntent(query.trim());
    router.push(`/product/${slug}`);
    onClose();
  };

  // Build flat list for keyboard navigation
  const allItems: { type: 'suggestion' | 'product' | 'rec'; value: string; label: string; slug?: string }[] = [];

  if (query.length >= 2) {
    suggestions?.suggestions?.forEach(s => allItems.push({ type: 'suggestion', value: s, label: s }));
    suggestions?.products?.forEach(p => allItems.push({ type: 'product', value: p.slug, label: p.title, slug: p.slug }));
  } else {
    recommendations?.recommendations?.forEach(r =>
      allItems.push({ type: 'rec', value: r.slug || r.productId, label: r.title, slug: r.slug })
    );
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, allItems.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && allItems[selectedIndex]) {
          const item = allItems[selectedIndex];
          if (item.type === 'suggestion') {
            handleSearch(item.value);
          } else {
            handleProductClick(item.slug || item.value);
          }
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        onClose();
        break;
    }
  };

  if (!isOpen) return null;

  const hasQuery = query.length >= 2;
  const hasProducts = (suggestions?.products?.length || 0) > 0;
  const hasSuggestions = (suggestions?.suggestions?.length || 0) > 0;
  const hasRecs = (recommendations?.recommendations?.length || 0) > 0;
  const noResults = hasQuery && !isSuggestLoading && !hasProducts && !hasSuggestions;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />

      {/* Palette */}
      <div
        className="relative w-full max-w-2xl mt-[10vh] mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-300"
        style={{ maxHeight: '75vh' }}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <Search size={20} className="text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Search products, brands, categories..."
            className="flex-1 text-lg text-gray-800 placeholder-gray-400 outline-none bg-transparent"
            autoComplete="off"
          />
          {isSuggestLoading && <Loader2 size={18} className="text-gray-400 animate-spin" />}
          {query && (
            <button onClick={() => { setQuery(''); setDebouncedQuery(''); setSelectedIndex(-1); }} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={16} className="text-gray-400" />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-0.5 px-2 py-1 bg-gray-100 rounded-md text-[11px] text-gray-400 font-medium">
            ESC
          </kbd>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(75vh - 72px - 44px)' }}>
          {/* ── Empty State: Recommendations ── */}
          {!hasQuery && hasRecs && (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3 px-1">
                <Sparkles size={14} className="text-[#C9A86C]" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Recommended for you
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {recommendations!.recommendations.map((rec, i) => (
                  <button
                    key={rec.productId}
                    onClick={() => handleProductClick(rec.slug || rec.productId)}
                    className={`group text-left rounded-xl border transition-all duration-200 overflow-hidden ${
                      selectedIndex === i
                        ? 'border-[#C9A86C] shadow-md bg-[#C9A86C]/5'
                        : 'border-gray-100 hover:border-[#C9A86C]/40 hover:shadow-md'
                    }`}
                  >
                    {rec.image ? (
                      <div className="aspect-square bg-gray-50 overflow-hidden">
                        <img
                          src={rec.image}
                          alt={rec.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square bg-gray-100 flex items-center justify-center">
                        <Search size={24} className="text-gray-300" />
                      </div>
                    )}
                    <div className="p-2.5">
                      <p className="text-xs font-medium text-gray-800 line-clamp-2 leading-snug">
                        {rec.title}
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-sm font-bold text-[#C9A86C]">
                          ${rec.price}
                        </span>
                        {rec.rating && rec.rating > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                            <Star size={10} className="fill-amber-400 text-amber-400" />
                            {rec.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                      {rec.matchReasons.length > 0 && (
                        <span className="inline-block mt-1.5 px-1.5 py-0.5 bg-[#C9A86C]/10 text-[#9A7D4E] text-[9px] font-medium rounded-md">
                          {rec.matchReasons[0]}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Empty State: No Recs (anonymous/fresh user) ── */}
          {!hasQuery && !hasRecs && (
            <div className="px-5 py-8 text-center">
              <Search size={36} className="mx-auto mb-3 text-gray-200" />
              <p className="text-sm text-gray-500">Start typing to search products</p>
              <p className="text-xs text-gray-400 mt-1">Try &quot;sony headphones&quot; or &quot;nike shoes&quot;</p>
            </div>
          )}

          {/* ── No Results + Did You Mean ── */}
          {noResults && (
            <div className="px-5 py-8 text-center">
              <Search size={36} className="mx-auto mb-3 text-gray-200" />
              <p className="text-sm text-gray-500">No results for &quot;{query}&quot;</p>
              {suggestions?.didYouMean ? (
                <button
                  onClick={() => {
                    setQuery(suggestions.didYouMean!);
                    setDebouncedQuery(suggestions.didYouMean!);
                    setSelectedIndex(-1);
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 text-sm text-[#C9A86C] hover:text-[#b8954f] transition-colors cursor-pointer"
                >
                  Did you mean:
                  <span className="font-semibold underline underline-offset-2">
                    {suggestions.didYouMean}
                  </span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <p className="text-xs text-gray-400 mt-1">Try a different keyword</p>
              )}
            </div>
          )}

          {/* ── Keyword Suggestions ── */}
          {hasQuery && hasSuggestions && (
            <div className="py-2">
              <p className="px-5 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Suggestions
              </p>
              {suggestions!.suggestions.map((s, i) => (
                <button
                  key={`s-${i}`}
                  onClick={() => handleSearch(s)}
                  className={`w-full px-5 py-2.5 flex items-center gap-3 text-left transition-colors ${
                    selectedIndex === i
                      ? 'bg-[#C9A86C]/10 text-[#C9A86C]'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <TrendingUp size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="text-sm">{s}</span>
                  <ArrowRight size={14} className="ml-auto text-gray-300" />
                </button>
              ))}
            </div>
          )}

          {/* ── Product Results ── */}
          {hasQuery && hasProducts && (
            <div className={`py-2 ${hasSuggestions ? 'border-t border-gray-100' : ''}`}>
              <p className="px-5 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Products
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 px-4 pb-2">
                {suggestions!.products.map((product, i) => {
                  const itemIdx = (suggestions?.suggestions?.length || 0) + i;
                  return (
                    <button
                      key={product.id}
                      onClick={() => handleProductClick(product.slug)}
                      className={`group text-left rounded-xl border overflow-hidden transition-all duration-200 ${
                        selectedIndex === itemIdx
                          ? 'border-[#C9A86C] shadow-md bg-[#C9A86C]/5'
                          : 'border-gray-100 hover:border-[#C9A86C]/40 hover:shadow-md'
                      }`}
                    >
                      {product.images?.[0]?.file_url ? (
                        <div className="aspect-square bg-gray-50 overflow-hidden">
                          <img
                            src={product.images[0].file_url}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="aspect-square bg-gray-100 flex items-center justify-center">
                          <Search size={24} className="text-gray-300" />
                        </div>
                      )}
                      <div className="p-2.5">
                        <p className="text-xs font-medium text-gray-800 line-clamp-2 leading-snug">
                          {product.title}
                        </p>
                        <p className="text-sm font-bold text-[#C9A86C] mt-1">
                          ${product.price || product.sale_price || product.regular_price || product.compareAtPrice || 0}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Search All ── */}
          {hasQuery && !noResults && (
            <div className="border-t border-gray-100">
              <button
                onClick={() => handleSearch()}
                className="w-full px-5 py-3 text-sm text-[#C9A86C] hover:bg-[#C9A86C]/5 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <Search size={14} />
                Search all results for &quot;{query}&quot;
              </button>
            </div>
          )}
        </div>

        {/* Footer — Keyboard Hints */}
        <div className="flex items-center justify-between px-5 py-2.5 border-t border-gray-100 bg-gray-50/80 text-[11px] text-gray-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px]">↑↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px]">↵</kbd>
              select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px]">esc</kbd>
              close
            </span>
          </div>
          <span className="flex items-center gap-1 text-[#C9A86C]">
            <Sparkles size={10} />
            AI-powered
          </span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
