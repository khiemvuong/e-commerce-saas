

import express from 'express';
import cors from 'cors';
import proxy from 'express-http-proxy';
import morgan from 'morgan';
import {rateLimit,ipKeyGenerator} from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import initializeSiteConfig from './libs/initializeSiteConfig';
const app = express();

app.use(cors({
  origin: ['http://localhost:3000'], 
  allowedHeaders: [ 'Authorization','Content-Type'],
  credentials: true,
})
);
app.use(morgan('dev'));
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb",extended: true }));
app.use(cookieParser());
app.set ('trust proxy', 1);

//Aplly rate limiting to all requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req:any)=>(req.user ? 1000 :100) , 
  message: {error:"Too many requests from this IP, please try again later"},
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req: any) => {
    if (req.query.apiKey) {
      return req.query.apiKey; // ưu tiên giới hạn theo API key
    }
    return ipKeyGenerator(req); // fallback về IP
  },
});
app.use(limiter);

app.get('/gateway-health', (req, res) => {
  res.send({ message: 'Welcome to api-gateway!' });
});
app.use('/order' , proxy("http://localhost:6004"));
app.use('/product' , proxy("http://localhost:6002"));

app.use('/' , proxy("http://localhost:6001"));

const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
  try {
    initializeSiteConfig();
    console.log('Site configuration initialized successfully.');
  } catch (error) {
    console.error('Error initializing site configuration:', error);
  }
});
server.on('error', console.error);
