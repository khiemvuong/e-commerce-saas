/**
 * WebSocket Server for Real-time Metrics Updates
 * 
 * Broadcasts performance metrics to connected clients in real-time
 * Similar to logger-service WebSocket implementation
 */

import WebSocket from 'ws';
import http from 'http';

export const metricsClients = new Set<WebSocket>();

/**
 * Create WebSocket server for metrics
 */
export const createMetricsWebSocket = (server: http.Server): WebSocket.Server => {
    const wss = new WebSocket.Server({ noServer: true });

    wss.on('connection', (ws: WebSocket) => {
        console.log('✅ New metrics WebSocket client connected');
        metricsClients.add(ws);

        // Send welcome message
        ws.send(JSON.stringify({
            type: 'connected',
            message: 'Connected to metrics WebSocket server',
            timestamp: new Date().toISOString(),
        }));

        ws.on('close', () => {
            console.log('❌ Metrics WebSocket client disconnected');
            metricsClients.delete(ws);
        });

        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
            metricsClients.delete(ws);
        });
    });

    return wss;
};

/**
 * Broadcast metrics update to all connected clients
 */
export const broadcastMetrics = (data: any): void => {
    if (metricsClients.size === 0) return;

    const message = JSON.stringify({
        type: 'metrics-update',
        data,
        timestamp: new Date().toISOString(),
    });

    metricsClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            try {
                client.send(message);
            } catch (error) {
                console.error('Error sending metrics to client:', error);
            }
        }
    });
};

/**
 * Broadcast summary update to all connected clients
 */
export const broadcastSummary = (summary: any): void => {
    if (metricsClients.size === 0) return;

    const message = JSON.stringify({
        type: 'summary-update',
        data: summary,
        timestamp: new Date().toISOString(),
    });

    metricsClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            try {
                client.send(message);
            } catch (error) {
                console.error('Error sending summary to client:', error);
            }
        }
    });
};
