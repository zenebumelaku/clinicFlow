import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { catchError, from, mergeMap, throwError } from 'rxjs';
import { HttpException } from '../common/exceptions/http.exceptions';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { AuditRecord, AuditService } from './audit.service';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export interface ExecutionContext {
  getType(): string;
  switchToHttp(): {
    getRequest<T = Request>(): T;
    getResponse<T = Response>(): T;
  };
}

export interface CallHandler<T = unknown> {
  handle(): Observable<T>;
}

export class AuditInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    if (!MUTATING_METHODS.has(request.method)) {
      return next.handle();
    }

    const path = request.originalUrl || request.url || '';
    if (path.includes('/health') || this.routeWithoutQuery(path).includes('/auth/')) {
      return next.handle();
    }

    return next.handle().pipe(
      mergeMap(async (result) => {
        await this.auditService.record(
          this.createRecord(request, path, 'success', response.statusCode, result),
        );
        return result;
      }),
      catchError((error: unknown) =>
        from(
          this.auditService.record(
            this.createRecord(
              request,
              path,
              'failure',
              error instanceof HttpException ? error.getStatus() : 500,
            ),
          ),
        ).pipe(mergeMap(() => throwError(() => error))),
      ),
    );
  }

  createRecord(
    request: Request,
    path: string,
    outcome: 'success' | 'failure',
    statusCode: number,
    result?: unknown,
  ): AuditRecord {
    const user = request.user as AuthenticatedUser | undefined;
    const clinicId =
      (request.params?.clinicId as string | undefined) ||
      (request.query?.clinicId as string | undefined) ||
      (request.body?.clinicId as string | undefined);
    return {
      userId: user?.id,
      clinicId,
      action: `${request.method} ${this.routeWithoutQuery(path)}`,
      entity: this.entityFromPath(path),
      entityId: this.entityIdFromRequest(request, result),
      details: JSON.stringify({ status: outcome, statusCode, role: user?.role }),
      ipAddress: request.ip,
      userAgent: request.get('user-agent') || null,
      correlationId: request.correlationId || null,
    };
  }

  routeWithoutQuery(path: string): string {
    return path.split('?')[0];
  }

  entityFromPath(path: string): string {
    const segments = this.routeWithoutQuery(path)
      .split('/')
      .filter((segment) => segment && segment !== 'api' && segment !== 'v1');
    return segments[0] || 'unknown';
  }

  entityIdFromRequest(request: Request, result?: unknown): string | null {
    const params = request.params || {};
    const paramId =
      params.appointmentId ||
      params.ticketId ||
      params.patientId ||
      params.staffId ||
      params.doctorId ||
      params.branchId ||
      params.clinicId ||
      params.notificationId;
    if (paramId) return paramId;
    if (typeof result === 'object' && result !== null && 'id' in result) {
      return String((result as { id: unknown }).id);
    }
    return null;
  }
}
