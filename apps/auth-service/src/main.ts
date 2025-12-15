import  swaggerUi from 'swagger-ui-express';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorMiddleware } from '@packages/error-handler/error-middleware';
import router from './routes/auth.router';
const swaggerDocument = require('./swagger-output.json');

const app = express();


app.use(cors({
origin: ['http://localhost:3000', 'http://localhost:3001'], 
allowedHeaders: ['Authorization','Content-Type'],
credentials: true,
})
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());
app.get('/', (req, res) => {
    res.send({ 'message': 'Auth Service is running' });
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/docs-json", (req, res) => {
    res.json(swaggerDocument);
});
//Routers
app.use("/api",router);

app.use(errorMiddleware)


const port = 6001;
const server = app.listen(port, () => {
    console.log(`Auth service is running at http://localhost:${port}/api`);
    console.log(`Swagger docs available at http://localhost:${port}/docs`);
});
server.on("error", (err) => {
console.error("Server erros:",err);
});
