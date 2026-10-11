import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { CORRELATION_ID_HEADER } from '../constants';

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const supplied = req.headers[CORRELATION_ID_HEADER];
    const candidate = Array.isArray(supplied) ? supplied[0] : supplied;
    const correlationId =
      candidate && /^[A-Za-z0-9._-]{1,64}$/.test(candidate) ? candidate : randomUUID();

    req.correlationId = correlationId;
    res.setHeader(CORRELATION_ID_HEADER, correlationId);

    next();
  }
}
