import express from 'express';
import "./jobs/product-crone.job";  
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorMiddleware } from '@packages/error-handler/error-middleware';
import router from './routes/product.routes';
import  swaggerUi from 'swagger-ui-express';
const swaggerDocument = require('./swagger-output.json');

const app = express();


app.use(cors({
origin: ['http://localhost:3000'], 
allowedHeaders: ['Authorization','Content-Type'],
credentials: true,
})
);
// Increase body size limits to allow base64 image data uploads from the frontend.
// Default express.json limit is small (~100kb) and will reject large base64 payloads.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());
app.get('/', (req, res) => {
    res.send({ 'message': 'Product Service is running' });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get("/docs-json", (req, res) => {
    res.json(swaggerDocument);
});
// //Routers
app.use("/api",router);

app.use(errorMiddleware)


const port = 6002;
const server = app.listen(port, () => {
    console.log(`Product service is running at http://localhost:${port}/api`);
    // console.log(`Swagger docs available at http://localhost:${port}/docs`);
});
server.on("error", (err) => {
console.error("Server erros:",err);
});
