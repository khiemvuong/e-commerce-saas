import Redis from 'ioredis';
import prisma from '@packages/libs/prisma';
import { incrementUnseenCount } from '@packages/libs/redis/message.redis';


interface BufferedMessage{
    conversationId: string;
    senderId: string;
    senderType: string;
    content: string;
    createdAt: string;
}

const TOPIC = 'chat.new_messages';

const BATCH_INTERVAL_MS = 3000; // 3 seconds

const RECEIVER_TYPE_MAPPING: Record<string, string> = {
    user: 'seller',
    seller: 'user',
};

let buffer: BufferedMessage[] = [];
let flushTimer: NodeJS.Timeout | null = null;

//Initialize redis subscriber

export async function startConsumer(){
    // Use UPSTASH_REDIS_REST_URL as UPSTASH_REDIS_URL to connect via ioredis (needs adjusting to standard redis:// format if using Upstash, or just REDIS_URL)
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL 
        ? process.env.UPSTASH_REDIS_REST_URL.replace('https://', 'rediss://').replace('http://', 'redis://')
        : process.env.REDIS_URL || 'redis://localhost:6379';
    
    // Upstash REST URL looks like https://YOUR_ENDPOINT.upstash.io.
    // However, Upstash also provides a direct Redis endpoint (e.g. YOUR_ENDPOINT.upstash.io:6379).
    // For now, if UPSTASH_REDIS_URL is provided by the user/system, we use that.
    const subscriber = new Redis(process.env.UPSTASH_REDIS_URL || process.env.REDIS_URL || redisUrl);

    subscriber.subscribe(TOPIC, (err, count) => {
        if (err) {
            console.error('Failed to subscribe: %s', err.message);
        } else {
            console.log(`Chat Message Consumer is connected and subscribed to ${count} channels. Topic:`, TOPIC);
        }
    });

    subscriber.on('message', (channel, message) => {
        if (channel !== TOPIC || !message) return;

        try {
            const parsed: BufferedMessage = JSON.parse(message.toString());
            buffer.push(parsed);

            // if This is the first message in an empty array then start the timer
            if(buffer.length === 1 && !flushTimer){
                flushTimer = setTimeout(flushBufferToDb, BATCH_INTERVAL_MS)
            }
                    
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });
}

// Flush the buffer to the database and reset the timer
async function flushBufferToDb(){
    const toInsert = buffer.splice(0, buffer.length); //Get all buffered messages
    if(flushTimer){
        clearTimeout(flushTimer);
        flushTimer = null;
    }
    if(toInsert.length === 0){
        return;
    }
    try {
        const prismaPayload = toInsert.map((msg) => ({
            conversationId: msg.conversationId,
            senderId: msg.senderId,
            senderType: msg.senderType,
            content: msg.content,
            createdAt: new Date(msg.createdAt),
        }));
        await prisma.message.createMany({
            data: prismaPayload,
        });
        //Redis unseen counter (only if DB insert was successful)
        for (const msg of prismaPayload) {
            const receiverType = (RECEIVER_TYPE_MAPPING[msg.senderType] || 'user') as 'user' | 'seller';
            await incrementUnseenCount(receiverType, msg.conversationId);
        }

        console.log(`Flushed ${prismaPayload.length} messages to the database and redis.`);
    } catch (error) {
        console.error('Error inserting messages to the database:', error);
        buffer.unshift(...toInsert); //Re-add messages to the buffer on failure
        if(!flushTimer){
            flushTimer = setTimeout(flushBufferToDb, BATCH_INTERVAL_MS);
        }
    }
}
