'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Bot,
  User,
  Loader2,
  ChevronDown,
  RotateCcw,
  ChevronRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import useUser from '../../../hooks/useUser';
import axiosInstance from '../../../utils/axiosInstance';

// ========== Types ==========
interface ChatMessage {
  id: string;
  senderType: 'user' | 'ai';
  content: string;
  timestamp: Date;
  recommendations?: ProductRecommendation[];
  quickReplies?: string[];
  intent?: string;
  /** Comparison table data */
  comparison?: ComparisonData;
  /** Clarification options */
  clarification?: ClarificationData;
  /** Fallback/typo correction info */
  fallback?: FallbackData;
  /** Whether this was a follow-up resolution */
  isFollowUp?: boolean;
}

interface ProductRecommendation {
  productId: string;
  title: string;
  price: number;
  image?: string;
  slug?: string;
  score: number;
  matchReasons: string[];
  specs?: Record<string, any>;
}

/** Pick 2 most relevant spec badges for display */
const SPEC_BADGE_PRIORITY: Array<{ key: string; label: (v: any) => string; icon: string }> = [
  { key: 'ram_gb', label: (v) => `${v}GB RAM`, icon: '🧠' },
  { key: 'storage_gb', label: (v) => v >= 1024 ? `${(v/1024).toFixed(0)}TB` : `${v}GB`, icon: '💾' },
  { key: 'battery_hours', label: (v) => `${v}h Battery`, icon: '🔋' },
  { key: 'battery_mah', label: (v) => `${v}mAh`, icon: '🔋' },
  { key: 'camera_mp', label: (v) => `${v}MP Camera`, icon: '📷' },
  { key: 'display_size', label: (v) => `${v}`, icon: '📱' },
  { key: 'cpu', label: (v) => String(v).split(' ').slice(0, 2).join(' '), icon: '💻' },
  { key: 'driver_mm', label: (v) => `${v}mm Driver`, icon: '🔊' },
];

function getSpecBadges(specs?: Record<string, any>): Array<{ text: string; icon: string }> {
  if (!specs) return [];
  const badges: Array<{ text: string; icon: string }> = [];
  for (const { key, label, icon } of SPEC_BADGE_PRIORITY) {
    if (specs[key] !== undefined && specs[key] !== null) {
      badges.push({ text: label(specs[key]), icon });
      if (badges.length >= 2) break;
    }
  }
  return badges;
}

interface ComparisonData {
  products: Array<{
    id: string;
    title: string;
    brand: string;
    price: number;
    image: string;
    rating: number;
    slug?: string;
  }>;
  comparisonTable: Array<{
    field: string;
    values: (string | number)[];
    winner?: number;
    icon?: string;
  }>;
  verdict: string;
}

interface ClarificationData {
  question: string;
  options: Array<{ label: string; value: string; description?: string }>;
  clarificationType: string;
}

interface FallbackData {
  correctedQuery?: string;
  originalTerm?: string;
  fallbackType: string;
  confidence: number;
  suggestions: string[];
}

interface Suggestion {
  text: string;
  type: 'brand' | 'category' | 'color';
  isCorrection: boolean;
}

// ========== API Service (using axiosInstance) ==========

async function startChatSession(userId?: string) {
  const res = await axiosInstance.post('/ai-chat/api/chat/start', { userId });
  return res.data;
}

async function sendChatMessage(conversationId: string, message: string, userId?: string) {
  const res = await axiosInstance.post('/ai-chat/api/chat/message', { conversationId, message, userId });
  return res.data;
}

async function resetChat(conversationId: string) {
  const res = await axiosInstance.post('/ai-chat/api/chat/reset', { conversationId });
  return res.data;
}

async function migrateChatSession(conversationId: string, userId: string) {
  const res = await axiosInstance.post('/ai-chat/api/chat/migrate', { conversationId, userId });
  return res.data;
}

async function fetchSuggestions(query: string): Promise<Suggestion[]> {
  if (query.length < 2) return [];
  try {
    const res = await axiosInstance.get(`/ai-chat/api/chat/suggest?q=${encodeURIComponent(query)}`);
    return res.data.success ? res.data.suggestions : [];
  } catch {
    return [];
  }
}

// ========== Sub Components ==========

/** Typing indicator dots */
const TypingIndicator = () => (
  <div className="flex items-start gap-2 px-4 py-2">
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#C9A86C] to-[#B8963F] flex items-center justify-center flex-shrink-0">
      <Bot size={14} className="text-white" />
    </div>
    <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
    </div>
  </div>
);

/** Product card in chat */
const ChatProductCard = ({
  product,
  onViewProduct,
}: {
  product: ProductRecommendation;
  onViewProduct: (id: string) => void;
}) => (
  <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer min-w-[200px] max-w-[220px] flex-shrink-0"
    onClick={() => onViewProduct(product.slug || product.productId)}
  >
    {product.image ? (
      <img
        src={product.image}
        alt={product.title}
        className="w-full h-28 object-cover rounded-lg mb-2"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
        }}
      />
    ) : null}
    <div className={`w-full h-28 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg mb-2 flex items-center justify-center ${product.image ? 'hidden' : ''}`}>
      <ShoppingBag size={24} className="text-gray-300" />
    </div>
    <h4 className="text-xs font-semibold text-gray-800 line-clamp-2 mb-1 leading-tight">
      {product.title}
    </h4>
    <p className="text-sm font-bold text-[#C9A86C]">
      ${product.price?.toLocaleString('en-US')}
    </p>
    {/* Spec badges for electronics */}
    {(() => {
      const badges = getSpecBadges(product.specs);
      return badges.length > 0 ? (
        <div className="flex flex-wrap gap-1 mt-1">
          {badges.map((badge, i) => (
            <span key={i} className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium">
              {badge.icon} {badge.text}
            </span>
          ))}
        </div>
      ) : null;
    })()}
    {product.matchReasons && product.matchReasons.length > 0 && (
      <div className="flex flex-wrap gap-1 mt-1.5">
        {product.matchReasons.slice(0, 2).map((reason, i) => (
          <span
            key={i}
            className="text-[10px] px-1.5 py-0.5 bg-[#C9A86C]/10 text-[#B8963F] rounded-full"
          >
            {reason}
          </span>
        ))}
      </div>
    )}
    <button
      className="w-full mt-2 py-1.5 text-xs font-medium text-[#C9A86C] bg-[#C9A86C]/5 rounded-lg hover:bg-[#C9A86C]/10 transition-colors flex items-center justify-center gap-1"
      onClick={(e) => {
        e.stopPropagation();
        onViewProduct(product.slug || product.productId);
      }}
    >
      View <ArrowRight size={12} />
    </button>
  </div>
);

/** Comparison table component */
const ComparisonTable = ({
  comparison,
  onViewProduct,
}: {
  comparison: ComparisonData;
  onViewProduct: (id: string) => void;
}) => {
  const productCount = comparison.products.length;
  // Column width: 80px for labels, 72px per product (min)
  const tableMinWidth = 80 + productCount * 72;

  return (
    <div className="mt-2 bg-white border border-gray-100 rounded-xl shadow-sm w-full">
      {/* Scrollable table area */}
      <div
        className="overflow-x-auto overscroll-x-contain"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}
      >
        <div style={{ minWidth: `${tableMinWidth}px` }}>
          {/* Product headers */}
          <div className="flex border-b border-gray-100">
            <div className="w-20 flex-shrink-0 bg-gray-50 p-2" />
            {comparison.products.map((p, i) => (
              <div
                key={i}
                className="flex-1 min-w-[72px] p-2 text-center border-l border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => onViewProduct(p.slug || p.id)}
              >
                {p.image && (
                  <img src={p.image} alt={p.title} className="w-10 h-10 rounded-lg mx-auto mb-1 object-cover" />
                )}
                <p className="text-[10px] font-semibold text-gray-800 line-clamp-2 leading-tight hover:text-[#C9A86C] transition-colors">
                  {p.title}
                </p>
              </div>
            ))}
          </div>
          {/* Comparison rows */}
          {comparison.comparisonTable.map((row, i) => (
            <div key={i} className={`flex border-b border-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
              <div className="w-20 flex-shrink-0 p-2 text-[10px] font-medium text-gray-500 flex items-center gap-1">
                {row.icon && <span>{row.icon}</span>}
                {row.field}
              </div>
              {row.values.map((val, vi) => (
                <div
                  key={vi}
                  className={`flex-1 min-w-[72px] p-2 text-xs text-center border-l border-gray-100 ${
                    row.winner === vi ? 'text-green-600 font-semibold bg-green-50/50' : 'text-gray-700'
                  }`}
                >
                  {typeof val === 'number' && row.field === 'Price' ? `$${val.toLocaleString()}` : String(val)}
                  {row.winner === vi && <span className="ml-0.5 text-green-500">✓</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      {/* Verdict — outside the scroll area so it's always fully visible */}
      {comparison.verdict && (
        <div className="px-3 py-2.5 bg-gradient-to-r from-[#C9A86C]/5 to-transparent space-y-1.5 border-t border-gray-50">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">💡 Key Insights</p>
          {comparison.verdict
            .split(/\.\s+/)
            .filter(s => s.trim().length > 0)
            .map((sentence, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[11px] text-gray-700 leading-snug">
                <span className="text-[#C9A86C] mt-0.5 flex-shrink-0">▸</span>
                <span dangerouslySetInnerHTML={{ __html: sentence.replace(/\.$/, '').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') + '.' }} />
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
};

/** Clarification options component */
const ClarificationOptions = ({
  clarification,
  onSelect,
}: {
  clarification: ClarificationData;
  onSelect: (value: string) => void;
}) => (
  <div className="mt-2 space-y-1.5 max-w-[280px]">
    {clarification.options.map((opt, i) => (
      <button
        key={i}
        className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs bg-white border border-gray-200 rounded-xl hover:border-[#C9A86C] hover:bg-[#C9A86C]/5 transition-all group"
        onClick={() => onSelect(opt.value || opt.label)}
      >
        <span className="w-5 h-5 rounded-full bg-[#C9A86C]/10 text-[#C9A86C] flex items-center justify-center text-[10px] font-bold flex-shrink-0 group-hover:bg-[#C9A86C]/20">
          {i + 1}
        </span>
        <div>
          <span className="font-medium text-gray-800">{opt.label}</span>
          {opt.description && (
            <p className="text-[10px] text-gray-400 mt-0.5">{opt.description}</p>
          )}
        </div>
      </button>
    ))}
  </div>
);

/** Correction banner — shows when typo was corrected */
const CorrectionBanner = ({ fallback }: { fallback: FallbackData }) => {
  if (!fallback.correctedQuery || !fallback.originalTerm) return null;
  return (
    <div className="mt-1.5 mb-1 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-lg flex items-center gap-1.5 max-w-[280px]">
      <span className="text-amber-500 text-xs">✏️</span>
      <p className="text-[11px] text-amber-700">
        Showing results for <strong>{fallback.correctedQuery}</strong>
        {' '}(instead of &quot;{fallback.originalTerm}&quot;)
      </p>
    </div>
  );
};



/** Simple markdown-lite renderer for chat messages */
const formatMessage = (text: string) => {
  return text.split('\n').map((line, lineIdx) => {
    // Handle bullet points
    const bulletMatch = line.match(/^[•\-]\s*(.*)/);
    if (bulletMatch) {
      return (
        <div key={lineIdx} className="flex gap-1.5 ml-1">
          <span className="text-[#C9A86C] flex-shrink-0">•</span>
          <span dangerouslySetInnerHTML={{ __html: boldify(bulletMatch[1]) }} />
        </div>
      );
    }
    // Regular line
    if (line.trim() === '') return <br key={lineIdx} />;
    return <p key={lineIdx} dangerouslySetInnerHTML={{ __html: boldify(line) }} />;
  });
};

/** Convert **bold** to <strong> */
const boldify = (text: string) =>
  text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

/** Single message bubble */
const MessageBubble = ({
  message,
  onViewProduct,
  onQuickReply,
}: {
  message: ChatMessage;
  onViewProduct: (id: string) => void;
  onQuickReply: (text: string) => void;
}) => {
  const isUser = message.senderType === 'user';

  return (
    <div className={`flex items-start gap-2 px-4 py-1 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser
            ? 'bg-gradient-to-br from-blue-500 to-blue-600'
            : 'bg-gradient-to-br from-[#C9A86C] to-[#B8963F]'
        }`}
      >
        {isUser ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
      </div>

      {/* Content */}
      <div className={`flex flex-col ${isUser ? 'items-end max-w-[80%]' : 'items-start'}`} style={!isUser ? { maxWidth: 'calc(100% - 44px)' } : undefined}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words ${
            isUser
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-tr-sm'
              : 'bg-gray-100 text-gray-800 rounded-tl-sm'
          }`}
        >
          {isUser ? message.content : formatMessage(message.content)}
        </div>

        {/* Correction banner (typo correction notice) */}
        {!isUser && message.fallback && (
          <CorrectionBanner fallback={message.fallback} />
        )}

        {/* Comparison table — rendered outside the text bubble with full available width */}
        {!isUser && message.comparison && (
          <div className="w-full">
            <ComparisonTable comparison={message.comparison} onViewProduct={onViewProduct} />
          </div>
        )}

        {/* Clarification options */}
        {!isUser && message.clarification && (
          <ClarificationOptions
            clarification={message.clarification}
            onSelect={(value) => onQuickReply(value)}
          />
        )}

        {/* Product recommendations */}
        {message.recommendations && message.recommendations.length > 0 && (
          <div className="mt-2 flex gap-2 overflow-x-auto pb-2 w-full scrollbar-thin" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
            {message.recommendations.map((product, i) => (
              <ChatProductCard key={i} product={product} onViewProduct={onViewProduct} />
            ))}
          </div>
        )}

        {/* Quick replies */}
        {message.quickReplies && message.quickReplies.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.quickReplies.map((reply, i) => (
              <button
                key={i}
                className="px-3 py-1.5 text-xs font-medium text-[#C9A86C] bg-[#C9A86C]/5 border border-[#C9A86C]/20 rounded-full hover:bg-[#C9A86C]/10 transition-all"
                onClick={() => onQuickReply(reply)}
              >
                {reply}
              </button>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-gray-400 mt-1 px-1">
          {new Date(message.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
};

// ========== Main Component ==========

const AIChatbox = () => {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevUserIdRef = useRef<string | undefined>(undefined);
  const persistedRef = useRef(false); // guard to avoid double-restore

  // Workspace-specific states
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [isWorkspaceCollapsed, setIsWorkspaceCollapsed] = useState(false);

  // Filter messages that contain dynamic product recommendations or comparisons
  const resultMessages = React.useMemo(() => {
    return messages.filter(
      (m) =>
        m.senderType === 'ai' &&
        ((m.recommendations && m.recommendations.length > 0) || m.comparison)
    );
  }, [messages]);

  // Auto-select latest search results and expand workspace when they arrive
  useEffect(() => {
    if (resultMessages.length > 0) {
      const latestResult = resultMessages[resultMessages.length - 1];
      setActiveMessageId((prev) => {
        if (!prev) return latestResult.id;
        const exists = resultMessages.some((m) => m.id === prev);
        if (!exists) return latestResult.id;
        const lastMsg = messages[messages.length - 1];
        if (lastMsg && lastMsg.id === latestResult.id) {
          return latestResult.id;
        }
        return prev;
      });

      const lastMsg = messages[messages.length - 1];
      if (
        lastMsg &&
        lastMsg.senderType === 'ai' &&
        ((lastMsg.recommendations && lastMsg.recommendations.length > 0) ||
          lastMsg.comparison)
      ) {
        setIsWorkspaceCollapsed(false);
      }
    } else {
      setActiveMessageId(null);
    }
  }, [messages, resultMessages]);

  const STORAGE_KEY = 'ilan_chat_session';

  /** Serialize messages to localStorage */
  const persistSession = useCallback((cid: string, msgs: ChatMessage[]) => {
    try {
      // Only keep last 60 messages to stay within localStorage quota
      const toSave = msgs.slice(-60);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ conversationId: cid, messages: toSave }));
    } catch { /* quota exceeded — silently ignore */ }
  }, []);

  /** Clear persisted session (called on New Conversation) */
  const clearPersistedSession = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, []);

  /** Restore session from localStorage on mount */
  useEffect(() => {
    if (persistedRef.current) return;
    persistedRef.current = true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { conversationId: string; messages: ChatMessage[] };
      if (!parsed.conversationId || !Array.isArray(parsed.messages)) return;
      // Revive Date objects (JSON.parse returns strings)
      const revived = parsed.messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) }));
      setConversationId(parsed.conversationId);
      setMessages(revived);
    } catch { /* corrupt storage — ignore */ }
  }, []);

  /** Persist every time messages or conversationId changes */
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      persistSession(conversationId, messages);
    }
  }, [messages, conversationId, persistSession]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIdx, setSelectedSuggestionIdx] = useState(-1);
  const suggestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Re-initialize conversation when user logs in/out
  useEffect(() => {
    const currentUserId = user?.id;
    const prevUserId = prevUserIdRef.current;

    if (prevUserId !== currentUserId && conversationId) {
      if (!prevUserId && currentUserId) {
        // Anonymous → Logged in: MIGRATE the session (preserve keywords & history)
        migrateChatSession(conversationId, currentUserId)
          .then((res) => {
            if (res.success) {
              // Session upgraded — add a system message
              const migratedMsg: ChatMessage = {
                id: `migrate-${Date.now()}`,
                senderType: 'ai',
                content: res.data.message,
                timestamp: new Date(),
                quickReplies: res.data.quickReplies,
              };
              setMessages((prev) => [...prev, migratedMsg]);
            } else {
              // Session expired — start fresh
              clearPersistedSession();
              setConversationId(null);
              setMessages([]);
              if (isOpen) setTimeout(() => initConversation(), 100);
            }
          })
          .catch(() => {
            // Fallback: start fresh if migration fails
            clearPersistedSession();
            setConversationId(null);
            setMessages([]);
            if (isOpen) setTimeout(() => initConversation(), 100);
          });
      } else {
        // Logged out or user switched — clear and restart
        clearPersistedSession();
        setConversationId(null);
        setMessages([]);
        if (isOpen) setTimeout(() => initConversation(), 100);
      }
    }
    prevUserIdRef.current = currentUserId;
  }, [user?.id]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, scrollToBottom]);

  // Track scroll position for scroll-down button
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
  }, []);

  const handleNewConversation = useCallback(async () => {
    if (isResetting || isLoading || !conversationId) return;
    setIsResetting(true);
    try {
      const res = await resetChat(conversationId);
      if (res.success) {
        clearPersistedSession();
        setConversationId(res.data.conversationId);
        const freshMsg: ChatMessage = {
          id: `reset-${Date.now()}`,
          senderType: 'ai',
          content: res.data.message,
          timestamp: new Date(),
          quickReplies: res.data.quickReplies,
        };
        setMessages([freshMsg]);
        setInputValue('');
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to reset conversation:', err);
    } finally {
      setIsResetting(false);
    }
  }, [conversationId, isResetting, isLoading, clearPersistedSession]);

  // Initialize conversation when chat opens
  // Passes userId so backend can load behavior data for logged-in users
  const initConversation = useCallback(async () => {
    if (conversationId) {
      // Session exists (possibly from localStorage). If user is logged in,
      // ensure the backend session is linked to this user (may be anonymous).
      if (user?.id) {
        try {
          const res = await migrateChatSession(conversationId, user.id);
          if (!res.success) {
            // Session expired on backend (server restart) — start fresh
            clearPersistedSession();
            setConversationId(null);
            setMessages([]);
            const fresh = await startChatSession(user.id);
            if (fresh.success) {
              setConversationId(fresh.data.conversationId);
              setMessages([{
                id: `welcome-${Date.now()}`,
                senderType: 'ai',
                content: fresh.data.message || 'Hi! How can I help you find the perfect product today?',
                timestamp: new Date(),
                quickReplies: fresh.data.quickReplies || ['Search products', 'Get recommendations'],
              }]);
            }
          }
        } catch {
          // Migration failed — session likely doesn't exist. Start fresh.
          clearPersistedSession();
          setConversationId(null);
          setMessages([]);
          try {
            const fresh = await startChatSession(user.id);
            if (fresh.success) {
              setConversationId(fresh.data.conversationId);
              setMessages([{
                id: `welcome-${Date.now()}`,
                senderType: 'ai',
                content: fresh.data.message || 'Hi! How can I help you find the perfect product today?',
                timestamp: new Date(),
                quickReplies: fresh.data.quickReplies || ['Search products', 'Get recommendations'],
              }]);
            }
          } catch { /* ignore */ }
        }
      }
      return;
    }
    try {
      const res = await startChatSession(user?.id);
      if (res.success) {
        setConversationId(res.data.conversationId);
        const welcomeMsg: ChatMessage = {
          id: `welcome-${Date.now()}`,
          senderType: 'ai',
          content: res.data.message || 'Hi! How can I help you find the perfect product today?',
          timestamp: new Date(),
          quickReplies: res.data.quickReplies || ['Search products', 'Get recommendations'],
        };
        setMessages([welcomeMsg]);
      }
    } catch (err) {
      console.error('Failed to start chat:', err);
      setMessages([
        {
          id: `welcome-fallback-${Date.now()}`,
          senderType: 'ai',
          content: "Hi! I'm your shopping assistant. How can I help you today?",
          timestamp: new Date(),
          quickReplies: ['Search products', 'Get recommendations', 'Browse categories'],
        },
      ]);
    }
  }, [conversationId, user?.id, clearPersistedSession]);

  // Open/close handler
  const toggleChat = useCallback(() => {
    const willOpen = !isOpen;
    setIsOpen(willOpen);
    if (willOpen) {
      setUnreadCount(0);
      initConversation();
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, initConversation]);

  // Send a message
  const handleSend = useCallback(
    async (text?: string) => {
      const messageText = text || inputValue.trim();
      if (!messageText || isLoading) return;

      setInputValue('');

      // Add user message
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        senderType: 'user',
        content: messageText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        if (conversationId) {
          const res = await sendChatMessage(conversationId, messageText, user?.id);
          if (res.success) {
            const aiMsg: ChatMessage = {
              id: `ai-${Date.now()}`,
              senderType: 'ai',
              content: res.data.message,
              timestamp: new Date(),
              recommendations: res.data.recommendations,
              quickReplies: res.data.quickReplies,
              intent: res.data.intent,
              comparison: res.data.comparison,
              clarification: res.data.clarification,
              fallback: res.data.fallback,
              isFollowUp: res.data.isFollowUp,
            };
            setMessages((prev) => [...prev, aiMsg]);
          }
        } else {
          // No conversation yet - add fallback
          const fallbackMsg: ChatMessage = {
            id: `ai-fallback-${Date.now()}`,
            senderType: 'ai',
            content: "I'm setting up. Please try again in a moment!",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, fallbackMsg]);
          await initConversation();
        }
      } catch (err) {
        console.error('Failed to send message:', err);
        const errorMsg: ChatMessage = {
          id: `error-${Date.now()}`,
          senderType: 'ai',
          content: "Sorry, I'm having trouble connecting. Please try again.",
          timestamp: new Date(),
          quickReplies: ['Try again', 'Search products'],
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
        // Keep input focused so the user can keep typing without re-clicking
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    },
    [inputValue, isLoading, conversationId, initConversation]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Suggestion navigation
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIdx(prev => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIdx(prev => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Enter' && selectedSuggestionIdx >= 0) {
        e.preventDefault();
        applySuggestion(suggestions[selectedSuggestionIdx]);
        return;
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        return;
      }
      if (e.key === 'Tab' && selectedSuggestionIdx >= 0) {
        e.preventDefault();
        applySuggestion(suggestions[selectedSuggestionIdx]);
        return;
      }
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setShowSuggestions(false);
      handleSend();
    }
  };

  // Apply a suggestion: replace the last word being typed
  const applySuggestion = (suggestion: Suggestion) => {
    const words = inputValue.split(/\s+/);
    words[words.length - 1] = suggestion.text;
    setInputValue(words.join(' ') + ' ');
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedSuggestionIdx(-1);
    inputRef.current?.focus();
  };

  // Fetch suggestions on input change (debounced)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Limit any single word to 30 characters to prevent gibberish spam
    const words = value.split(/(\s+)/);
    const processedWords = words.map(w => {
      if (w.trim() && w.length > 30) {
        return w.slice(0, 30);
      }
      return w;
    });
    value = processedWords.join('');
    
    setInputValue(value);
    
    // Get the last word being typed for suggestions
    const wordsForSuggest = value.trim().split(/\s+/);
    const lastWord = wordsForSuggest[wordsForSuggest.length - 1] || '';

    // Clear previous timer
    if (suggestTimerRef.current) {
      clearTimeout(suggestTimerRef.current);
    }

    if (lastWord.length >= 2) {
      suggestTimerRef.current = setTimeout(async () => {
        const results = await fetchSuggestions(lastWord);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
        setSelectedSuggestionIdx(-1);
      }, 150); // 150ms debounce
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleViewProduct = (productId: string) => {
    window.open(`/product/${productId}`, '_blank');
  };

  return (
    <>
      {/* ===== Chat Window ===== */}
      <div
        className={`fixed bottom-24 right-4 sm:right-6 z-[999] w-[360px] max-w-[calc(100vw-2rem)] transition-all duration-300 ease-out origin-bottom-right ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
        } ${isOpen && resultMessages.length > 0 && !isWorkspaceCollapsed ? 'hidden lg:block' : ''}`}
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col h-[520px] max-h-[70vh]">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C9A86C] to-[#B8963F] flex items-center justify-center shadow-lg">
                <Sparkles size={18} className="text-white" />
              </div>
              <div>
                <h3 className="text-white text-sm font-semibold">ILAN Assistant</h3>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-[11px] text-gray-300">Online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Workspace Toggle Button */}
              {resultMessages.length > 0 && (
                <button
                  onClick={() => setIsWorkspaceCollapsed(!isWorkspaceCollapsed)}
                  title={isWorkspaceCollapsed ? "Expand workspace" : "Collapse workspace"}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    !isWorkspaceCollapsed
                      ? 'bg-[#C9A86C] text-white shadow-md'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {!isWorkspaceCollapsed ? (
                    <Minimize2 size={15} />
                  ) : (
                    <Maximize2 size={15} />
                  )}
                </button>
              )}
              {/* New Conversation button */}
              <button
                onClick={handleNewConversation}
                disabled={isResetting || isLoading || !conversationId}
                title="New conversation"
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RotateCcw
                  size={15}
                  className={`text-white transition-transform duration-500 ${
                    isResetting ? 'animate-spin' : 'hover:-rotate-45'
                  }`}
                />
              </button>
              {/* Close button */}
              <button
                onClick={toggleChat}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X size={16} className="text-white" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto py-3 space-y-1 scroll-smooth"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#d1d5db transparent',
            }}
          >
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onViewProduct={handleViewProduct}
                onQuickReply={(text) => handleSend(text)}
              />
            ))}

            {isLoading && <TypingIndicator />}

            <div ref={messagesEndRef} />
          </div>

          {/* Scroll to bottom */}
          {showScrollButton && (
            <div className="flex justify-center -mt-8 relative z-10">
              <button
                onClick={scrollToBottom}
                className="w-8 h-8 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                <ChevronDown size={16} className="text-gray-500" />
              </button>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-gray-100 px-3 py-2.5 bg-white relative">
            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute bottom-full left-3 right-3 mb-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-10">
                {suggestions.map((s, i) => (
                  <button
                    key={`${s.type}-${s.text}`}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                      i === selectedSuggestionIdx
                        ? 'bg-[#C9A86C]/10 text-gray-800'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                    onClick={() => applySuggestion(s)}
                    onMouseEnter={() => setSelectedSuggestionIdx(i)}
                  >
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider ${
                      s.type === 'brand' ? 'bg-blue-100 text-blue-600' :
                      s.type === 'category' ? 'bg-green-100 text-green-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                      {s.type}
                    </span>
                    <span className="font-medium">{s.text}</span>
                    {s.isCorrection && (
                      <span className="ml-auto text-[10px] text-amber-500 font-medium">Did you mean?</span>
                    )}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                placeholder="Ask me anything... e.g. adidas shirt"
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#C9A86C] focus:ring-1 focus:ring-[#C9A86C]/20 transition-all"
                disabled={isLoading}
                autoComplete="off"
                maxLength={150}
              />
              <button
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || isLoading}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  inputValue.trim() && !isLoading
                    ? 'bg-gradient-to-r from-[#C9A86C] to-[#B8963F] text-white shadow-lg shadow-[#C9A86C]/25 hover:shadow-xl hover:shadow-[#C9A86C]/30 active:scale-95'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
            <p className="text-[10px] text-center text-gray-400 mt-1.5">
              Powered by ILAN AI · Rule-based NLP Engine
            </p>
          </div>
        </div>
      </div>

      {/* ===== Visual Workspace Panel ===== */}
      {resultMessages.length > 0 && (
        <div
          className={`fixed left-4 md:left-6 top-24 bottom-6 md:bottom-8 right-4 lg:right-[390px] z-[998] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-stone-200/50 flex flex-col md:flex-row overflow-hidden transition-all duration-300 ease-out ${
            isOpen && !isWorkspaceCollapsed
              ? 'opacity-100 translate-x-0 scale-100 pointer-events-auto'
              : 'opacity-0 -translate-x-4 scale-95 pointer-events-none'
          }`}
        >
          {/* Sidebar - search history */}
          <div className="w-full md:w-64 bg-stone-50/80 backdrop-blur-sm border-r border-stone-200/30 flex flex-col flex-shrink-0">
            <div className="p-4 border-b border-stone-200/30">
              <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">AI Search History</h4>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {resultMessages.map((msg) => {
                const msgIdx = messages.findIndex((m) => m.id === msg.id);
                let userQuery = 'Product Search';
                if (msgIdx > 0) {
                  const prevMsg = messages[msgIdx - 1];
                  if (prevMsg && prevMsg.senderType === 'user') {
                    userQuery = prevMsg.content;
                  }
                }
                const isSelected = activeMessageId === msg.id;

                return (
                  <button
                    key={msg.id}
                    onClick={() => setActiveMessageId(msg.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex flex-col gap-1 border ${
                      isSelected
                        ? 'border-l-4 border-l-[#C9A86C] bg-white border-stone-200 shadow-sm text-stone-900 font-bold'
                        : 'bg-transparent border-transparent hover:bg-stone-100/50 text-stone-600'
                    }`}
                  >
                    <span className="text-xs font-semibold truncate block w-full">{userQuery}</span>
                    <span className="text-[10px] text-gray-400 font-normal">
                      {new Date(msg.timestamp).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Workspace content */}
          {(() => {
            const activeMsg =
              resultMessages.find((m) => m.id === activeMessageId) ||
              resultMessages[resultMessages.length - 1];
            if (!activeMsg) return null;

            return (
              <div className="flex-1 flex flex-col min-w-0 bg-white/95">
                {/* Workspace Header */}
                <div className="px-6 py-4 border-b border-stone-200/30 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                      <Sparkles size={16} className="text-[#C9A86C]" />
                      AI Search Workspace
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Spacious interactive view of your recommended products
                    </p>
                  </div>

                  <button
                    onClick={() => setIsWorkspaceCollapsed(true)}
                    title="Collapse workspace"
                    className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl hover:text-gray-800 transition flex items-center justify-center gap-1"
                  >
                    <span className="lg:hidden px-1.5 py-0.5 text-xs font-semibold">Back to Chat</span>
                    <ChevronRight size={20} className="hidden lg:block" />
                  </button>
                </div>

                {/* Workspace Body */}
                <div className="flex-1 overflow-y-auto p-6">
                  {/* If it's a comparison view */}
                  {activeMsg.comparison ? (() => {
                    // Calculate overall winning product based on feature rows
                    const winCounts = new Array(activeMsg.comparison.products.length).fill(0);
                    activeMsg.comparison.comparisonTable.forEach(row => {
                      if (row.winner !== undefined && row.winner !== null && row.winner >= 0) {
                        winCounts[row.winner]++;
                      }
                    });
                    const maxWins = Math.max(...winCounts);
                    const winnerIndex = maxWins > 0 ? winCounts.indexOf(maxWins) : -1;

                    return (
                      <div className="space-y-6 animate-fade-in">
                        <div className="bg-[#C9A86C]/5 p-5 rounded-2xl border border-[#C9A86C]/10 shadow-sm">
                          <h4 className="text-xs font-extrabold text-[#B8963F] uppercase tracking-wider mb-2 flex items-center gap-1">
                            ✨ Comparison Overview
                          </h4>
                          <p className="text-stone-700 text-sm leading-relaxed">{activeMsg.content}</p>
                        </div>

                        {/* Large Comparison Table */}
                        <div className="bg-white border border-stone-200/50 rounded-2xl shadow-sm overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-stone-50/50 border-b border-stone-200/30">
                                  <th className="p-4 text-xs font-extrabold text-stone-500 uppercase tracking-wider w-[180px] align-middle">
                                    Feature
                                  </th>
                                  {activeMsg.comparison.products.map((p, idx) => {
                                    const isAIWinner = idx === winnerIndex;
                                    return (
                                      <th
                                        key={idx}
                                        onClick={() => handleViewProduct(p.slug || p.id)}
                                        className={`p-4 border-l border-stone-200/30 text-center cursor-pointer hover:bg-stone-50/50 transition-colors group relative ${
                                          isAIWinner ? 'bg-[#C9A86C]/5 pt-8' : 'pt-5'
                                        }`}
                                      >
                                        {isAIWinner && (
                                          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#C9A86C] to-[#B8963F] text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm uppercase tracking-wider whitespace-nowrap z-10 animate-pulse">
                                            ★ AI Choice
                                          </div>
                                        )}
                                        {p.image && (
                                          <div className={`relative w-28 h-28 mx-auto mb-2 overflow-hidden rounded-xl border bg-gray-50 transition-all ${
                                            isAIWinner ? 'border-[#C9A86C]/50 shadow-md shadow-[#C9A86C]/10' : 'border-stone-200/30'
                                          }`}>
                                            <img
                                              src={p.image}
                                              alt={p.title}
                                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                                            />
                                          </div>
                                        )}
                                        <p className="text-xs font-extrabold text-stone-800 line-clamp-2 leading-snug group-hover:text-[#C9A86C] transition-colors duration-200">
                                          {p.title}
                                        </p>
                                        <p className="text-sm font-black text-[#C9A86C] mt-1">
                                          ${p.price.toLocaleString()}
                                        </p>
                                      </th>
                                    );
                                  })}
                                </tr>
                              </thead>
                              <tbody>
                                {activeMsg.comparison.comparisonTable.map((row, rowIdx) => (
                                  <tr
                                    key={rowIdx}
                                    className={`border-b border-stone-100 ${
                                      rowIdx % 2 === 0 ? 'bg-white' : 'bg-stone-50/20'
                                    }`}
                                  >
                                    <td className="p-4 text-xs font-bold text-stone-600 flex items-center gap-2">
                                      {row.icon && <span className="text-base">{row.icon}</span>}
                                      {row.field}
                                    </td>
                                    {row.values.map((val, valIdx) => {
                                      const isWinner = row.winner === valIdx;
                                      return (
                                        <td
                                          key={valIdx}
                                          className={`p-4 text-sm text-center border-l border-stone-100 ${
                                            isWinner ? 'bg-green-50/20' : ''
                                          }`}
                                        >
                                          {isWinner ? (
                                            <div className="flex flex-col items-center justify-center gap-1">
                                              <span className="font-semibold text-green-700">
                                                {typeof val === 'number' && row.field === 'Price'
                                                  ? `$${val.toLocaleString()}`
                                                  : String(val)}
                                              </span>
                                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-green-100/70 border border-green-200 text-green-700 text-[9px] font-extrabold shadow-sm">
                                                ✓ Win
                                              </span>
                                            </div>
                                          ) : (
                                            <span className="text-stone-600">
                                              {typeof val === 'number' && row.field === 'Price'
                                                ? `$${val.toLocaleString()}`
                                                : String(val)}
                                            </span>
                                          )}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Bento Grid Verdict / Insights */}
                        {activeMsg.comparison.verdict && (
                          <div className="bg-stone-50/50 rounded-2xl p-6 border border-stone-200/50 shadow-sm">
                            <h4 className="text-xs font-extrabold text-stone-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                              💡 Key Insights & Verdict
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {activeMsg.comparison.verdict
                                .split(/\.\s+/)
                                .filter((s) => s.trim().length > 0)
                                .map((sentence, sIdx) => (
                                  <div
                                    key={sIdx}
                                    className="bg-white/90 backdrop-blur-sm p-4 rounded-xl border border-stone-200/30 shadow-sm flex items-start gap-3 hover:border-[#C9A86C]/30 hover:shadow-md transition-all duration-300"
                                  >
                                    <span className="w-6 h-6 rounded-full bg-[#C9A86C]/10 text-[#B8963F] flex items-center justify-center text-xs font-black flex-shrink-0 shadow-inner">
                                      {sIdx + 1}
                                    </span>
                                    <p
                                      className="text-stone-700 text-sm leading-relaxed"
                                      dangerouslySetInnerHTML={{
                                        __html:
                                          sentence
                                            .replace(/\.$/, '')
                                            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') + '.',
                                      }}
                                    />
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })() : (
                    <div className="space-y-6">
                      {/* Conversation Summary Text */}
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-gray-700 text-sm leading-relaxed">
                        {activeMsg.content}
                      </div>

                      {/* Large Products Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                        {activeMsg.recommendations?.map((prod, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleViewProduct(prod.slug || prod.productId)}
                            className="bg-white border border-stone-200/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-[#C9A86C]/5 hover:border-[#C9A86C]/30 transition-all duration-300 cursor-pointer flex flex-col group"
                          >
                            {/* Product Image */}
                            <div className="relative aspect-square w-full overflow-hidden bg-stone-50">
                              {prod.score > 0 && (
                                <div className="absolute top-3 left-3 z-10 backdrop-blur-md bg-gradient-to-r from-[#C9A86C] to-[#B8963F] text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm tracking-wider uppercase">
                                  ★ {prod.score > 0 && prod.score <= 1 ? Math.round(prod.score * 100) : Math.round(prod.score)}% Match
                                </div>
                              )}
                              {prod.image ? (
                                <img
                                  src={prod.image}
                                  alt={prod.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                  <ShoppingBag size={48} />
                                </div>
                              )}
                            </div>

                            {/* Card Content */}
                            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                              <div className="space-y-1">
                                <h4 className="text-sm font-extrabold text-stone-800 line-clamp-2 leading-snug group-hover:text-[#C9A86C] transition-colors duration-200">
                                  {prod.title}
                                </h4>
                                <p className="text-lg font-black text-[#C9A86C]">
                                  ${prod.price?.toLocaleString('en-US')}
                                </p>
                              </div>

                              {/* Spec badges */}
                              {(() => {
                                const badges = getSpecBadges(prod.specs);
                                return badges.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {badges.map((badge, i) => (
                                      <span
                                        key={i}
                                        className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium"
                                      >
                                        {badge.icon} {badge.text}
                                      </span>
                                    ))}
                                  </div>
                                ) : null;
                              })()}

                              {/* Match reasons */}
                              {prod.matchReasons && prod.matchReasons.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {prod.matchReasons.map((reason, i) => (
                                    <span
                                      key={i}
                                      className="text-[10px] px-2.5 py-0.5 bg-[#C9A86C]/10 text-[#B8963F] rounded-full font-semibold"
                                    >
                                      {reason}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ===== Floating Bubble Trigger ===== */}
      <button
        onClick={toggleChat}
        className={`fixed bottom-6 right-4 sm:right-6 z-[999] group transition-all duration-300 ${
          isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
        }`}
        aria-label="Open AI Chat Assistant"
      >
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full bg-[#C9A86C]/30 animate-ping" />

        {/* Main button */}
        <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-[#C9A86C] to-[#B8963F] shadow-lg shadow-[#C9A86C]/30 flex items-center justify-center hover:shadow-xl hover:shadow-[#C9A86C]/40 hover:scale-105 active:scale-95 transition-all">
          <MessageCircle size={24} className="text-white" />

          {/* Unread badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>

        {/* Tooltip */}
        <span className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
          Chat with AI Assistant
          <span className="absolute top-full right-4 border-4 border-transparent border-t-gray-800" />
        </span>
      </button>
    </>
  );
};

export default AIChatbox;
