import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface StandardResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
  meta?: unknown;
  timestamp: string;
  correlationId?: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, StandardResponse<T> | unknown> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardResponse<T> | unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((result) => {
        // If response is a buffer, stream, or already enveloped, return as is
        if (result === undefined || result === null) {
          return {
            success: true,
            statusCode: response.statusCode,
            data: null,
            timestamp: new Date().toISOString(),
            correlationId: request.correlationId,
          };
        }

        // Handle paginated responses
        if (typeof result === 'object' && 'data' in result && 'meta' in result) {
          return {
            success: true,
            statusCode: response.statusCode,
            data: result.data,
            meta: result.meta,
            timestamp: new Date().toISOString(),
            correlationId: request.correlationId,
          };
        }

        return {
          success: true,
          statusCode: response.statusCode,
          data: result,
          timestamp: new Date().toISOString(),
          correlationId: request.correlationId,
        };
      }),
    );
  }
}
