/**
 * Recommendation Service - AI Chatbox Backend
 */

import express from 'express';
import * as path from 'path';
import chatRoutes from './routes/chat.routes';

const app = express();

// Middleware
app.use(express.json());
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Routes
app.get('/api', (req, res) => {
  res.send({ message: 'Welcome to recommendation-service!' });
});

app.use('/api/chat', chatRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'recommendation-service' });
});

const port = process.env.PORT || 6007;
const server = app.listen(port, () => {
  console.log(`Recommendation service listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
