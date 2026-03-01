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
}

interface ComparisonData {
  products: Array<{
    id: string;
    title: string;
    brand: string;
    price: number;
    image: string;
    rating: number;
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

async function sendChatMessage(conversationId: string, message: string) {
  const res = await axiosInstance.post('/ai-chat/api/chat/message', { conversationId, message });
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
const ComparisonTable = ({ comparison }: { comparison: ComparisonData }) => (
  <div className="mt-2 bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm max-w-[320px]">
    {/* Product headers */}
    <div className="flex border-b border-gray-100">
      <div className="w-20 flex-shrink-0 bg-gray-50 p-2" />
      {comparison.products.map((p, i) => (
        <div key={i} className="flex-1 p-2 text-center border-l border-gray-100">
          {p.image && (
            <img src={p.image} alt={p.title} className="w-10 h-10 rounded-lg mx-auto mb-1 object-cover" />
          )}
          <p className="text-[10px] font-semibold text-gray-800 line-clamp-2 leading-tight">{p.title}</p>
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
            className={`flex-1 p-2 text-xs text-center border-l border-gray-100 ${
              row.winner === vi ? 'text-green-600 font-semibold bg-green-50/50' : 'text-gray-700'
            }`}
          >
            {typeof val === 'number' && row.field === 'Price' ? `$${val.toLocaleString()}` : String(val)}
            {row.winner === vi && <span className="ml-0.5 text-green-500">✓</span>}
          </div>
        ))}
      </div>
    ))}
    {/* Verdict */}
    {comparison.verdict && (
      <div className="px-3 py-2 bg-gradient-to-r from-[#C9A86C]/5 to-transparent">
        <p className="text-[11px] text-gray-600 italic">{comparison.verdict}</p>
      </div>
    )}
  </div>
);

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
      <div className={`max-w-[80%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
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

        {/* Comparison table */}
        {!isUser && message.comparison && (
          <ComparisonTable comparison={message.comparison} />
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
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 max-w-[300px] scrollbar-thin">
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIdx, setSelectedSuggestionIdx] = useState(-1);
  const suggestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Re-initialize conversation when user logs in/out
  useEffect(() => {
    const currentUserId = user?.id;
    if (prevUserIdRef.current !== currentUserId && conversationId) {
      // User changed — reset conversation to load new context
      setConversationId(null);
      setMessages([]);
      if (isOpen) {
        setTimeout(() => initConversation(), 100);
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

  // Initialize conversation when chat opens
  // Passes userId so backend can load behavior data for logged-in users
  const initConversation = useCallback(async () => {
    if (conversationId) return;
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
  }, [conversationId, user?.id]);

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
          const res = await sendChatMessage(conversationId, messageText);
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
    const value = e.target.value;
    setInputValue(value);
    
    // Get the last word being typed for suggestions
    const words = value.trim().split(/\s+/);
    const lastWord = words[words.length - 1] || '';

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
        }`}
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
            <button
              onClick={toggleChat}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X size={16} className="text-white" />
            </button>
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
