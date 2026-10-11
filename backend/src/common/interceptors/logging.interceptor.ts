import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const { method, ip } = request;
    const safePath = (request.originalUrl || request.url).split('?')[0];
    const userAgent = request.get('user-agent') || 'Unknown';
    const correlationId = request.correlationId || 'N/A';
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const { statusCode } = response;
          this.logger.log(
            `[${correlationId}] ${method} ${safePath} ${statusCode} +${duration}ms - IP: ${ip} Agent: ${userAgent}`,
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const status = error?.status || 500;
          const errorType = error instanceof Error ? error.name : 'UnknownError';
          const line = `[${correlationId}] ${method} ${safePath} ${status} +${duration}ms - Error: ${errorType}`;
          if (status >= 500) {
            this.logger.error(line, error.stack);
          } else {
            this.logger.warn(line);
          }
        },
      }),
    );
  }
}
