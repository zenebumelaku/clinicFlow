import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const statusCode = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message = exception.message;
    let errorDetails: unknown = null;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const resObj = exceptionResponse as Record<string, unknown>;
      message = (resObj.message as string) || exception.message;
      errorDetails = resObj.error || null;

      if (Array.isArray(resObj.message)) {
        message = 'Validation failed';
        errorDetails = resObj.message;
      }
    }

    const correlationId = request.correlationId;

    this.logger.warn(`[${correlationId || 'N/A'}] HTTP Exception (${statusCode}): ${message}`);

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      ...(errorDetails ? { error: errorDetails } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(correlationId ? { correlationId } : {}),
    });
  }
}
