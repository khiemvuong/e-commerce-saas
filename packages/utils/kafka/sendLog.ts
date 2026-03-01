import redis from '../../libs/redis/index';

export async function sendLog({
    type = 'info',
    message,
    source = 'unknown-service',
}: {
    type?: 'success' | 'error' | 'info' | 'warning' | 'debug';
    message: string;
    source?: string;
}) {
    const logPayload = {
        type,
        message,
        timestamp: new Date().toISOString(),
        source,
    };

    try {
        await redis.publish('logs', JSON.stringify(logPayload));
    } catch (error) {
        console.error('Failed to send log to Redis:', error);
    }
}