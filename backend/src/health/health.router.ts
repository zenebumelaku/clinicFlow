import { Prisma } from '@prisma/client';
import { Router } from 'express';
import { ServiceUnavailableException } from '../common/exceptions/http.exceptions';
import { Logger } from '../common/utils/logger';
import { PrismaService } from '../prisma/prisma.service';

export function createHealthRouter(prisma: PrismaService): Router {
  const router = Router();
  const logger = new Logger('Health');

  router.get('/health', async (_req, res, next) => {
    try {
      await prisma.$queryRaw(Prisma.sql`SELECT 1`);
      res.json({
        status: 'ok',
        service: 'ClinicFlow-et-backend',
        database: 'connected',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Database health check failed', error instanceof Error ? error.message : error);
      next(new ServiceUnavailableException('Database unavailable'));
    }
  });

  return router;
}
