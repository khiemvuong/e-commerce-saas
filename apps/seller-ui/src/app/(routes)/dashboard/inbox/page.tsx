"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "apps/seller-ui/src/context/web-socket-context";
import useSeller from "apps/seller-ui/src/hooks/useSeller";
import ChatInput from "apps/seller-ui/src/shared/components/chats/chatinput";
import PageLoader from "apps/seller-ui/src/shared/components/loading/page-loader";
import axiosInstance from "apps/seller-ui/src/utils/axiosInstance";
import { API_CONFIG } from "apps/seller-ui/src/utils/apiConfig";
import { Send } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

const SellerInboxPage = () => {
    const searchParams = useSearchParams();
    const { seller, isLoading: sellerLoading } = useSeller(); 
    const router = useRouter();
    const messageContainerRef = useRef<HTMLDivElement | null>(null);
    const scrollAnchorRef = useRef<HTMLDivElement | null>(null);
    const isLoadingMoreRef = useRef(false);
    const previousScrollHeightRef = useRef(0);
    const queryClient = useQueryClient();
    const [chats, setChats] = useState<any[]>([]);
    const [selectedChat, setSelectedChat] = useState<any>(null);
    const [hasMore, setHasMore] = useState(false);
    const [page, setPage] = useState(1);
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const conversationId = searchParams.get("conversationId");
    const { ws, onlineUsers, lastSeenUpdate } = useWebSocket() || {};
    const [isMessageSeen, setIsMessageSeen] = useState(false);

    // Fetch messages cho cuộc hội thoại đã chọn
    const { data: messages = [] } = useQuery({
        queryKey: ["seller-messages", conversationId],
        queryFn: async () => {
            if (!conversationId) return [];
            const res = await axiosInstance.get(
                `/chatting/api/get-seller-messages/${conversationId}`
            );
            setPage(1);
            setHasMore(res.data.hasMore);
            return res.data.messages.reverse();
        },
        enabled: !!conversationId,
        staleTime: API_CONFIG.STALE_TIME.ORDERS, // Use short stale time for chat
    });

    const loadMoreMessages = async () => {
        if (messageContainerRef.current) {
            previousScrollHeightRef.current = messageContainerRef.current.scrollHeight;
        }
        isLoadingMoreRef.current = true;
        const nextPage = page + 1;
        const res = await axiosInstance.get(
            `/chatting/api/get-seller-messages/${conversationId}?page=${nextPage}`
        );

        queryClient.setQueryData(
            ["seller-messages", conversationId],
            (oldData: any = []) => [...res.data.messages.reverse(), ...oldData]
        );
        setPage(nextPage);
        setHasMore(res.data.hasMore);
    };

    const { data: conversations, isLoading } = useQuery({
        queryKey: ["seller-conversations"],
        queryFn: async () => {
            const res = await axiosInstance.get(
                "/chatting/api/get-seller-conversations"
            );
            return res.data.conversations;
        },
    });

    useEffect(() => {
        if (conversations) setChats(conversations);
    }, [conversations]);

    useEffect(() => {
        if (isLoadingMoreRef.current) {
            if (messageContainerRef.current) {
                const newScrollHeight = messageContainerRef.current.scrollHeight;
                const diff = newScrollHeight - previousScrollHeightRef.current;
                messageContainerRef.current.scrollTop += diff;
            }
            isLoadingMoreRef.current = false;
            return;
        }
        if (messages?.length > 0) scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (conversationId && chats.length > 0) {
            const chat = chats.find((c) => c.conversationId === conversationId);
            if (chat) setSelectedChat(chat);
        }
    }, [conversationId, chats]);

    // Handle real-time online status updates
    useEffect(() => {
        if (!onlineUsers) return;
        setChats((prev) =>
            prev.map((chat) => {
                const userId = chat.user?.id;
                if (userId && onlineUsers[userId] !== undefined) {
                    return {
                        ...chat,
                        user: { ...chat.user, isOnline: onlineUsers[userId] },
                    };
                }
                return chat;
            })
        );
        // Also update selectedChat
        if (selectedChat?.user?.id && onlineUsers[selectedChat.user.id] !== undefined) {
            setSelectedChat((prev: any) => prev ? ({
                ...prev,
                user: { ...prev.user, isOnline: onlineUsers[prev.user.id] },
            }) : null);
        }
    }, [onlineUsers]);

    // Handle message seen notifications
    useEffect(() => {
        if (lastSeenUpdate && lastSeenUpdate.conversationId === conversationId && lastSeenUpdate.seenByType === 'user') {
            setIsMessageSeen(true);
        }
    }, [lastSeenUpdate, conversationId]);

    // Reset seen status when sending new message
    useEffect(() => {
        if (isSending) {
            setIsMessageSeen(false);
        }
    }, [isSending]);

    useEffect(() => {
        if (!ws) return;
        const handleMessage = (event: any) => {
            const data = JSON.parse(event.data);
            if (data.type === "MESSAGE_RECEIVED") {
                // Update sidebar chats (last message & unread count)
                setChats((prevChats) => 
                    prevChats.map((chat) => {
                        if (chat.conversationId === data.payload.conversationId) {
                            return {
                                ...chat,
                                lastMessage: data.payload.content,
                                unreadCount: chat.conversationId === conversationId ? 0 : (chat.unreadCount || 0) + 1,
                                updatedAt: new Date().toISOString()
                            };
                        }
                        return chat;
                    })
                );

                if (data.payload.conversationId === conversationId) {
                    queryClient.setQueryData(["seller-messages", conversationId], (old: any = []) => {
                        return [...old, data.payload];
                    });
                    // Mark as seen immediately
                    ws.send(JSON.stringify({ type: "MARK_AS_SEEN", conversationId, senderType: "seller" }));
                }
            }
        };
        ws.addEventListener("message", handleMessage);
        return () => ws.removeEventListener("message", handleMessage);
    }, [ws, conversationId, queryClient]);

    const getLastMessage = (chat: any) => {
        return chat?.lastMessage || "No messages yet";
    };

    const handleChatSelect = (chat: any) => {
        setChats((prev) =>
            prev.map((c) =>
                c.conversationId === chat.conversationId ? { ...c, unreadCount: 0 } : c
            )
        );
        router.push(`?conversationId=${chat.conversationId}`);

        // Đánh dấu đã xem
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: "MARK_AS_SEEN",
                conversationId: chat.conversationId,
                senderType: "seller"
            }));
        }
    };

    const scrollToBottom = () => {
        requestAnimationFrame(() => {
            setTimeout(() => {
                scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 0);
        });
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !selectedChat || isSending) return;
        setIsSending(true);

        const payload = {
            fromUserId: seller?.id, // ID của người gửi (Seller)
            toUserId: selectedChat?.user?.id, // ID của người nhận (User)
            conversationId: selectedChat?.conversationId,
            messageBody: message,
            senderType: "seller", // Quan trọng: Xác định loại người gửi
        };

        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(payload));
        } else {
            console.error("WebSocket not connected");
            return;
        }

        // Update last message in sidebar
        setChats((prevChats) =>
            prevChats.map((chat) =>
                chat.conversationId === selectedChat.conversationId
                    ? { ...chat, lastMessage: payload.messageBody, updatedAt: new Date().toISOString() }
                    : chat
            )
        );
        setMessage("");
        scrollToBottom();
        setTimeout(() => setIsSending(false), 300);
    };

    return (
        <div className="w-full h-full bg-gray-50 p-4">
            <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex">
                {/* Sidebar - Danh sách User */}
                <div className="w-[320px] border-r border-gray-200 flex flex-col bg-white">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-800">Inbox</h2>
                        <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                            {chats.length} chats
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                        {isLoading ? (
                            <PageLoader />
                        ) : chats.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 text-sm">
                                No conversations yet.
                            </div>
                        ) : (
                            chats.map((chat) => {
                                const isActive = selectedChat?.conversationId === chat.conversationId;
                                return (
                                    <button
                                        key={chat.conversationId}
                                        onClick={() => handleChatSelect(chat)}
                                        disabled={isSending}
                                        className={`w-full text-left px-4 py-4 transition-colors flex items-center gap-3 hover:bg-gray-50 ${
                                            isActive ? "bg-indigo-50 border-l-4 border-indigo-600" : "border-l-4 border-transparent"
                                        }`}
                                    >
                                        <div className="relative">
                                            <Image
                                                src={chat.user?.avatar || "/default-avatar.png"} // Lưu ý cấu trúc object user
                                                alt={chat.user?.name || "User"}
                                                width={44}
                                                height={44}
                                                className="rounded-full object-cover w-11 h-11 border border-gray-200"
                                            />
                                            {chat.user?.isOnline && (
                                                <span className="absolute bottom-0 right-0 block w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <span className={`font-semibold truncate ${isActive ? "text-indigo-900" : "text-gray-900"}`}>
                                                    {chat.user?.name || "Unknown User"}
                                                </span>
                                                {chat.unreadCount > 0 && (
                                                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                                        {chat.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                            <p className={`text-sm truncate ${chat.unreadCount > 0 ? "font-semibold text-gray-800" : "text-gray-500"}`}>
                                                {getLastMessage(chat)}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-gray-50/50">
                    {selectedChat ? (
                        <>
                            {/* Chat Header */}
                            <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center gap-4 shadow-sm z-10">
                                <Image
                                    src={selectedChat.user?.avatar || "/default-avatar.png"}
                                    alt={selectedChat.user?.name}
                                    width={40}
                                    height={40}
                                    className="rounded-full object-cover w-10 h-10 border border-gray-100"
                                />
                                <div>
                                    <h3 className="font-bold text-gray-900 text-base">
                                        {selectedChat.user?.name}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${selectedChat.user?.isOnline ? "bg-green-500" : "bg-gray-300"}`}></span>
                                        <span className="text-xs text-gray-500">
                                            {selectedChat.user?.isOnline ? "Online" : "Offline"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Messages List */}
                            <div
                                className="flex-1 overflow-y-auto p-6 space-y-6"
                                ref={messageContainerRef}
                            >
                                {hasMore && (
                                    <div className="text-center py-2">
                                        <button
                                            onClick={loadMoreMessages}
                                            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline transition"
                                        >
                                            Load previous messages
                                        </button>
                                    </div>
                                )}
                                
                                {messages.map((msg: any, index: number) => {
                                    // Kiểm tra tin nhắn có phải của Seller (mình) không
                                    const isMe = msg.senderType === "seller";
                                    const isLastMyMessage = isMe && index === messages.length - 1;
                                    return (
                                        <div
                                            key={msg.id || index}
                                            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                                        >
                                            <div className={`flex flex-col max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
                                                <div
                                                    className={`px-5 py-3 rounded-2xl text-sm shadow-sm ${
                                                        isMe
                                                            ? "bg-indigo-600 text-white rounded-br-none" // Màu chủ đạo của Dashboard (Indigo)
                                                            : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"
                                                    }`}
                                                >
                                                    <p className="leading-relaxed">{msg.content}</p>
                                                </div>
                                                <span className="text-[10px] text-gray-400 mt-1 px-1">
                                                    {new Date(msg.createdAt).toLocaleTimeString([], {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </span>
                                                {/* Show seen indicator for last message from seller */}
                                                {isLastMyMessage && isMessageSeen && (
                                                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                                        ✓✓ Đã xem
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={scrollAnchorRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-white border-t border-gray-200">
                                <ChatInput
                                    onSendMessage={handleSend}
                                    message={message}
                                    setMessage={setMessage}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                                <Send size={36} className="text-gray-300 ml-1" />
                            </div>
                            <p className="font-medium">Select a customer to start chatting</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SellerInboxPage;
