/**
 * WebSocket Hook for Real-time Metrics Updates
 * Connects to metrics WebSocket server and updates data in real-time
 */

import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

const WS_URL = 'ws://localhost:6002/ws/metrics';
const RECONNECT_DELAY = 3000; // 3 seconds

interface MetricsMessage {
    type: 'connected' | 'metrics-update' | 'summary-update';
    data?: any;
    message?: string;
    timestamp: string;
}

export const useMetricsWebSocket = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const queryClient = useQueryClient();

    const connect = () => {
        try {
            const ws = new WebSocket(WS_URL);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('✅ Connected to metrics WebSocket');
                setIsConnected(true);
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                    reconnectTimeoutRef.current = null;
                }
            };

            ws.onmessage = (event) => {
                try {
                    const message: MetricsMessage = JSON.parse(event.data);
                    setLastUpdate(new Date());

                    switch (message.type) {
                        case 'connected':
                            console.log('📊 Metrics WebSocket:', message.message);
                            break;

                        case 'metrics-update':
                            // Update metrics cache with new data
                            queryClient.invalidateQueries({ queryKey: ['endpoints-metrics'] });
                            break;

                        case 'summary-update':
                            // Update summary cache
                            queryClient.invalidateQueries({ queryKey: ['metrics-summary'] });
                            queryClient.invalidateQueries({ queryKey: ['cache-metrics'] });
                            break;

                        default:
                            console.log('Unknown message type:', message.type);
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                setIsConnected(false);
            };

            ws.onclose = () => {
                console.log('🔌 WebSocket disconnected');
                setIsConnected(false);
                wsRef.current = null;

                // Attempt to reconnect after delay
                reconnectTimeoutRef.current = setTimeout(() => {
                    console.log('🔄 Attempting to reconnect...');
                    connect();
                }, RECONNECT_DELAY);
            };
        } catch (error) {
            console.error('Failed to connect to WebSocket:', error);
            setIsConnected(false);
        }
    };

    useEffect(() => {
        connect();

        // Cleanup on unmount
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    return {
        isConnected,
        lastUpdate,
    };
};
