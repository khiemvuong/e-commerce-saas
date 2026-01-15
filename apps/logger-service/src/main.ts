import WebSocket from "ws";
import express from "express";
import http from "http";
import { consumerKafkaMessages } from "./logger-consumer";
const app = express();

const wsServer = new WebSocket.Server({ noServer: true });
export const clients = new Set<WebSocket>();

wsServer.on("connection", (ws) => {
  console.log("New WebSocket connection established");
  clients.add(ws);
  ws.on("close", () => {
    console.log("WebSocket connection closed");
    clients.delete(ws);
  });
});

const server = http.createServer(app);

server.on("upgrade", (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head, (ws) => {
    wsServer.emit("connection", ws, request);
  });
});

server.listen(process.env.PORT || 6008, () => {
  console.log(`Logger service is running on port ${process.env.PORT || 6008}`);
});

// Start kafka consumer
consumerKafkaMessages();