"use client";
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, ArrowUpRight, Star, ShoppingBag } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from 'apps/user-ui/src/utils/axiosInstance';
import useUser from 'apps/user-ui/src/hooks/useUser';

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

const RecommendedForYouSection = () => {
  const { user } = useUser();
  const router = useRouter();

  const { data, isLoading } = useQuery<{ recommendations: Recommendation[] }>({
    queryKey: ['homeRecommendations', user?.id],
    queryFn: async () => {
      const res = await axiosInstance.get(
        `/ai-chat/api/chat/search-recommendations${user?.id ? `?userId=${user.id}&limit=8` : '?limit=8'}`
      );
      return res.data;
    },
    staleTime: 60_000,
  });

  const recommendations = data?.recommendations || [];

  // Don't render if no recommendations
  if (!isLoading && recommendations.length === 0) return null;

  return (
    <section className="py-16 md:py-20 relative">
      {/* Subtle accent glow */}
      <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-gradient-to-r from-[#C9A86C]/5 to-transparent rounded-full blur-3xl pointer-events-none -translate-y-1/2" />

      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-10 md:mb-14 relative"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#C9A86C]/20 to-[#C9A86C]/5 rounded-xl flex items-center justify-center border border-[#C9A86C]/20">
                <Sparkles className="w-6 h-6 text-[#C9A86C]" />
              </div>
              <div className="w-12 h-[2px] bg-gradient-to-r from-[#C9A86C] to-transparent" />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">
              Recommended For You
            </h2>
            <p className="text-gray-500 text-base md:text-lg mt-3 max-w-lg">
              AI-curated picks based on your browsing history and preferences
            </p>
          </div>

          {user?.id && (
            <Link
              href="/profile?tab=recommendations"
              className="group inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-full hover:bg-gray-800 transition-all duration-300 cursor-pointer"
            >
              <span>View All</span>
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          )}
        </div>
      </motion.div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl overflow-hidden animate-pulse"
            >
              <div className="aspect-square bg-gradient-to-br from-[#C9A86C]/5 to-gray-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6"
        >
          {recommendations.map((rec, index) => (
            <motion.div
              key={rec.productId}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <button
                onClick={() => router.push(`/product/${rec.slug || rec.productId}`)}
                className="group w-full text-left bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:border-[#C9A86C]/30 transition-all duration-300 cursor-pointer"
              >
                {/* Image */}
                <div className="aspect-square bg-gray-50 overflow-hidden relative">
                  {rec.image ? (
                    <img
                      src={rec.image}
                      alt={rec.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag size={40} className="text-gray-200" />
                    </div>
                  )}

                  {/* AI Score Badge */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full shadow-sm border border-[#C9A86C]/20">
                    <Sparkles size={10} className="text-[#C9A86C]" />
                    <span className="text-[10px] font-bold text-[#C9A86C]">{rec.score.toFixed(1)}</span>
                  </div>

                  {/* Rating */}
                  {rec.rating && rec.rating > 0 && (
                    <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full shadow-sm">
                      <Star size={10} className="fill-amber-400 text-amber-400" />
                      <span className="text-[10px] font-semibold text-gray-700">{rec.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug mb-2 group-hover:text-gray-900 transition-colors">
                    {rec.title}
                  </p>

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-[#C9A86C]">
                      ${rec.price?.toLocaleString('en-US')}
                    </span>
                    {rec.brand && (
                      <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium truncate max-w-[80px]">
                        {rec.brand}
                      </span>
                    )}
                  </div>

                  {/* Match Reasons */}
                  {rec.matchReasons.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {rec.matchReasons.slice(0, 2).map((reason, i) => (
                        <span
                          key={i}
                          className="text-[9px] px-2 py-0.5 bg-[#C9A86C]/10 text-[#9A7D4E] font-medium rounded-md"
                        >
                          ✓ {reason}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* AI Attribution */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center"
      >
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
          <Sparkles size={12} className="text-[#C9A86C]" />
          Powered by AI · Based on your activity
        </span>
      </motion.div>
    </section>
  );
};

export default RecommendedForYouSection;
