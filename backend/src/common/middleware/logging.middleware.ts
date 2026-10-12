import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';

const logger = new Logger('HTTP');

export function loggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const safePath = (req.originalUrl || req.url).split('?')[0];
  const userAgent = req.get('user-agent') || 'Unknown';
  const correlationId = req.correlationId || 'N/A';

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const line = `[${correlationId}] ${req.method} ${safePath} ${statusCode} +${duration}ms - IP: ${req.ip} Agent: ${userAgent}`;

    if (statusCode >= 500) {
      logger.error(line);
    } else if (statusCode >= 400) {
      logger.warn(line);
    } else {
      logger.log(line);
    }
  });

  next();
}
