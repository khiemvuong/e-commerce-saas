import {kafka} from '@packages/utils/kafka';
import { updateShopAnalytics, updateUserAnalytics } from './services/analytics.service';

const consumer = kafka.consumer({groupId: 'user-events-group'});

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


//Kafka consume for user events
export const consumeKafkaMessages = async () => {
  //Connect the kafka broker
  await consumer.connect();
  await consumer.subscribe({topic: 'user-events', fromBeginning: false});
  
  await consumer.run({
    eachMessage: async ({  message }) => {
      if (!message.value) return;
      const event = JSON.parse(message.value.toString());
      eventQueue.push(event);
    },
  });
};


consumeKafkaMessages().catch(console.error);