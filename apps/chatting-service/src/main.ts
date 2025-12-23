import cookieParser from "cookie-parser";
import express from "express";
import { startConsumer } from "./chat-message.consumer";
import { createWebsocketServer } from "./websocket";

const app = express();
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send({ message: "Welcome to chatting-service!" });
});

const port = process.env.PORT || 6006;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
//Websocket server
createWebsocketServer(server);
//Kafka Consumer
startConsumer().catch((error) => {
  console.error("Error starting chat message consumer:", error);
});

server.on("error", console.error);
