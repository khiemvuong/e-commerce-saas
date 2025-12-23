import cookieParser from "cookie-parser";
import express from "express";
import { startConsumer } from "./chat-message.consumer";
import { createWebsocketServer } from "./websocket";
import { errorMiddleware } from "@packages/error-handler/error-middleware";
import router from "./routes/chat.routes";

const app = express();
app.use(express.json());
app.use(cookieParser());


app.get("/", (req, res) => {
  res.send({ message: "Welcome to chatting-service!" });
});
//routes
app.use("/api",router);

app.use(errorMiddleware);
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
