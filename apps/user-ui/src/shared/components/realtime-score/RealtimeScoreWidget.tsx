'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Target,
  Eye,
  ShoppingCart,
  Heart,
  MessageSquare,
  TrendingUp,
  DollarSign,
  Zap,
  X,
  Wifi,
  WifiOff,
  Activity,
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import useUser from '../../../hooks/useUser';

// ========== Types ==========
interface ScoreBreakdown {
  chatScore: number;
  behaviorScore: number;
  popularityScore: number;
  priceScore: number;
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

interface TopProduct {
  title: string;
  score: number;
  category: string;
  brand?: string;
  price: number;
  breakdown: ScoreBreakdown;
  matchReasons: string[];
}

interface TriggerInfo {
  action: string;
  productId?: string;
  productTitle?: string;
  timestamp: string;
}

interface ScorePayload {
  totalScore: number;
  breakdown: ScoreBreakdown;
  userBehavior: UserBehavior;
  topProducts: TopProduct[];
  scoringWeights: { chat: number; behavior: number; popularity: number; price: number };
  trigger?: TriggerInfo;
  timestamp: string;
}

// Action history entry (frontend-only, tracks score deltas)
interface ActionEntry {
  id: string;
  action: string;
  productTitle?: string;
  scoreBefore: number;
  scoreAfter: number;
  delta: number;
  breakdown: ScoreBreakdown;
  timestamp: Date;
}

// ========== Constants ==========
const ACTION_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  product_view: { label: 'Viewed', icon: '👁', color: 'text-blue-500 bg-blue-50' },
  add_to_cart: { label: 'Added to Cart', icon: '🛒', color: 'text-emerald-600 bg-emerald-50' },
  add_to_wishlist: { label: 'Wishlisted', icon: '❤️', color: 'text-rose-500 bg-rose-50' },
  purchase: { label: 'Purchased', icon: '💰', color: 'text-amber-600 bg-amber-50' },
  remove_from_cart: { label: 'Removed from Cart', icon: '🗑', color: 'text-gray-500 bg-gray-50' },
  remove_from_wishlist: { label: 'Unwishlisted', icon: '💔', color: 'text-gray-400 bg-gray-50' },
  search_intent: { label: 'Searched', icon: '🔍', color: 'text-indigo-500 bg-indigo-50' },
  chat_message: { label: 'Chat', icon: '💬', color: 'text-cyan-500 bg-cyan-50' },
};

// ========== Animated Counter Hook ==========
function useAnimatedNumber(target: number, duration = 500): number {
  const [current, setCurrent] = useState(target);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const start = current;
    const diff = target - start;
    if (Math.abs(diff) < 0.1) { setCurrent(target); return; }
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round((start + diff * eased) * 10) / 10);
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return current;
}

// ========== Score Bar Component ==========
const ScoreBar = ({
  label, value, color, icon: Icon, weight, prevValue,
}: {
  label: string; value: number; color: string; icon: React.ElementType; weight: number; prevValue?: number;
}) => {
  const pct = Math.min((value / 100) * 100, 100);
  const animVal = useAnimatedNumber(value);
  const delta = prevValue !== undefined ? value - prevValue : 0;

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 text-gray-600 font-medium">
          <Icon size={11} className={color} />
          <span>{label}</span>
          <span className="text-gray-300 text-[9px]">×{weight}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-bold text-gray-800 text-xs">{animVal.toFixed(1)}</span>
          {delta !== 0 && (
            <span className={`text-[9px] font-bold ${delta > 0 ? 'text-green-500' : 'text-red-400'}`}>
              {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}
            </span>
          )}
        </div>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color.replace('text-', 'bg-')}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// ========== Main Widget ==========
const RealtimeScoreWidget = () => {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [scoreData, setScoreData] = useState<ScorePayload | null>(null);
  const [prevBreakdown, setPrevBreakdown] = useState<ScoreBreakdown | null>(null);
  const [connected, setConnected] = useState(false);
  const [section, setSection] = useState<'scores' | 'feed'>('feed');
  const [actionHistory, setActionHistory] = useState<ActionEntry[]>([]);
  const [hasUpdate, setHasUpdate] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const prevScoreRef = useRef<number>(0);

  // Connect WebSocket
  useEffect(() => {
    if (!user?.id) return;

    const wsUrl = process.env.NEXT_PUBLIC_RECOMMENDATION_WS_URL || 'http://localhost:6007';
    const socket = io(wsUrl, {
      path: '/ws/score',
      transports: ['websocket', 'polling'],
      query: { userId: user.id },
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('score:update', (data: ScorePayload) => {
      // Track deltas
      setPrevBreakdown(scoreData?.breakdown || null);
      setScoreData(data);

      // Add to action history if triggered by an action
      if (data.trigger) {
        const entry: ActionEntry = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          action: data.trigger.action,
          productTitle: data.trigger.productTitle,
          scoreBefore: prevScoreRef.current,
          scoreAfter: data.totalScore,
          delta: data.totalScore - prevScoreRef.current,
          breakdown: data.breakdown,
          timestamp: new Date(),
        };
        setActionHistory(prev => [entry, ...prev].slice(0, 30)); // Keep last 30
      }

      // Flash animation
      if (prevScoreRef.current !== 0 && Math.abs(data.totalScore - prevScoreRef.current) > 0.3) {
        setHasUpdate(true);
        setTimeout(() => setHasUpdate(false), 2500);
      }
      prevScoreRef.current = data.totalScore;
    });

    socketRef.current = socket;
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [user?.id]);

  const handleRefresh = useCallback(() => {
    socketRef.current?.emit('score:refresh');
  }, []);

  const animatedTotal = useAnimatedNumber(scoreData?.totalScore ?? 0);

  if (!user?.id) return null;

  return (
    <>
      {/* ===== Expanded Panel — LEFT SIDE ===== */}
      <div
        className={`fixed bottom-6 left-4 sm:left-6 z-[998] w-[340px] max-w-[calc(100vw-2rem)] transition-all duration-300 ease-out origin-bottom-left ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/60 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                <Activity size={16} className="text-white" />
              </div>
              <div>
                <h3 className="text-white text-sm font-semibold">Score Monitor</h3>
                <div className="flex items-center gap-1.5">
                  {connected ? (
                    <><Wifi size={9} className="text-green-400" /><span className="text-[9px] text-green-400">Live</span></>
                  ) : (
                    <><WifiOff size={9} className="text-red-400" /><span className="text-[9px] text-red-400">Offline</span></>
                  )}
                  <span className="text-[9px] text-gray-500">·</span>
                  <span className="text-[9px] text-gray-400">{actionHistory.length} events</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={handleRefresh} className="text-[10px] text-gray-400 hover:text-white transition-colors px-1.5 py-0.5">↻</button>
              <button onClick={() => setIsOpen(false)} className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <X size={14} className="text-white" />
              </button>
            </div>
          </div>

          {/* Score Summary Strip */}
          {scoreData && (
            <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex items-center gap-4">
              {/* Ring */}
              <div className="relative w-14 h-14 flex-shrink-0">
                <svg className="w-14 h-14 -rotate-90">
                  <circle cx="28" cy="28" r="22" fill="none" stroke="#f3f4f6" strokeWidth="4" />
                  <circle cx="28" cy="28" r="22" fill="none" stroke="url(#scoreGrad2)" strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={`${(animatedTotal / 100) * 138.2} 138.2`} className="transition-all duration-700" />
                  <defs><linearGradient id="scoreGrad2" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#ef4444" /></linearGradient></defs>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-800">{animatedTotal.toFixed(1)}</span>
              </div>
              {/* Mini bars */}
              <div className="flex-1 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                <MiniStat icon="💬" label="Chat" value={scoreData.breakdown.chatScore} prev={prevBreakdown?.chatScore} />
                <MiniStat icon="👁" label="Behavior" value={scoreData.breakdown.behaviorScore} prev={prevBreakdown?.behaviorScore} />
                <MiniStat icon="📈" label="Popularity" value={scoreData.breakdown.popularityScore} prev={prevBreakdown?.popularityScore} />
                <MiniStat icon="💰" label="Price" value={scoreData.breakdown.priceScore} prev={prevBreakdown?.priceScore} />
              </div>
            </div>
          )}

          {/* Tab Switcher */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setSection('feed')}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${section === 'feed' ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-50/30' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Activity size={12} className="inline mr-1 -mt-0.5" /> Live Feed
            </button>
            <button
              onClick={() => setSection('scores')}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${section === 'scores' ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-50/30' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Target size={12} className="inline mr-1 -mt-0.5" /> Details
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[45vh] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {!scoreData ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                <Activity size={32} className="mx-auto mb-2 opacity-40" />
                <p>Waiting for data...</p>
                <button onClick={handleRefresh} className="mt-2 text-xs text-amber-500 hover:text-amber-600 underline">Refresh</button>
              </div>
            ) : section === 'feed' ? (
              /* ===== LIVE FEED TAB ===== */
              <div className="divide-y divide-gray-50">
                {actionHistory.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-400 text-xs">
                    <Zap size={20} className="mx-auto mb-2 opacity-40" />
                    <p>Perform an action to see score changes</p>
                    <p className="text-[10px] mt-1 text-gray-300">View products, add to cart, wishlist, etc.</p>
                  </div>
                ) : (
                  actionHistory.map((entry) => {
                    const meta = ACTION_LABELS[entry.action] || { label: entry.action, icon: '⚡', color: 'text-gray-500 bg-gray-50' };
                    return (
                      <div key={entry.id} className="px-4 py-2.5 hover:bg-gray-50/50 transition-colors animate-in slide-in-from-left-3 duration-300">
                        <div className="flex items-start gap-2.5">
                          {/* Action icon */}
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${meta.color}`}>
                            {meta.icon}
                          </div>
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-gray-700">{meta.label}</span>
                              <span className={`text-xs font-bold ${entry.delta > 0 ? 'text-green-500' : entry.delta < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                                {entry.delta > 0 ? `+${entry.delta.toFixed(1)}` : entry.delta === 0 ? '0' : entry.delta.toFixed(1)}
                              </span>
                            </div>
                            {entry.productTitle && (
                              <p className="text-[10px] text-gray-400 truncate">{entry.productTitle}</p>
                            )}
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] text-gray-300">
                                {entry.scoreBefore.toFixed(1)} → {entry.scoreAfter.toFixed(1)}
                              </span>
                              <span className="text-[9px] text-gray-300">
                                {formatTimeAgo(entry.timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              /* ===== DETAILS TAB ===== */
              <div className="p-4 space-y-3">
                {/* Score Bars */}
                <ScoreBar label="Chat Relevance" value={scoreData.breakdown.chatScore} color="text-blue-500" icon={MessageSquare} weight={scoreData.scoringWeights.chat} prevValue={prevBreakdown?.chatScore} />
                <ScoreBar label="Behavior" value={scoreData.breakdown.behaviorScore} color="text-emerald-500" icon={Eye} weight={scoreData.scoringWeights.behavior} prevValue={prevBreakdown?.behaviorScore} />
                <ScoreBar label="Popularity" value={scoreData.breakdown.popularityScore} color="text-amber-500" icon={TrendingUp} weight={scoreData.scoringWeights.popularity} prevValue={prevBreakdown?.popularityScore} />
                <ScoreBar label="Price Match" value={scoreData.breakdown.priceScore} color="text-rose-500" icon={DollarSign} weight={scoreData.scoringWeights.price} prevValue={prevBreakdown?.priceScore} />

                {/* User Behavior */}
                <div className="border-t border-gray-100 pt-3 mt-3">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">User Behavior</p>
                  <div className="grid grid-cols-3 gap-2">
                    <StatCard icon={Eye} label="Views" value={scoreData.userBehavior.viewedProductCount} color="bg-blue-50 text-blue-600" />
                    <StatCard icon={ShoppingCart} label="Cart" value={scoreData.userBehavior.cartProductCount} color="bg-emerald-50 text-emerald-600" />
                    <StatCard icon={Heart} label="Wishlist" value={scoreData.userBehavior.wishlistProductCount} color="bg-rose-50 text-rose-600" />
                  </div>
                  {scoreData.userBehavior.viewedCategories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {scoreData.userBehavior.viewedCategories.slice(0, 5).map((cat, i) => (
                        <span key={i} className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">{cat}</span>
                      ))}
                    </div>
                  )}
                  {scoreData.userBehavior.cartBrands.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {scoreData.userBehavior.cartBrands.slice(0, 5).map((brand, i) => (
                        <span key={i} className="text-[9px] px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded-full font-medium">{brand}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Top Products */}
                {scoreData.topProducts.length > 0 && (
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Top Scored Products</p>
                    <div className="space-y-1.5">
                      {scoreData.topProducts.map((prod, i) => (
                        <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                          <div className="w-6 h-6 rounded bg-amber-100 text-amber-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold text-gray-700 truncate">{prod.title}</p>
                            <div className="flex gap-2 text-[8px] text-gray-400">
                              <span>💬{prod.breakdown.chatScore}</span>
                              <span>👁{prod.breakdown.behaviorScore}</span>
                              <span>📈{prod.breakdown.popularityScore}</span>
                              <span>💰{prod.breakdown.priceScore}</span>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-amber-600 flex-shrink-0">{prod.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer formula */}
          <div className="px-4 py-1.5 bg-gray-50/80 border-t border-gray-100">
            <p className="text-[8px] text-gray-400 text-center">Score = α·Chat + β·Behavior + γ·Popularity + δ·Price</p>
          </div>
        </div>
      </div>

      {/* ===== Collapsed Bubble — LEFT SIDE ===== */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 left-4 sm:left-6 z-[998] group transition-all duration-300 ${
          isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'
        }`}
        aria-label="Open Score Monitor"
      >
        {hasUpdate && <span className="absolute inset-0 rounded-full bg-amber-400/40 animate-ping" />}

        <div className={`relative flex items-center gap-2 pl-2.5 pr-3 py-2 rounded-full shadow-lg transition-all ${
          connected ? 'bg-gradient-to-r from-[#0f172a] to-[#1e293b] hover:shadow-xl hover:scale-105' : 'bg-gray-400'
        }`}>
          <Activity size={14} className="text-amber-400" />
          <span className={`text-sm font-bold transition-all duration-500 ${hasUpdate ? 'text-amber-300 scale-110' : 'text-white'}`}>
            {scoreData ? animatedTotal.toFixed(1) : '—'}
          </span>
          {scoreData && actionHistory.length > 0 && actionHistory[0].delta !== 0 && (
            <span className={`text-[10px] font-bold ${actionHistory[0].delta > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {actionHistory[0].delta > 0 ? `+${actionHistory[0].delta.toFixed(1)}` : actionHistory[0].delta.toFixed(1)}
            </span>
          )}
          {connected && <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />}
        </div>

        <span className="absolute bottom-full left-0 mb-2 px-3 py-1.5 bg-gray-800 text-white text-[10px] rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
          Score Monitor — Click to expand
          <span className="absolute top-full left-4 border-4 border-transparent border-t-gray-800" />
        </span>
      </button>
    </>
  );
};

// ========== Helper Components ==========

const MiniStat = ({ icon, label, value, prev }: { icon: string; label: string; value: number; prev?: number }) => {
  const delta = prev !== undefined ? value - prev : 0;
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px]">{icon}</span>
      <span className="text-[10px] text-gray-500">{label}</span>
      <span className="text-[10px] font-bold text-gray-700 ml-auto">{value.toFixed(0)}</span>
      {delta !== 0 && (
        <span className={`text-[8px] font-bold ${delta > 0 ? 'text-green-500' : 'text-red-400'}`}>
          {delta > 0 ? '+' : ''}{delta.toFixed(1)}
        </span>
      )}
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) => (
  <div className={`rounded-lg p-2 text-center ${color}`}>
    <Icon size={12} className="mx-auto mb-0.5" />
    <p className="text-base font-bold leading-tight">{value}</p>
    <p className="text-[9px] opacity-70">{label}</p>
  </div>
);

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  if (diff < 5000) return 'just now';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

export default RealtimeScoreWidget;
