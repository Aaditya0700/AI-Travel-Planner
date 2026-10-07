import express from 'express';
import cors from 'cors';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import tripsRouter from './routes/trips.js';
import expensesRouter from './routes/expenses.js';
import itinerariesRouter from './routes/itineraries.js';
import chatRouter from './routes/chat.js';
import budgetPlannerRouter from './routes/budgetPlanner.js';
import photosRouter from './routes/photos.js';
import visionRouter from './routes/vision.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

app.use('/', healthRouter);
app.use('/api/v1', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/trips', tripsRouter);
app.use('/api/v1/expenses', expensesRouter);
app.use('/api/v1/itineraries', itinerariesRouter);
app.use('/api/v1/chat', chatRouter);
app.use('/api/v1/budget-planner', budgetPlannerRouter);
app.use('/api/v1/photos', photosRouter);
app.use('/api/v1/vision', visionRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
});

app.use((error, req, res, _next) => {
  console.error('[error]', error.message || error);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;