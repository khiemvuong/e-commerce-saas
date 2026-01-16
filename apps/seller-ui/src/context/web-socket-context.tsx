"use client";

import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";

type SeenUpdate = {
    conversationId: string;
    seenBy: string;
    seenByType: "user" | "seller";
    seenAt: string;
};

type WebSocketContextType = {
    ws: WebSocket | null;
    unreadCounts: Record<string, number>;
    onlineUsers: Record<string, boolean>;
    lastSeenUpdate: SeenUpdate | null;
};

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider = ({
    children,
    seller,
}: {
    children: React.ReactNode;
    seller: any;
}) => {
    const [wsReady, setWsReady] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
    const [lastSeenUpdate, setLastSeenUpdate] = useState<SeenUpdate | null>(null);

    useEffect(() => {
        if (!seller?.id) return;
        let ws: WebSocket | null = null;
        let reconnectTimeout: NodeJS.Timeout;

        const connect = () => {
            const socketUrl = process.env.NEXT_PUBLIC_CHATTING_WEBSOCKET_URL;
            if (!socketUrl) {
                console.error("WebSocket URL is missing in environment variables");
                return;
            }

            ws = new WebSocket(socketUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log("WebSocket connection opened");
                ws?.send(`seller_${seller.id}`);
                setWsReady(true);
            };

            ws.addEventListener("message", (event) => {
                const data = JSON.parse(event.data);
                
                if (data.type === "UNSEEN_COUNT_UPDATE") {
                    const { conversationId, count } = data.payload;
                    setUnreadCounts((prev) => ({
                        ...prev,
                        [conversationId]: count,
                    }));
                }
                
                // Handle online status changes
                if (data.type === "ONLINE_STATUS_CHANGE") {
                    const { id, isOnline } = data.payload;
                    setOnlineUsers((prev) => ({
                        ...prev,
                        [id]: isOnline,
                    }));
                }
                
                // Handle message seen notifications
                if (data.type === "MESSAGE_SEEN") {
                    setLastSeenUpdate(data.payload);
                }
            });

            ws.onclose = () => {
                console.log("WebSocket disconnected. Retrying in 3s...");
                setWsReady(false);
                reconnectTimeout = setTimeout(connect, 3000);
            };

            // ws.onerror = (error) => {
            //     console.error("WebSocket connection error. State:", ws?.readyState);
            // };
        };

        connect();

        return () => {
            if (ws) {
                ws.onclose = null; 
                ws.onerror = null;
                ws.onopen = null;
                ws.close();
            }
            clearTimeout(reconnectTimeout);
        };
    }, [seller?.id]);

    return (
        <WebSocketContext.Provider value={{ ws: wsRef.current, unreadCounts, onlineUsers, lastSeenUpdate }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => useContext(WebSocketContext);

