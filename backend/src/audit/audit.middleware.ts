import { Request, Response, NextFunction } from 'express';
import { AuditRecord, AuditService } from './audit.service';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function routeWithoutQuery(path: string): string {
  return path.split('?')[0];
}

function entityFromPath(path: string): string {
  const segments = routeWithoutQuery(path)
    .split('/')
    .filter((segment) => segment && segment !== 'api' && segment !== 'v1');
  return segments[0] || 'unknown';
}

function entityIdFromRequest(request: Request, result?: unknown): string | null {
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

export function createAuditMiddleware(auditService: AuditService) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!MUTATING_METHODS.has(req.method)) {
      return next();
    }

    const path = req.originalUrl || req.url || '';
    if (path.includes('/health') || routeWithoutQuery(path).includes('/auth/')) {
      return next();
    }

    let responseBody: unknown;
    const originalJson = res.json.bind(res);
    res.json = function (body: unknown): Response {
      responseBody = body;
      return originalJson(body);
    };

    res.on('finish', () => {
      const statusCode = res.statusCode;
      const outcome = statusCode >= 400 ? 'failure' : 'success';
      const user = req.user as AuthenticatedUser | undefined;
      const clinicId =
        (req.params?.clinicId as string | undefined) ||
        (req.query?.clinicId as string | undefined) ||
        (req.body?.clinicId as string | undefined);

      const record: AuditRecord = {
        userId: user?.id,
        clinicId,
        action: `${req.method} ${routeWithoutQuery(path)}`,
        entity: entityFromPath(path),
        entityId: entityIdFromRequest(req, responseBody),
        details: JSON.stringify({ status: outcome, statusCode, role: user?.role }),
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || null,
        correlationId: req.correlationId || null,
      };

      auditService.record(record).catch(() => {});
    });

    next();
  };
}
