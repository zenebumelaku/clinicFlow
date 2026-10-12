import { BadRequestException } from '../common/exceptions/http.exceptions';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ReportQueryDto, ReportRange } from './dto/report-query.dto';

const CLINIC_TIME_ZONE = 'Africa/Addis_Ababa';

interface ResolvedRange {
  range: ReportRange;
  startDate: string;
  endDate: string;
  start: Date;
  endExclusive: Date;
}

interface DashboardAggregate {
  appointments: number;
  patientsWaiting: number;
  completedVisits: number;
  revenue: number | null;
  averageWaitingTimeMinutes: number | null;
  averageConsultationTimeMinutes: number | null;
  noShows: number;
  eligibleAppointments: number;
}

export interface RevenuePoint {
  date: string;
  revenue: number;
  payments: number;
}

export interface AppointmentPoint {
  date: string;
  appointments: number;
  completedVisits: number;
  cancellations: number;
  noShows: number;
}

export interface WaitingTimePoint {
  date: string;
  patients: number;
  averageWaitingTimeMinutes: number | null;
  averageConsultationTimeMinutes: number | null;
}

export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(query: ReportQueryDto) {
    const period = this.resolveRange(query);
    const [aggregate] = await this.prisma.$queryRaw<DashboardAggregate[]>(Prisma.sql`
      WITH appointment_metrics AS (
        SELECT COUNT(*)::int AS appointments,
               COUNT(*) FILTER (WHERE "status" = 'COMPLETED')::int AS "completedVisits",
               COUNT(*) FILTER (WHERE "status" = 'NO_SHOW')::int AS "noShows",
               COUNT(*) FILTER (WHERE "status" <> 'CANCELLED')::int AS "eligibleAppointments"
        FROM "appointments"
        WHERE "clinicId" = ${query.clinicId}
          AND "startsAt" >= ${period.start}
          AND "startsAt" < ${period.endExclusive}
      ), queue_metrics AS (
        SELECT COUNT(*) FILTER (WHERE "status" IN ('WAITING', 'CALLED'))::int AS "patientsWaiting",
               AVG(EXTRACT(EPOCH FROM ("consultationStartedAt" - "checkedInAt")) / 60.0)
                 FILTER (WHERE "consultationStartedAt" IS NOT NULL)::float8 AS "averageWaitingTimeMinutes",
               AVG(EXTRACT(EPOCH FROM ("completedAt" - "consultationStartedAt")) / 60.0)
                 FILTER (WHERE "status" = 'COMPLETED' AND "completedAt" IS NOT NULL
                   AND "consultationStartedAt" IS NOT NULL)::float8 AS "averageConsultationTimeMinutes"
        FROM "queue_tickets"
        WHERE "clinicId" = ${query.clinicId}
          AND "queueDate" >= ${period.startDate}::date
          AND "queueDate" <= ${period.endDate}::date
      ), payment_metrics AS (
        SELECT COALESCE(SUM("amount"), 0)::float8 AS revenue
        FROM "payments"
        WHERE "clinicId" = ${query.clinicId}
          AND "createdAt" >= ${period.start}
          AND "createdAt" < ${period.endExclusive}
          AND "status" = 'COMPLETED'
      )
      SELECT appointment_metrics.appointments,
             queue_metrics."patientsWaiting",
             appointment_metrics."completedVisits",
             payment_metrics.revenue,
             queue_metrics."averageWaitingTimeMinutes",
             queue_metrics."averageConsultationTimeMinutes",
             appointment_metrics."noShows",
             appointment_metrics."eligibleAppointments"
      FROM appointment_metrics
      CROSS JOIN queue_metrics
      CROSS JOIN payment_metrics
    `);

    const noShowRate = aggregate.eligibleAppointments
      ? (aggregate.noShows / aggregate.eligibleAppointments) * 100
      : 0;
    return {
      period: this.periodResponse(period),
      appointments: aggregate.appointments,
      patientsWaiting: aggregate.patientsWaiting,
      completedVisits: aggregate.completedVisits,
      revenue: Number(aggregate.revenue || 0),
      averageWaitingTimeMinutes: aggregate.averageWaitingTimeMinutes,
      averageConsultationTimeMinutes: aggregate.averageConsultationTimeMinutes,
      noShowRate: Number(noShowRate.toFixed(2)),
    };
  }

  async revenue(query: ReportQueryDto) {
    const period = this.resolveRange(query);
    const data = await this.prisma.$queryRaw<RevenuePoint[]>(Prisma.sql`
      WITH days AS (
        SELECT generate_series(${period.startDate}::date, ${period.endDate}::date, interval '1 day')::date AS day
      ), daily AS (
        SELECT ("createdAt" AT TIME ZONE ${CLINIC_TIME_ZONE})::date AS day,
               SUM("amount")::float8 AS revenue,
               COUNT(*)::int AS payments
        FROM "payments"
        WHERE "clinicId" = ${query.clinicId}
          AND "createdAt" >= ${period.start}
          AND "createdAt" < ${period.endExclusive}
          AND "status" = 'COMPLETED'
        GROUP BY 1
      )
      SELECT TO_CHAR(days.day, 'YYYY-MM-DD') AS date,
             COALESCE(daily.revenue, 0)::float8 AS revenue,
             COALESCE(daily.payments, 0)::int AS payments
      FROM days LEFT JOIN daily USING (day)
      ORDER BY days.day
    `);
    return { period: this.periodResponse(period), data };
  }

  async appointments(query: ReportQueryDto) {
    const period = this.resolveRange(query);
    const data = await this.prisma.$queryRaw<AppointmentPoint[]>(Prisma.sql`
      WITH days AS (
        SELECT generate_series(${period.startDate}::date, ${period.endDate}::date, interval '1 day')::date AS day
      ), daily AS (
        SELECT ("startsAt" AT TIME ZONE ${CLINIC_TIME_ZONE})::date AS day,
               COUNT(*)::int AS appointments,
               COUNT(*) FILTER (WHERE "status" = 'COMPLETED')::int AS "completedVisits",
               COUNT(*) FILTER (WHERE "status" = 'CANCELLED')::int AS cancellations,
               COUNT(*) FILTER (WHERE "status" = 'NO_SHOW')::int AS "noShows"
        FROM "appointments"
        WHERE "clinicId" = ${query.clinicId}
          AND "startsAt" >= ${period.start}
          AND "startsAt" < ${period.endExclusive}
        GROUP BY 1
      )
      SELECT TO_CHAR(days.day, 'YYYY-MM-DD') AS date,
             COALESCE(daily.appointments, 0)::int AS appointments,
             COALESCE(daily."completedVisits", 0)::int AS "completedVisits",
             COALESCE(daily.cancellations, 0)::int AS cancellations,
             COALESCE(daily."noShows", 0)::int AS "noShows"
      FROM days LEFT JOIN daily USING (day)
      ORDER BY days.day
    `);
    return { period: this.periodResponse(period), data };
  }

  async waitingTime(query: ReportQueryDto) {
    const period = this.resolveRange(query);
    const data = await this.prisma.$queryRaw<WaitingTimePoint[]>(Prisma.sql`
      WITH days AS (
        SELECT generate_series(${period.startDate}::date, ${period.endDate}::date, interval '1 day')::date AS day
      ), daily AS (
        SELECT "queueDate" AS day,
               COUNT(*) FILTER (WHERE "consultationStartedAt" IS NOT NULL)::int AS patients,
               AVG(EXTRACT(EPOCH FROM ("consultationStartedAt" - "checkedInAt")) / 60.0)
                 FILTER (WHERE "consultationStartedAt" IS NOT NULL)::float8 AS "averageWaitingTimeMinutes",
               AVG(EXTRACT(EPOCH FROM ("completedAt" - "consultationStartedAt")) / 60.0)
                 FILTER (WHERE "status" = 'COMPLETED' AND "completedAt" IS NOT NULL
                   AND "consultationStartedAt" IS NOT NULL)::float8 AS "averageConsultationTimeMinutes"
        FROM "queue_tickets"
        WHERE "clinicId" = ${query.clinicId}
          AND "queueDate" >= ${period.startDate}::date
          AND "queueDate" <= ${period.endDate}::date
        GROUP BY 1
      )
      SELECT TO_CHAR(days.day, 'YYYY-MM-DD') AS date,
             COALESCE(daily.patients, 0)::int AS patients,
             daily."averageWaitingTimeMinutes",
             daily."averageConsultationTimeMinutes"
      FROM days LEFT JOIN daily USING (day)
      ORDER BY days.day
    `);
    return { period: this.periodResponse(period), data };
  }

  private resolveRange(query: ReportQueryDto): ResolvedRange {
    const today = this.localDate(new Date());
    let startDate: string;
    let endDate: string;
    switch (query.range) {
      case ReportRange.LAST_7_DAYS:
        startDate = this.addDays(today, -6);
        endDate = today;
        break;
      case ReportRange.LAST_30_DAYS:
        startDate = this.addDays(today, -29);
        endDate = today;
        break;
      case ReportRange.CUSTOM:
        if (!query.startDate || !query.endDate) {
          throw new BadRequestException('Custom reports require startDate and endDate');
        }
        startDate = this.validateDate(query.startDate);
        endDate = this.validateDate(query.endDate);
        if (startDate > endDate) {
          throw new BadRequestException('startDate must not be after endDate');
        }
        break;
      default:
        startDate = today;
        endDate = today;
    }
    return {
      range: query.range,
      startDate,
      endDate,
      start: this.localDayStart(startDate),
      endExclusive: this.localDayStart(this.addDays(endDate, 1)),
    };
  }

  private periodResponse(period: ResolvedRange) {
    return { range: period.range, startDate: period.startDate, endDate: period.endDate };
  }

  private localDate(value: Date): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: CLINIC_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(value);
    const part = (type: string) => parts.find((entry) => entry.type === type)?.value;
    return `${part('year')}-${part('month')}-${part('day')}`;
  }

  private localDayStart(date: string): Date {
    return new Date(`${date}T00:00:00+03:00`);
  }

  private addDays(date: string, amount: number): string {
    const value = new Date(`${date}T00:00:00.000Z`);
    value.setUTCDate(value.getUTCDate() + amount);
    return value.toISOString().slice(0, 10);
  }

  private validateDate(date: string): string {
    const parsed = new Date(`${date}T00:00:00.000Z`);
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
      throw new BadRequestException('Report dates must be valid YYYY-MM-DD dates');
    }
    return date;
  }
}
