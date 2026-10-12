import { Logger } from '../common/utils/logger';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditRecord {
  userId?: string | null;
  clinicId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  correlationId?: string | null;
}

export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditRecord): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: entry.userId || null,
          clinicId: entry.clinicId || null,
          action: entry.action,
          entity: entry.entity,
          entityId: entry.entityId || null,
          details: entry.details || null,
          ipAddress: entry.ipAddress || null,
          userAgent: entry.userAgent || null,
          correlationId: entry.correlationId || null,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to persist audit log for ${entry.action} ${entry.entity} (${error instanceof Error ? error.name : 'unknown error'})`,
      );
    }
  }
}
