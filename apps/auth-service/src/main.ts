import swaggerUi from "swagger-ui-express";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorMiddleware } from "@packages/error-handler/error-middleware";
import router from "./routes/auth.router";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import helmet from "helmet";
const swaggerDocument = require("./swagger-output.json");
const app = express();

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(xss()); // Prevent XSS
// Configure CORS with development and production support
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

// Allow localhost origins in development
const isDevelopment = process.env.NODE_ENV !== 'production';
const developmentOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list or development origins
    if (allowedOrigins.includes(origin) || (isDevelopment && developmentOrigins.includes(origin))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  allowedHeaders: ['Authorization', 'Content-Type'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());
app.get("/", (req, res) => {
  res.send({ message: "Auth Service is running" });
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/docs-json", (req, res) => {
  res.json(swaggerDocument);
});
//Routers
app.use("/api", router);

app.use(errorMiddleware);

const port = process.env.PORT || 6001;
const server = app.listen(port, () => {
  console.log(`Auth service is running at http://localhost:${port}/api`);
  console.log(`Swagger docs available at http://localhost:${port}/docs`);
});
server.on("error", (err) => {
  console.error("Server errors:", err);
});
