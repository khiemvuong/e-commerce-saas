import { kafka } from '@packages/utils/kafka';
import prisma from '@packages/libs/prisma';
import {Consumer, EachMessagePayload} from 'kafkajs';
import { incrementUnseenCount } from '@packages/libs/redis/message.redis';


interface BufferedMessage{
    conversationId: string;
    senderId: string;
    senderType: string;
    content: string;
    createdAt: string;
}

const TOPIC = 'chat.new_messages';
const GROUP_ID = 'chat-message-db-writer';
const BATCH_INTERVAL_MS = 3000; // 3 seconds

const RECEIVER_TYPE_MAPPING: Record<string, string> = {
    user: 'seller',
    seller: 'user',
};

let buffer: BufferedMessage[] = [];
let flushTimer: NodeJS.Timeout | null = null;

//Initialize kafka consumer

export async function startConsumer(){
    const consumer:Consumer = kafka.consumer({groupId: GROUP_ID});
    await consumer.connect();
    await consumer.subscribe({topic: TOPIC, fromBeginning: false});

    console.log('Chat Message Consumer is connected and subcribed to topic:', TOPIC);
    await consumer.run({
        eachMessage: async({message}:EachMessagePayload) => {
            if(!message.value) return;

            try {
                const parsed: BufferedMessage = JSON.parse(message.value.toString());
                buffer.push(parsed);

                // if This is the first message in an empty array then start the timer
                if(buffer.length === 1 && !flushTimer){
                    flushTimer = setTimeout(flushBufferToDb, BATCH_INTERVAL_MS)
                }
                        
            } catch (error) {
                console.error('Error parsing message:', error);
            }
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
            const receiverType = RECEIVER_TYPE_MAPPING[msg.senderType] || 'user';
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
