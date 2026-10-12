import { Router } from 'express';

export function createHealthRouter(): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'mediflow-et-backend',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
