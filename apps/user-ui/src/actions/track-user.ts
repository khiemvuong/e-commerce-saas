"use server";
import { Kafka } from 'kafkajs';
const kafka = new Kafka({
    clientId: 'kafka-service',
    brokers: ['localhost:9092'], // Local Docker broker
});
const producer = kafka.producer();

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
        await producer.connect();
        await producer.send({
            topic: 'user-events',
            messages: [
                {
                    value: JSON.stringify(eventData),
                },
            ],
        });
    } catch (error) {
        console.error('Error sending Kafka event:', error);
    } finally {
        await producer.disconnect();
    }
};
