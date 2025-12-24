"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

const WebSocketContext = createContext<any>(null);
export const WebSocketProvider = ({
  children,
  user,
}: {
  children: React.ReactNode;
  user: any;
}) => {
    const wsRef = useRef<WebSocket | null>(null);
    const [unreadCounts,setUnreadCounts] = useState<Record<string,  number>>({});
    useEffect(() => {
        if (!user?.id) return;
        const ws = new WebSocket(process.env.NEXT_PUBLIC_CHATTING_WEBSOCKET_URL || "");
        wsRef.current = ws;
        ws.onopen = () => {
            console.log("WebSocket connection opened");
            ws.send(`user_${user.id}`);
        }
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "UNSEEN_COUNT_UPDATE") {
                const [conversationId, count] = data.payload;
                setUnreadCounts(prev => ({
                    ...prev,
                    [conversationId]: count
                }));
            }
        }
        return () => {
            ws.close();
        }
    }, [user?.id]);
    
    const value = useMemo(() => ({
        ws: wsRef.current,
        unreadCounts
    }), [unreadCounts]);
    
    return <WebSocketContext.Provider value={value}>
        {children}
    </WebSocketContext.Provider>;
};

export const useWebSocket = () => useContext(WebSocketContext);

