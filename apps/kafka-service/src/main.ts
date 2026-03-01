import Redis from "ioredis";
import { updateShopAnalytics, updateUserAnalytics } from './services/analytics.service';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL 
    ? process.env.UPSTASH_REDIS_REST_URL.replace('https://', 'rediss://').replace('http://', 'redis://')
    : process.env.REDIS_URL || 'redis://localhost:6379';
const subscriber = new Redis(process.env.UPSTASH_REDIS_URL || process.env.REDIS_URL || redisUrl);

const eventQueue: any[] = [];

const processQueue = async () => {
  if (eventQueue.length === 0) return;

  const events = [...eventQueue];
  eventQueue.length = 0;

  for (const event of events) {
    if(event.action === 'shop_view'){
      await updateShopAnalytics(event);
    }
    const validActions =[
      "add_to_wishlist",
      "add_to_cart",
      "product_view",
      "remove_from_wishlist",
      "remove_from_cart",
      "shop_view"
    ];
    if(!event.action || !validActions.includes(event.action)){
      console.log(`Invalid action: ${event.action}`);
      continue;
    }
    try {
      await updateUserAnalytics(event);
    } catch (error) {
      console.log('Error updating user analytics:', error);
    }
  }
};
setInterval(processQueue, 3000); // Process queue every 3 seconds


//Redis consume for user events
export const consumeRedisMessages = async () => {
  subscriber.subscribe('user-events', (err, count) => {
    if (err) {
      console.error('Failed to subscribe to user-events:', err.message);
    } else {
      console.log(`Subscribed to ${count} channels. Listening for user-events...`);
    }
  });

  subscriber.on('message', (channel, message) => {
    if (channel === 'user-events' && message) {
      try {
        const event = JSON.parse(message);
        eventQueue.push(event);
      } catch(e) {
        console.error("Error parsing user-event:", e);
      }
    }
  });
};


consumeRedisMessages().catch(console.error);