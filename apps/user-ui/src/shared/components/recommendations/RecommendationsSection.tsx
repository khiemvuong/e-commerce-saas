'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Eye,
  ShoppingCart,
  Heart,
  TrendingUp,
  Star,
  Tag,
  DollarSign,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Loader2,
  Sparkles,
  Palette,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import axiosInstance from '../../../utils/axiosInstance';

// ========== Types ==========
interface ScoreBreakdown {
  chatScore: number;
  behaviorScore: number;
  popularityScore: number;
  priceScore: number;
}

interface RecommendedProduct {
  productId: string;
  title: string;
  category: string;
  brand: string;
  price: number;
  image: string;
  slug: string;
  rating: number;
  totalSales: number;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  matchReasons: string[];
}

interface UserBehavior {
  viewedCategories: string[];
  cartBrands: string[];
  viewedProductCount: number;
  cartProductCount: number;
  wishlistProductCount: number;
  priceRange?: { min?: number; max?: number };
  preferredColors: string[];
}

interface ScoringWeights {
  chat: number;
  behavior: number;
  popularity: number;
  price: number;
}

interface ChatSession {
  keywords: string[];
  categories: string[];
  brands: string[];
  active: boolean;
}

// ========== Score Bar Component ==========
const ScoreBar = ({
  label,
  score,
  maxScore,
  color,
  icon: Icon,
  weight,
}: {
  label: string;
  score: number;
  maxScore: number;
  color: string;
  icon: any;
  weight: number;
}) => {
  const percentage = maxScore > 0 ? Math.min((score / maxScore) * 100, 100) : 0;

  return (
    <div className="flex items-center gap-3 group">
      <div className="flex items-center gap-1.5 w-[110px] flex-shrink-0">
        <Icon size={14} className={color} />
        <span className="text-xs font-medium text-gray-600 truncate">{label}</span>
      </div>
      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden relative">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(90deg, ${getGradientColors(color)})`,
          }}
        />
      </div>
      <div className="w-[70px] flex-shrink-0 text-right">
        <span className="text-xs font-bold text-gray-800">{score.toFixed(1)}</span>
        <span className="text-[10px] text-gray-400 ml-0.5">/{maxScore}</span>
      </div>
      <span className="text-[10px] text-gray-400 w-[32px] text-right flex-shrink-0">
        ×{weight}
      </span>
    </div>
  );
};

function getGradientColors(colorClass: string): string {
  if (colorClass.includes('blue')) return '#3b82f6, #60a5fa';
  if (colorClass.includes('green')) return '#22c55e, #4ade80';
  if (colorClass.includes('purple')) return '#a855f7, #c084fc';
  if (colorClass.includes('amber') || colorClass.includes('yellow')) return '#f59e0b, #fbbf24';
  return '#6b7280, #9ca3af';
}

// ========== Product Recommendation Card ==========
const RecommendationCard = ({
  product,
  rank,
  weights,
}: {
  product: RecommendedProduct;
  rank: number;
  weights: ScoringWeights;
}) => {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();

  const maxWeightedScore = 100;

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 group">
      {/* Product Header */}
      <div className="flex gap-4 p-4">
        {/* Rank Badge */}
        <div className="flex-shrink-0">
          <div 
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
              ${rank <= 3 
                ? 'bg-gradient-to-br from-[#C9A86C] to-[#B8956A] text-white shadow-md' 
                : 'bg-gray-100 text-gray-500'
              }`}
          >
            {rank}
          </div>
        </div>

        {/* Product Image */}
        <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50">
          {product.image ? (
            <img
              src={product.image}
              alt={product.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingCart size={24} className="text-gray-300" />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-tight mb-1">
            {product.title}
          </h4>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
            {product.category && (
              <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px]">
                {product.category}
              </span>
            )}
            {product.brand && (
              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px]">
                {product.brand}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-[#C9A86C]">
              ${product.price?.toLocaleString('en-US')}
            </span>
            {/* Total Score Badge */}
            <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-[#C9A86C]/10 to-[#B8956A]/10 rounded-full border border-[#C9A86C]/20">
              <Sparkles size={12} className="text-[#C9A86C]" />
              <span className="text-xs font-bold text-[#C9A86C]">{product.score.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Match Reasons Tags */}
      {product.matchReasons && product.matchReasons.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1">
          {product.matchReasons.slice(0, 4).map((reason, i) => (
            <span
              key={i}
              className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100"
            >
              ✓ {reason}
            </span>
          ))}
        </div>
      )}

      {/* Expand/Collapse Toggle */}
      <button
        className="w-full flex items-center justify-center gap-1 py-2 text-xs font-medium text-gray-400 hover:text-[#C9A86C] bg-gray-50/50 hover:bg-[#C9A86C]/5 transition-colors border-t border-gray-50"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <>
            Hide Score Breakdown <ChevronUp size={14} />
          </>
        ) : (
          <>
            Show Score Breakdown <ChevronDown size={14} />
          </>
        )}
      </button>

      {/* Score Breakdown (Expandable) */}
      {expanded && (
        <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100 space-y-2.5 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-1.5 mb-3">
            <BarChart3 size={14} className="text-[#C9A86C]" />
            <span className="text-xs font-semibold text-gray-700">
              Score Breakdown
            </span>
            <span className="text-[10px] text-gray-400 ml-auto">
              Formula: α·Chat + β·Behavior + γ·Popularity + δ·Price
            </span>
          </div>

          <ScoreBar
            label="Chat"
            score={product.scoreBreakdown.chatScore}
            maxScore={100}
            color="text-blue-500"
            icon={MessageSquare}
            weight={weights.chat}
          />
          <ScoreBar
            label="Behavior"
            score={product.scoreBreakdown.behaviorScore}
            maxScore={100}
            color="text-green-500"
            icon={TrendingUp}
            weight={weights.behavior}
          />
          <ScoreBar
            label="Popularity"
            score={product.scoreBreakdown.popularityScore}
            maxScore={100}
            color="text-purple-500"
            icon={Star}
            weight={weights.popularity}
          />
          <ScoreBar
            label="Price Match"
            score={product.scoreBreakdown.priceScore}
            maxScore={100}
            color="text-amber-500"
            icon={DollarSign}
            weight={weights.price}
          />

          {/* Weighted Total */}
          <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
            <div className="flex items-center gap-1.5 w-[110px] flex-shrink-0">
              <Sparkles size={14} className="text-[#C9A86C]" />
              <span className="text-xs font-bold text-gray-800">Total</span>
            </div>
            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${Math.min((product.score / maxWeightedScore) * 100, 100)}%`,
                  background: 'linear-gradient(90deg, #C9A86C, #B8956A)',
                }}
              />
            </div>
            <span className="text-sm font-bold text-[#C9A86C] w-[70px] text-right">
              {product.score.toFixed(1)}
            </span>
            <span className="w-[32px]" />
          </div>
        </div>
      )}

      {/* View Product */}
      <button
        className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-[#C9A86C] hover:bg-[#C9A86C]/5 transition-colors border-t border-gray-100"
        onClick={() => router.push(`/product/${product.slug || product.productId}`)}
      >
        View Product <ArrowRight size={14} />
      </button>
    </div>
  );
};

// ========== User Behavior Summary ==========
const BehaviorSummary = ({ behavior }: { behavior: UserBehavior }) => (
  <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
    <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
      <TrendingUp size={16} className="text-[#C9A86C]" />
      Your Activity Summary
    </h3>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="text-center p-3 bg-blue-50 rounded-lg">
        <Eye size={20} className="mx-auto text-blue-500 mb-1" />
        <p className="text-lg font-bold text-gray-800">{behavior.viewedProductCount}</p>
        <p className="text-[10px] text-gray-500 font-medium">Products Viewed</p>
      </div>
      <div className="text-center p-3 bg-green-50 rounded-lg">
        <ShoppingCart size={20} className="mx-auto text-green-500 mb-1" />
        <p className="text-lg font-bold text-gray-800">{behavior.cartProductCount}</p>
        <p className="text-[10px] text-gray-500 font-medium">Added to Cart</p>
      </div>
      <div className="text-center p-3 bg-pink-50 rounded-lg">
        <Heart size={20} className="mx-auto text-pink-500 mb-1" />
        <p className="text-lg font-bold text-gray-800">{behavior.wishlistProductCount}</p>
        <p className="text-[10px] text-gray-500 font-medium">Wishlisted</p>
      </div>
      <div className="text-center p-3 bg-amber-50 rounded-lg">
        <DollarSign size={20} className="mx-auto text-amber-500 mb-1" />
        <p className="text-sm font-bold text-gray-800">
          {behavior.priceRange
            ? `$${behavior.priceRange.min?.toFixed(0)} - $${behavior.priceRange.max?.toFixed(0)}`
            : 'N/A'}
        </p>
        <p className="text-[10px] text-gray-500 font-medium">Price Range</p>
      </div>
    </div>

    {/* Tags Row */}
    <div className="mt-4 flex flex-wrap gap-2">
      {behavior.viewedCategories.map((cat, i) => (
        <span
          key={`cat-${i}`}
          className="text-[11px] px-2.5 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-full border border-blue-100 font-medium flex items-center gap-1"
        >
          <Tag size={10} />
          {cat}
        </span>
      ))}
      {behavior.cartBrands.map((brand, i) => (
        <span
          key={`brand-${i}`}
          className="text-[11px] px-2.5 py-1 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 rounded-full border border-green-100 font-medium flex items-center gap-1"
        >
          <Star size={10} />
          {brand}
        </span>
      ))}
      {behavior.preferredColors.slice(0, 5).map((color, i) => (
        <span
          key={`color-${i}`}
          className="text-[11px] px-2.5 py-1 bg-gradient-to-r from-purple-50 to-fuchsia-50 text-purple-700 rounded-full border border-purple-100 font-medium flex items-center gap-1"
        >
          <Palette size={10} />
          {color}
        </span>
      ))}
    </div>
  </div>
);

// ========== Chat Session Banner ==========
const ChatSessionBanner = ({ chatSession }: { chatSession: ChatSession }) => {
  if (!chatSession.active) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare size={16} className="text-blue-400" />
          <span className="text-xs font-semibold text-blue-600">No Active Chat Session</span>
        </div>
        <p className="text-[11px] text-blue-500">
          Chat with our AI assistant to get personalized recommendations. Your chat queries will boost the Chat score!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare size={16} className="text-blue-500" />
        <span className="text-xs font-semibold text-blue-700">Chat Context Applied</span>
        <span className="ml-auto text-[10px] px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full font-medium">Snapshot</span>
      </div>
      <p className="text-[11px] text-blue-500 mb-2">
        Your chatbox conversations are influencing these recommendations:
      </p>
      <div className="flex flex-wrap gap-1.5">
        {chatSession.keywords.map((kw, i) => (
          <span key={`kw-${i}`} className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
            🔍 {kw}
          </span>
        ))}
        {chatSession.categories.map((cat, i) => (
          <span key={`cat-${i}`} className="text-[10px] px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded-full font-medium">
            📁 {cat}
          </span>
        ))}
        {chatSession.brands.map((brand, i) => (
          <span key={`brand-${i}`} className="text-[10px] px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-medium">
            🏷️ {brand}
          </span>
        ))}
      </div>
    </div>
  );
};

// ========== Scoring Weights Legend ==========
const WeightsLegend = ({ weights }: { weights: ScoringWeights }) => (
  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 mb-6 border border-gray-200">
    <h4 className="text-xs font-semibold text-gray-600 mb-3 flex items-center gap-1.5">
      <BarChart3 size={14} />
      Scoring Formula: Score(P) = α·S_chat + β·S_behavior + γ·S_popularity + δ·S_price
    </h4>
    <div className="flex flex-wrap gap-4">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-500" />
        <span className="text-[11px] text-gray-600">
          <span className="font-semibold">α = {weights.chat}</span> Chat Relevance
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-green-500" />
        <span className="text-[11px] text-gray-600">
          <span className="font-semibold">β = {weights.behavior}</span> User Behavior
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-purple-500" />
        <span className="text-[11px] text-gray-600">
          <span className="font-semibold">γ = {weights.popularity}</span> Popularity
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-500" />
        <span className="text-[11px] text-gray-600">
          <span className="font-semibold">δ = {weights.price}</span> Price Match
        </span>
      </div>
    </div>
  </div>
);

// ========== Main Component ==========
const RecommendationsSection = ({ userId }: { userId: string }) => {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);
  const [userBehavior, setUserBehavior] = useState<UserBehavior | null>(null);
  const [weights, setWeights] = useState<ScoringWeights>({
    chat: 0.35,
    behavior: 0.30,
    popularity: 0.20,
    price: 0.15,
  });
  const [error, setError] = useState<string | null>(null);
  const [chatSession, setChatSession] = useState<ChatSession>({ keywords: [], categories: [], brands: [], active: false });

  const fetchRecommendations = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);

      const res = await axiosInstance.get(`/ai-chat/api/chat/user-recommendations/${userId}`);
      const data = res.data;

      if (data.success) {
        setRecommendations(data.data.recommendations || []);
        setUserBehavior(data.data.userBehavior || null);
        if (data.data.scoringWeights) setWeights(data.data.scoringWeights);
        if (data.data.chatSession) setChatSession(data.data.chatSession);
      } else {
        setError(data.error || 'Failed to load recommendations');
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to connect to recommendation service');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 size={32} className="animate-spin text-[#C9A86C]" />
        <p className="text-sm text-gray-500 font-medium">Analyzing your interests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={20} className="text-[#C9A86C]" />
        <h2 className="text-lg font-bold text-gray-800">Recommended For You</h2>
        <span className="text-xs text-gray-400 ml-auto">{recommendations.length} products</span>
        <button
          onClick={fetchRecommendations}
          disabled={loading}
          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-[#C9A86C] bg-[#C9A86C]/5 border border-[#C9A86C]/20 rounded-lg hover:bg-[#C9A86C]/10 transition-colors disabled:opacity-50"
          title="Refresh to include latest chat context"
        >
          <Loader2 size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Chat Session Banner */}
      <ChatSessionBanner chatSession={chatSession} />

      {/* User Behavior Summary */}
      {userBehavior && <BehaviorSummary behavior={userBehavior} />}

      {/* Scoring Weights Legend */}
      <WeightsLegend weights={weights} />

      {/* Recommendations Grid */}
      {recommendations.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {recommendations.map((product, i) => (
            <RecommendationCard
              key={product.productId}
              product={product}
              rank={i + 1}
              weights={weights}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <ShoppingCart size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500 font-medium">No recommendations yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Browse and interact with products to get personalized recommendations
          </p>
        </div>
      )}
    </div>
  );
};

export default RecommendationsSection;
