"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "apps/user-ui/src/context/web-socket-context";
import useRequiredAuth from "apps/user-ui/src/hooks/useRequiredAuth";
import ChatInput from "apps/user-ui/src/shared/components/chats/chatinput";
import PageLoader from "apps/user-ui/src/shared/components/loading/page-loader";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import { isProtected } from "apps/user-ui/src/utils/protected";
import { Send } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

const Page = () => {
    const searchParams = useSearchParams();
    const { user, isLoading: userLoading } = useRequiredAuth();
    const router = useRouter();
    const wsRef = useRef<WebSocket | null>(null);
    const messageContainerRef = useRef<HTMLDivElement | null>(null);
    const scrollAnchorRef = useRef<HTMLDivElement | null>(null);
    const queryClient = useQueryClient();
    const [chats, setChats] = useState<any[]>([]);
    const [selectedChat, setSelectedChat] = useState<any>(null);
    const [hasMore, setHasMore] = useState(false);
    const [page, setPage] = useState(1);
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const conversationId = searchParams.get("conversationId");
    const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
    const { ws, unreadCounts } = useWebSocket();
    const { data: messages = [] } = useQuery({
        queryKey: ["messages", conversationId],
        queryFn: async () => {
            if (!conversationId || hasFetchedOnce) return [];
            const res = await axiosInstance.get(
                `/chatting/api/get-messages/${conversationId}`,
                isProtected
            );
            setPage(1);
            setHasFetchedOnce(true);
            setHasFetchedOnce(true);
            return res.data.messages.reverse();
        },
        enabled: !!conversationId,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });

    const loadMoreMessages = async () => {
        const nextPage = page + 1;
        const res = await axiosInstance.get(
            `/chatting/api/get-messages/${conversationId}?page=${nextPage}`,
            isProtected
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
                "/chatting/api/get-user-conversations",
                isProtected
            );
            return res.data.conversations;
        },
    });

    useEffect(() => {
        if (conversations) setChats(conversations);
    }, [conversations]);

    useEffect(() => {
        if (messages?.length > 0) scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (conversationId && chats.length > 0) {
            const chat = chats.find((c) => c.conversationId === conversationId);
            if (chat) setSelectedChat(chat);
        }
    }, [conversationId, chats]);

    // Fetch messages when selectedChat changes
    useEffect(() => {
        if (selectedChat) {
            const fetchMessages = async () => {
                try {
                    const res = await axiosInstance.get(
                        `/chatting/api/get-messages/${selectedChat.conversationId}`,
                        isProtected
                    );
                    setMessage(res.data.messages.reverse()); // Reverse to show oldest first if needed, or handle via flex-col-reverse
                } catch (error) {
                    console.error("Error fetching messages:", error);
                }
            };
            fetchMessages();
        }
    }, [selectedChat]);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (scrollAnchorRef.current) {
            scrollAnchorRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const getLastMessage = (chat: any) => {
        return chat?.lastMessage || "No messages yet";
    };

    const handleChatSelect = (chat: any) => {
        setHasFetchedOnce(false);
        setChats((prev) =>
            prev.map((c) =>
                c.conversationId === chat.conversationId ? { ...c, unreadCount: 0 } : c
            )
        );
        router.push(`?conversationId =${chat.conversationId}`);

        ws?.send(JSON.stringify({
            type: "MARK_AS_SEEN",
            conversationId: chat.conversationId,
        }));
    };

    const scrollToBottom = () => {
        requestAnimationFrame(() => {
            setTimeout(() => {
                scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 0);
        });
    }
    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !selectedChat) return;
        const payload = {
            fromUserOd: user?.id,
            toUserId: selectedChat?.seller?.id,
            conversationId: selectedChat?.conversationId,
            messageBody: message,
            senderType: "user",
        };

        ws?.send(JSON.stringify(payload));
        queryClient.setQueryData(
            ["messages", selectedChat.conversationId],
            (old: any = []) => [
                ...old,
                {
                    content: payload.messageBody,
                    senderType: "user",
                    seen: false,
                    createdAt: new Date().toISOString(),
                },
            ]
        );
        setChats((prevChats) =>
            prevChats.map((chat) =>
                chat.conversationId
                    ? { ...chat, lastMessage: payload.messageBody }
                    : chat
            )
        );
        setMessage("");
        scrollToBottom();
    };

    return (
        <div className="w-full">
            <div className="md:w-[80%] mx-auto pt-5">
                <div className="flex h-[80vh] shadow-sm overflow-hidden border border-gray-200 rounded-lg bg-white">
                    {/* Sidebar */}
                    <div className="w-[320px] border-r border-r-gray-200 bg-gray-50 flex flex-col">
                        <div className="p-4 border-b border-b-gray-200 text-lg font-semibold text-gray-800">
                            Messages
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
                                            <div className="relative">
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

                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col bg-white">
                        {selectedChat ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 border-b border-gray-200 flex items-center gap-3 bg-white">
                                    <Image
                                        src={selectedChat.seller.avatar || "/default-avatar.png"}
                                        alt={selectedChat.seller.name}
                                        width={40}
                                        height={40}
                                        className="rounded-full object-cover w-10 h-10"
                                    />
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
                                        const isMe = msg.senderId === user?.id;
                                        return (
                                            <div
                                                key={msg.id || index}
                                                className={`flex ${isMe ? "justify-end" : "justify-start"
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
