"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "apps/user-ui/src/context/web-socket-context";
import useRequiredAuth from "apps/user-ui/src/hooks/useRequiredAuth";
import ChatInput from "apps/user-ui/src/shared/components/chats/chatinput";
import PageLoader from "apps/user-ui/src/shared/components/loading/page-loader";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import { Send, ArrowLeft, User } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

const Page = () => {
    const searchParams = useSearchParams();
    const { user, isLoading: userLoading } = useRequiredAuth();
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
    const { data: messages = [] } = useQuery({
        queryKey: ["messages", conversationId],
        queryFn: async () => {
            if (!conversationId) return [];
            const res = await axiosInstance.get(
                `/chatting/api/get-messages/${conversationId}`
            );
            setPage(1);
            setHasMore(res.data.hasMore);
            return res.data.messages.reverse();
        },
        enabled: !!conversationId,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });

    const loadMoreMessages = async () => {
        if (messageContainerRef.current) {
            previousScrollHeightRef.current = messageContainerRef.current.scrollHeight;
        }
        isLoadingMoreRef.current = true;
        const nextPage = page + 1;
        const res = await axiosInstance.get(
            `/chatting/api/get-messages/${conversationId}?page=${nextPage}`
        );

        queryClient.setQueryData(
            ["messages", conversationId],
            (oldData: any = []) => [...res.data.messages.reverse(), ...oldData]
        );
        setPage(nextPage);
        setHasMore(res.data.hasMore);
    };
    const { data: conversations, isLoading } = useQuery({
        queryKey: ["conversations"],
        queryFn: async () => {
            const res = await axiosInstance.get(
                "/chatting/api/get-user-conversations"
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
                const sellerId = chat.seller?.id;
                if (sellerId && onlineUsers[sellerId] !== undefined) {
                    return {
                        ...chat,
                        seller: { ...chat.seller, isOnline: onlineUsers[sellerId] },
                    };
                }
                return chat;
            })
        );
        // Also update selectedChat
        if (selectedChat?.seller?.id && onlineUsers[selectedChat.seller.id] !== undefined) {
            setSelectedChat((prev: any) => prev ? ({
                ...prev,
                seller: { ...prev.seller, isOnline: onlineUsers[prev.seller.id] },
            }) : null);
        }
    }, [onlineUsers]);

    // Handle message seen notifications
    useEffect(() => {
        if (lastSeenUpdate && lastSeenUpdate.conversationId === conversationId && lastSeenUpdate.seenByType === 'seller') {
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
                            };
                        }
                        return chat;
                    })
                );

                // If message is for current conversation, update messages list
                if (data.payload.conversationId === conversationId) {
                    queryClient.setQueryData(
                        ["messages", conversationId],
                        (old: any = []) => [...old, data.payload]
                    );
                    // Mark as seen immediately
                    ws.send(JSON.stringify({
                        type: "MARK_AS_SEEN",
                        conversationId: conversationId,
                        senderType: "user"
                    }));
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

        ws?.send(
            JSON.stringify({
                type: "MARK_AS_SEEN",
                conversationId: chat.conversationId,
            })
        );
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
            fromUserId: user?.id,
            toUserId: selectedChat?.seller?.id,
            conversationId: selectedChat?.conversationId,
            messageBody: message,
            senderType: "user",
        };

        ws?.send(JSON.stringify(payload));
        setChats((prevChats) =>
            prevChats.map((chat) =>
                chat.conversationId === selectedChat.conversationId
                    ? { ...chat, lastMessage: payload.messageBody }
                    : chat
            )
        );
        setMessage("");
        scrollToBottom();
        setTimeout(() => setIsSending(false), 300);
    };

    return (
        <div className="w-full">
            <div className="md:w-[80%] mx-auto pt-5 px-2 md:px-0">
                <div className="flex h-[85vh] md:h-[80vh] shadow-sm overflow-hidden border border-gray-200 rounded-lg bg-white">
                    {/* Sidebar - Hidden on mobile when chat selected */}
                    <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} w-full md:w-[320px] border-r border-r-gray-200 bg-gray-50 flex-col`}>
                        <div className="p-4 border-b border-b-gray-200 text-lg font-semibold text-gray-800">
                            Tin nhắn
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y divide-gray-200">
                            {isLoading ? (
                                <PageLoader />
                            ) : chats.length === 0 ? (
                                <div className="p-4 text-sm text-gray-500">
                                    No conversations yet.
                                </div>
                            ) : (
                                chats.map((chat) => {
                                    const isActive =
                                        selectedChat?.conversationId === chat.conversationId;
                                    return (
                                        <button
                                            key={chat.conversationId}
                                            onClick={() => handleChatSelect(chat)}
                                            disabled={isSending}
                                            className={`w-full text-left px-4 py-3 transition hover:bg-blue-50 flex items-center gap-3 ${isActive ? "bg-blue-100" : ""
                                                }`}
                                        >
                                            {/* <div className="relative">
                                                <Image
                                                    src={chat.seller.avatar || "/default-avatar.png"}
                                                    alt={chat.seller.name}
                                                    width={40}
                                                    height={40}
                                                    className="rounded-full object-cover w-10 h-10"
                                                />
                                                {chat.seller?.isOnline && (
                                                    <span className="absolute bottom-0 right-0 block w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                                                )}
                                            </div> */}
                                             <div className="relative">
                                            {chat.seller?.avatar ? (
                                                <Image
                                                    src={chat.seller.avatar}
                                                    alt={chat.seller?.name || "Seller"}
                                                    width={44}
                                                    height={44}
                                                    className="rounded-full object-cover w-11 h-11 border border-gray-200"
                                                />
                                            ) : (
                                                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 border border-indigo-200 flex items-center justify-center">
                                                    <User className="w-6 h-6 text-indigo-600" />
                                                </div>
                                            )}
                                            {chat.seller?.isOnline && (
                                                <span className="absolute bottom-0 right-0 block w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                            )}
                                        </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline">
                                                    <span className="font-medium text-gray-900 truncate">
                                                        {chat.seller.name}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 truncate">
                                                    {getLastMessage(chat)}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Chat Area - Hidden on mobile when no chat selected */}
                    <div className={`${!selectedChat ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-white`}>
                        {selectedChat ? (
                            <>
                                {/* Chat Header with Back Button */}
                                <div className="p-4 border-b border-gray-200 flex items-center gap-3 bg-white">
                                    {/* Mobile Back Button */}
                                    <button 
                                        onClick={() => setSelectedChat(null)}
                                        className="md:hidden p-2 -ml-2 hover:bg-gray-100 rounded-full transition"
                                    >
                                        <ArrowLeft size={20} className="text-gray-600" />
                                    </button>
                                    {selectedChat.seller?.avatar ? (
                                        <Image
                                            src={selectedChat.seller.avatar || "/default-avatar.png"}
                                            alt={selectedChat.seller.name}
                                            width={40}
                                            height={40}
                                        className="rounded-full object-cover w-10 h-10"
                                    />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 border border-indigo-200 flex items-center justify-center">
                                            <User className="w-6 h-6 text-indigo-600" />
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            {selectedChat.seller.name}
                                        </h3>
                                        <span className="text-xs text-gray-500">
                                            {selectedChat.seller.isOnline ? "Online" : "Offline"}
                                        </span>
                                    </div>
                                </div>
                                {hasMore && (
                                    <div className="div">
                                        <button
                                            onClick={loadMoreMessages}
                                            className="w-full text-center text-sm text-blue-600 hover:underline p-2"
                                        >
                                            Load previous messages
                                        </button>
                                    </div>
                                )}
                                {/* Messages List */}
                                <div
                                    className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
                                    ref={messageContainerRef}
                                >
                                    {messages.map((msg: any, index: number) => {
                                        const isMe = msg.senderType === "user";
                                        const isLastMyMessage = isMe && index === messages.length - 1;
                                        return (
                                            <div
                                                key={msg.id || index}
                                                className={`flex flex-col ${isMe ? "items-end" : "items-start"
                                                    }`}
                                            >
                                                <div
                                                    className={`max-w-[70%] px-4 py-2 rounded-lg text-sm ${isMe
                                                            ? "bg-blue-600 text-white rounded-br-none"
                                                            : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"
                                                        }`}
                                                >
                                                    <p>{msg.content}</p>
                                                    <span
                                                        className={`text-[10px] block mt-1 ${isMe ? "text-blue-100" : "text-gray-400"
                                                            }`}
                                                    >
                                                        {new Date(msg.createdAt).toLocaleTimeString([], {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </span>
                                                </div>
                                                {/* Show seen indicator for last message from user */}
                                                {isLastMyMessage && isMessageSeen && (
                                                    <span className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                                                        ✓✓ Đã xem
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                    <div ref={scrollAnchorRef} />
                                </div>

                                {/* Input Area */}
                                <ChatInput
                                    onSendMessage={handleSend}
                                    message={message}
                                    setMessage={setMessage}
                                />
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-500 flex-col gap-2">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                    <Send size={32} className="text-gray-400" />
                                </div>
                                <p>Select a conversation to start chatting</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Page;
