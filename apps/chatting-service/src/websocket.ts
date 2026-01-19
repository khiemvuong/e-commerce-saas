import { kafka } from "@packages/utils/kafka";
import redis from "@packages/libs/redis";
import prisma from "@packages/libs/prisma";
import { Server as HttpServer } from "http";
import WebSocket, { WebSocketServer } from "ws";
const producer = kafka.producer();
const connectedUsers: Map<string, WebSocket> = new Map();
const unseenCounts: Map<string, number> = new Map();

type IncomingMessage = {
    type?: string;
    fromUserId?: string;
    toUserId?: string;
    messageBody?: string;
    conversationId?: string;
    senderType: string;
};

// Helper: Broadcast online status to all conversations of a user
async function broadcastOnlineStatus(registeredUserId: string, isOnline: boolean) {
    try {
        const isSeller = registeredUserId.startsWith("seller_");
        const rawId = isSeller 
            ? registeredUserId.replace("seller_", "") 
            : registeredUserId.replace("user_", "");

        // Find all conversations where this user/seller is a participant
        const conversations = await prisma.conversationGroup.findMany({
            where: {
                participantIds: {
                    has: rawId,
                },
            },
        });

        for (const conversation of conversations) {
            // Find the other participant
            const otherParticipantIds = conversation.participantIds.filter(id => id !== rawId);
            
            for (const otherId of otherParticipantIds) {
                // Determine the socket key for the other participant
                // We need to check both user and seller keys
                const userKey = `user_${otherId}`;
                const sellerKey = `seller_${otherId}`;
                
                const otherSocket = connectedUsers.get(userKey) || connectedUsers.get(sellerKey);
                
                if (otherSocket && otherSocket.readyState === WebSocket.OPEN) {
                    otherSocket.send(JSON.stringify({
                        type: "ONLINE_STATUS_CHANGE",
                        payload: {
                            id: rawId,
                            isOnline,
                            userType: isSeller ? "seller" : "user",
                        },
                    }));
                    console.log(`Broadcasted online status (${isOnline}) to ${otherId}`);
                }
            }
        }
    } catch (error) {
        console.error("Error broadcasting online status:", error);
    }
}

// Helper: Notify sender that their messages were seen
async function notifyMessageSeen(conversationId: string, seenByUserId: string, senderType: string) {
    try {
        const isSeller = seenByUserId.startsWith("seller_");
        const rawId = isSeller 
            ? seenByUserId.replace("seller_", "") 
            : seenByUserId.replace("user_", "");

        // Find the conversation
        const conversation = await prisma.conversationGroup.findUnique({
            where: { id: conversationId },
        });

        if (!conversation) return;

        // Find the other participant who sent the messages
        const otherParticipantIds = conversation.participantIds.filter(id => id !== rawId);

        for (const otherId of otherParticipantIds) {
            // The other party could be either user or seller
            const userKey = `user_${otherId}`;
            const sellerKey = `seller_${otherId}`;
            
            const otherSocket = connectedUsers.get(userKey) || connectedUsers.get(sellerKey);

            if (otherSocket && otherSocket.readyState === WebSocket.OPEN) {
                otherSocket.send(JSON.stringify({
                    type: "MESSAGE_SEEN",
                    payload: {
                        conversationId,
                        seenBy: rawId,
                        seenByType: isSeller ? "seller" : "user",
                        seenAt: new Date().toISOString(),
                    },
                }));
                console.log(`Notified ${otherId} that messages were seen by ${rawId}`);
            }
        }
    } catch (error) {
        console.error("Error notifying message seen:", error);
    }
}

export async function createWebsocketServer(server: HttpServer) {
    const wss = new WebSocketServer({ server });
    await producer.connect();
    console.log("WebSocket server is running");
    wss.on("connection", (ws: WebSocket) => {
        console.log("New client connected");

        let registeredUserId: string | null = null;
        ws.on("message", async (rawMessage) => {
            try {
                const messageStr = rawMessage.toString();
                // Register the user on first plain message (non-JSON)
                if (!registeredUserId && !messageStr.startsWith("{")) {
                    registeredUserId = messageStr;
                    connectedUsers.set(registeredUserId, ws);
                    console.log(`registered websocket for userId: ${registeredUserId}`);

                    const isSeller = registeredUserId.startsWith("seller_");
                    const redisKey = isSeller
                        ? `online:seller:${registeredUserId.replace("seller_", "")}`
                        : `online:user:${registeredUserId.replace("user_", "")}`;
                    await redis.set(redisKey, "1");
                    await redis.expire(redisKey, 60 * 5); // expire in 5 minutes

                    // Broadcast online status to all conversations
                    await broadcastOnlineStatus(registeredUserId, true);
                    return;
                }

                // Process JSON messages
                const data: IncomingMessage = JSON.parse(messageStr);

                //If it's seen update
                if (data.type === "MARK_AS_SEEN" && registeredUserId) {
                    const seenKey = `${registeredUserId}_${data.conversationId}`;
                    unseenCounts.set(seenKey, 0);
                    
                    // Notify the other party that messages were seen
                    await notifyMessageSeen(data.conversationId!, registeredUserId, data.senderType);
                    return;
                }

                //Regular message
                const {
                    fromUserId,
                    toUserId,
                    messageBody,
                    conversationId,
                    senderType,
                } = data;

                if (
                    !data ||
                    !toUserId ||
                    !fromUserId ||
                    !messageBody ||
                    !conversationId
                ) {
                    console.warn("Invalid message format", data);
                    return;
                }

                const now = new Date().toISOString();
                const messagePayload = {
                    conversationId,
                    senderId: fromUserId,
                    senderType,
                    content: messageBody,
                    createdAt: now,
                };

                const messageEvent = JSON.stringify({
                    type: "MESSAGE_RECEIVED",
                    payload: messagePayload,
                });

                const receiverKey =
                    senderType === "user" ? `seller_${toUserId}` : `user_${toUserId}`;
                const senderKey =
                    senderType === "user" ? `user_${fromUserId}` : `seller_${fromUserId}`;
                //Update unseen count dynamically
                const unseenKey = `${receiverKey}_${conversationId}`;
                const prevCount = unseenCounts.get(unseenKey) || 0;
                unseenCounts.set(unseenKey, prevCount + 1);

                //send new message to receiver
                const receiverSocket = connectedUsers.get(receiverKey);
                if (receiverSocket && receiverSocket.readyState === WebSocket.OPEN) {
                    receiverSocket.send(messageEvent);

                    //Also notify unseen count
                    receiverSocket.send(
                        JSON.stringify({
                            type: "UNSEEN_COUNT_UPDATE",
                            payload: {
                                conversationId,
                                count: prevCount + 1,
                            },
                        })
                    );
                    console.log(`Sent message to connected user: ${receiverKey}`);
                } else{
                    console.log(`User ${receiverKey} not connected, skipping real-time delivery`);
                }

                //Echo to sender
                const senderSocket = connectedUsers.get(senderKey);
                if (senderSocket && senderSocket.readyState === WebSocket.OPEN) {
                    senderSocket.send(messageEvent);
                    console.log(`Sent message to connected user: ${senderKey}`);
                } else{
                    console.log(`User ${senderKey} not connected, skipping real-time delivery`);
                }

                //Push to Kafka consumer
                await producer.send({
                    topic: "chat.new_messages",
                    messages: [
                        {
                            key: conversationId,
                            value: JSON.stringify(messagePayload),
                        },
                    ],
                });
                console.log(`Message sent to Kafka : ${conversationId}`);
            } catch (error) {
                console.error("Error processing message:", error);
            }
        });
        ws.on("close", async () => {
            if(registeredUserId){
                // Broadcast offline status before removing from map
                await broadcastOnlineStatus(registeredUserId, false);
                
                connectedUsers.delete(registeredUserId);
                console.log(`Client disconnected: ${registeredUserId}`);
                const isSeller = registeredUserId.startsWith("seller_");
                const redisKey = isSeller
                    ? `online:seller:${registeredUserId.replace("seller_", "")}`
                    : `online:user:${registeredUserId.replace("user_", "")}`;
                await redis.del(redisKey);
            }
        });
        ws.on("error", (error) => {
            console.error("WebSocket error:", error);
        });
    });
    console.log("WebSocket server setup complete");
}

