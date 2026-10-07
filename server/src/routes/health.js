  import { Router } from 'express';
  import { isDbConnected } from '../config/db.js';

  const router = Router();

  router.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'ai-travel-planner-api',
      database: isDbConnected() ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    });
  });

  export default router;