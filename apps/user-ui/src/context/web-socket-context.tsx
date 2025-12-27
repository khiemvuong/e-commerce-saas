"use client";

import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";

const WebSocketContext = createContext<any>(null);
export const WebSocketProvider = ({
    children,
    user,
}: {
    children: React.ReactNode;
    user: any;
}) => {
    const [wsReady, setWsReady] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        if (!user?.id) return;
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
                ws?.send(`user_${user.id}`);
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
                ws.onclose = null; // Prevent reconnect on unmount
                ws.onerror = null;
                ws.onopen = null;
                ws.close();
            }
            clearTimeout(reconnectTimeout);
        };
    }, [user?.id]);

    return (
        <WebSocketContext.Provider value={{ ws: wsRef.current, unreadCounts }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => useContext(WebSocketContext);
