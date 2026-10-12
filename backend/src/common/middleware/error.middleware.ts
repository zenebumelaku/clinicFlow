import { Request, Response, NextFunction } from 'express';
import { AllExceptionsFilter } from '../filters/all-exceptions.filter';

const filter = new AllExceptionsFilter();

export function errorMiddleware(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  filter.catch(err, {
    switchToHttp: () => ({
      getResponse: <T = Response>() => res as unknown as T,
      getRequest: <T = Request>() => req as unknown as T,
    }),
  });
}
