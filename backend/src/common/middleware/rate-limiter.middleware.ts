import { Request, Response, NextFunction } from 'express';
import { HttpException, HttpStatus } from '../exceptions/http.exceptions';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export function createRateLimiter(options: { limit: number; ttl: number }) {
  const store = new Map<string, RateLimitRecord>();

  return (req: Request, _res: Response, next: NextFunction): void => {
    // Skip health checks
    if (req.path.includes('/health')) {
      return next();
    }

    const key = `${req.ip || '127.0.0.1'}_${req.baseUrl}${req.path}`;
    const now = Date.now();
    const record = store.get(key);

    if (!record || now > record.resetAt) {
      store.set(key, { count: 1, resetAt: now + options.ttl });
      return next();
    }

    record.count += 1;
    if (record.count > options.limit) {
      throw new HttpException(
        'ThrottlerException: Too Many Requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    next();
  };
}
