import { Request, Response } from 'express';
import { HttpException, HttpStatus } from '../exceptions/http.exceptions';
import { Logger } from '../utils/logger';

export interface HostContext {
  switchToHttp(): {
    getResponse<T = Response>(): T;
    getRequest<T = Request>(): T;
  };
}

export class AllExceptionsFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: HostContext): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorDetails: unknown = null;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

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
    } else if (this.isPrismaError(exception)) {
      const prismaParsed = this.handlePrismaError(exception);
      statusCode = prismaParsed.statusCode;
      message = prismaParsed.message;
      errorDetails = prismaParsed.error;
    } else if (
      exception instanceof Error &&
      (exception.name === 'PrismaClientInitializationError' ||
        exception.name === 'PrismaClientKnownRequestError' ||
        exception.name === 'PrismaClientUnknownRequestError' ||
        exception.name === 'PrismaClientRustPanicError' ||
        exception.name === 'PrismaClientValidationError')
    ) {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      errorDetails = null;
    }

    const correlationId = request?.correlationId;
    const reqUrl = (request?.originalUrl || request?.url || '').split('?')[0];

    if (statusCode >= 500) {
      this.logger.error(
        `[${correlationId || 'N/A'}] Unhandled Exception: ${
          exception instanceof Error ? exception.message : message
        }`,
        exception instanceof Error ? exception.stack : JSON.stringify(exception),
      );
    } else {
      this.logger.warn(`[${correlationId || 'N/A'}] Handled Exception (${statusCode}): ${message}`);
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      ...(errorDetails ? { error: errorDetails } : {}),
      timestamp: new Date().toISOString(),
      path: reqUrl,
      ...(correlationId ? { correlationId } : {}),
    });
  }

  private isPrismaError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof (error as { code: unknown }).code === 'string' &&
      (error as { code: string }).code.startsWith('P')
    );
  }

  private handlePrismaError(error: unknown): {
    statusCode: number;
    message: string;
    error: string;
  } {
    const prismaError = error as {
      code: string;
      meta?: Record<string, unknown>;
      message: string;
    };

    switch (prismaError.code) {
      case 'P2002': {
        const target = (prismaError.meta?.target as string[])?.join(', ') || 'field';
        return {
          statusCode: HttpStatus.CONFLICT,
          message: `A record with this ${target} already exists`,
          error: 'Unique constraint violation',
        };
      }
      case 'P2025': {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'The requested record was not found',
          error: 'Record not found',
        };
      }
      case 'P2003': {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Foreign key constraint failed on the related record',
          error: 'Invalid reference',
        };
      }
      case 'P2034': {
        return {
          statusCode: HttpStatus.CONFLICT,
          message: 'The record changed concurrently; retry the request',
          error: 'Transaction conflict',
        };
      }
      case 'P1001':
      case 'P1002':
      case 'P2024': {
        return {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message: 'Database is temporarily unavailable',
          error: 'Database unavailable',
        };
      }
      default: {
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Database query execution failed',
          error: 'Database error',
        };
      }
    }
  }
}
