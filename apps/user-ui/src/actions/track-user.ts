"use server";
import { Redis } from '@upstash/redis';

// Note: Upstash Redis over HTTP is perfect for Server Actions in Next.js
// It doesn't require maintaining a persistent connection like ioredis does.
const redis = Redis.fromEnv();

export async function sendKafkaEvent(eventData:{
    userId?:string;
    productId?:string;
    shopId?:string;
    action:string;
    device?: string;
    country?: string;
    city?: string;
}){
    try {
        await redis.publish('user-events', JSON.stringify(eventData));
    } catch (error) {
        console.error('Error sending Redis event:', error);
    }
};
