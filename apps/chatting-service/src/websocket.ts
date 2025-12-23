import { kafka } from "@packages/utils/kafka";
import redis from "@packages/libs/redis";
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
                        : `online:user:${registeredUserId}`;
                    await redis.set(redisKey, "1");
                    await redis.expire(redisKey, 60 * 5); // expire in 5 minutes
                    return;
                }

                // Process JSON messages
                const data: IncomingMessage = JSON.parse(messageStr);

                //If it's seen update
                if (data.type === "MARK_AS_SEEN" && registeredUserId) {
                    const seenKey = `${registeredUserId}_${data.conversationId}`;
                    unseenCounts.set(seenKey, 0);
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
                    type: "NEW_MESSAGE",
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
                connectedUsers.delete(registeredUserId);
                console.log(`Client disconnected: ${registeredUserId}`);
                const isSeller = registeredUserId.startsWith("seller_");
                const redisKey = isSeller
                    ? `online:seller:${registeredUserId.replace("seller_", "")}`
                    : `online:user:${registeredUserId}`;
                await redis.del(redisKey);
            }
        });
        ws.on("error", (error) => {
            console.error("WebSocket error:", error);
        });
    });
    console.log("WebSocket server setup complete");
}
