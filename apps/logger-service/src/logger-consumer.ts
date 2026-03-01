import Redis from "ioredis";
import { clients } from "./main";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL 
    ? process.env.UPSTASH_REDIS_REST_URL.replace('https://', 'rediss://').replace('http://', 'redis://')
    : process.env.REDIS_URL || 'redis://localhost:6379';
const subscriber = new Redis(process.env.UPSTASH_REDIS_URL || process.env.REDIS_URL || redisUrl);
const logQueue:string[] = [];

//websocket processing function for logs
const processLogs = () => {
    if(logQueue.length === 0) return;

    console.log(`Processing ${logQueue.length} log messages`);
    const logs = [...logQueue];
    logQueue.length = 0;

    clients.forEach((client) => {
        logs.forEach((log) => {
            client.send(log);
        });
    });
};

setInterval(processLogs, 3000); // Process logs every 3 seconds

// consume log messages from Redis
export const consumerRedisMessages = async () => {
    subscriber.subscribe("logs", (err, count) => {
        if (err) {
            console.error('Failed to subscribe: %s', err.message);
        } else {
            console.log(`Subscribed to ${count} channels. Listening for logs...`);
        }
    });

    subscriber.on("message", (channel, message) => {
        if (channel === "logs" && message) {
            logQueue.push(message);
        }
    });
}

// Start Redis consumer
consumerRedisMessages().catch(console.error);