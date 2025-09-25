import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorMiddleware } from '../../../packages/error-handler/error-middleware';

const app = express();
app.use(cors({
origin: 'http://localhost:3000',
allowedHeaders: ['Content-Type', 'Authorization'],
credentials: true,
})
);
app.use(express.json());
app.use(cookieParser());
app.get('/', (req, res) => {
    res.send({ 'message': 'Auth Service is running' });
});

app.use(errorMiddleware)


const port = process.env.PORT || 6001;
const server = app.listen(port, () => {
console.log(`Auth service is running at http://localhost:${port}/api`);
});
server.on("error", (err) => {
console.error("Server erros:",err);
});
