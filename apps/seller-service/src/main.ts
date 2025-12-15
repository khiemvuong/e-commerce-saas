import { errorMiddleware } from '@packages/error-handler/error-middleware';
import cookieParser from 'cookie-parser';
import express from 'express';
import router from './routes/seller.route';
const app = express();
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send({ message: 'Welcome to seller-service!' });
});
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

//routes
app.use("/api",router);

app.use(errorMiddleware);
const port = process.env.PORT || 6003;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
