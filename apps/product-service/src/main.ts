import express from 'express';
import http from 'http';
import "./jobs/product-crone.job";  
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorMiddleware } from '@packages/error-handler/error-middleware';
import { performanceTracker, setBroadcastFunction, setBroadcastSummaryFunction } from '@packages/middleware/performanceTracker';
import swaggerUi from 'swagger-ui-express';
import { createMetricsWebSocket, broadcastMetrics, broadcastSummary } from './modules/metrics/metricsWebSocket';
const swaggerDocument = require('./swagger-output.json');

// Import all modular routes (Clean Architecture)
import { productRoutes } from './modules/product';
import { eventRoutes } from './modules/event';
import { discountRoutes } from './modules/discount';
import { categoryRoutes } from './modules/category';
import { shopRoutes } from './modules/shop';
import { imageRoutes } from './modules/image';

const app = express();


app.use(cors({
origin: ['http://localhost:3000', 'http://localhost:3001'], 
allowedHeaders: ['Authorization','Content-Type'],
credentials: true,
})
);
// Increase body size limits to allow base64 image data uploads from the frontend.
// Default express.json limit is small (~100kb) and will reject large base64 payloads.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// Performance tracking middleware - records API response times to Redis
app.use(performanceTracker());

app.get('/', (req, res) => {
    res.send({ 'message': 'Product Service is running' });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get("/docs-json", (req, res) => {
    res.json(swaggerDocument);
});

// ==========================================
// All Modular Routes (Clean Architecture)
// ==========================================
app.use("/api", productRoutes);   // Product CRUD, search, filter
app.use("/api", eventRoutes);     // Events (time-limited offers)
app.use("/api", discountRoutes);  // Discount codes
app.use("/api", categoryRoutes);  // Categories
app.use("/api", shopRoutes);      // Shops
app.use("/api", imageRoutes);     // Image upload/delete

// Performance Metrics API (for monitoring dashboard)
import { metricsRoutes } from './modules/metrics/metricsRoutes';
app.use("/api", metricsRoutes);   // Performance metrics

app.use(errorMiddleware)


const port = 6002;
const server = http.createServer(app);

// Setup WebSocket for real-time metrics
const metricsWss = createMetricsWebSocket(server);

// Connect broadcast functions to performance tracker
setBroadcastFunction(broadcastMetrics);
setBroadcastSummaryFunction(broadcastSummary);

// Handle WebSocket upgrade for /ws/metrics endpoint
server.on('upgrade', (request, socket, head) => {
    const pathname = request.url;
    
    if (pathname === '/ws/metrics') {
        metricsWss.handleUpgrade(request, socket, head, (ws) => {
            metricsWss.emit('connection', ws, request);
        });
    } else {
        socket.destroy();
    }
});

server.listen(port, () => {
    console.log(`Product service is running at http://localhost:${port}/api`);
    console.log(`WebSocket metrics available at ws://localhost:${port}/ws/metrics`);
    console.log(`Active modules: Product, Event, Discount, Category, Shop, Image, Metrics`);
});
server.on("error", (err) => {
console.error("Server erros:",err);
});
