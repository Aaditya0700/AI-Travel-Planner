import express from 'express';
import cors from 'cors';
import healthRouter from './routes/health.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', healthRouter);
app.use('/api/v1', healthRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
});

app.use((error, req, res, next) => {
  console.error('[error]', error);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;