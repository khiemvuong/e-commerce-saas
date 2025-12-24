
import express from 'express';

const app = express();


app.get('/api', (req, res) => {
  res.send({ message: 'Welcome to logger-service!' });
});

const port = process.env.PORT || 6008;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
