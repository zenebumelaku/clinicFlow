import { after, before, describe, it } from 'node:test';
import * as assert from 'node:assert';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { Role } from '@prisma/client';
import configuration from '../src/common/config/configuration';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthModule } from '../src/auth/auth.module';
import { ClinicsModule } from '../src/clinics/clinics.module';
import { ReportsModule } from '../src/reports/reports.module';
import { CommonModule } from '../src/common/common.module';
import { TokenService } from '../src/auth/token.service';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { MockPrismaService } from './mock-prisma.service';

describe('MediFlow ET Part 7: Reporting and Analytics', () => {
  let app: INestApplication;
  let baseUrl: string;
  let mockPrisma: MockPrismaService;
  let adminAToken: string;
  let adminBToken: string;
  let clinicAId: string;
  let clinicBId: string;

  before(async () => {
    mockPrisma = new MockPrismaService();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
          ignoreEnvFile: true,
        }),
        CommonModule,
        AuthModule,
        ClinicsModule,
        ReportsModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();
    await app.listen(0);

    const address = app.getHttpServer().address();
    const port = typeof address === 'string' ? 3000 : address.port;
    baseUrl = `http://localhost:${port}/api/v1`;
    const tokenService = app.get<TokenService>(TokenService);
    const adminA = await mockPrisma.user.create({
      data: { phone: '+251999000001', role: Role.ADMIN, firstName: 'Admin', lastName: 'A' },
    });
    const adminB = await mockPrisma.user.create({
      data: { phone: '+251999000002', role: Role.ADMIN, firstName: 'Admin', lastName: 'B' },
    });
    adminAToken = (await tokenService.generateTokens(adminA)).accessToken;
    adminBToken = (await tokenService.generateTokens(adminB)).accessToken;

    const clinicA = await authJson('/clinics', adminAToken, {
      method: 'POST',
      body: JSON.stringify({ name: 'Reports Clinic A', phone: '+251111009001' }),
    });
    clinicAId = (clinicA.json.data as Record<string, unknown>).id as string;
    const clinicB = await authJson('/clinics', adminBToken, {
      method: 'POST',
      body: JSON.stringify({ name: 'Reports Clinic B', phone: '+251111009002' }),
    });
    clinicBId = (clinicB.json.data as Record<string, unknown>).id as string;
  });

  after(async () => {
    await app.close();
  });

  async function authJson(
    path: string,
    token: string,
    init: RequestInit = {},
  ): Promise<{ status: number; json: Record<string, unknown> }> {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(init.headers || {}),
      },
    });
    return { status: response.status, json: (await response.json()) as Record<string, unknown> };
  }

  describe('Dashboard calculations', () => {
    it('aggregates clinic metrics and calculates no-show percentage', async () => {
      const queryCountBefore = mockPrisma.rawQueryCalls.length;
      mockPrisma.rawQueryResults.push([
        {
          appointments: 12,
          patientsWaiting: 3,
          completedVisits: 7,
          revenue: 8250.5,
          averageWaitingTimeMinutes: 14.25,
          averageConsultationTimeMinutes: 22.5,
          noShows: 2,
          eligibleAppointments: 10,
        },
      ]);
      const { status, json } = await authJson(
        `/reports/dashboard?clinicId=${clinicAId}&range=custom&startDate=2026-10-01&endDate=2026-10-03`,
        adminAToken,
      );
      assert.strictEqual(status, 200);
      const result = json.data as Record<string, unknown>;
      assert.strictEqual(result.appointments, 12);
      assert.strictEqual(result.patientsWaiting, 3);
      assert.strictEqual(result.completedVisits, 7);
      assert.strictEqual(result.revenue, 8250.5);
      assert.strictEqual(result.averageWaitingTimeMinutes, 14.25);
      assert.strictEqual(result.averageConsultationTimeMinutes, 22.5);
      assert.strictEqual(result.noShowRate, 20);
      assert.strictEqual(mockPrisma.rawQueryCalls.length, queryCountBefore + 1);
      assert.deepStrictEqual(result.period, {
        range: 'custom',
        startDate: '2026-10-01',
        endDate: '2026-10-03',
      });

      const sqlCall = mockPrisma.rawQueryCalls.at(-1)!;
      assert.ok(sqlCall.sql.includes('FROM "appointments"'));
      assert.ok(sqlCall.sql.includes('FROM "queue_tickets"'));
      assert.ok(sqlCall.values.includes(clinicAId));
      assert.ok(sqlCall.values.some((value) => value instanceof Date));
    });

    it('returns a zero no-show rate when there are no eligible appointments', async () => {
      mockPrisma.rawQueryResults.push([
        {
          appointments: 0,
          patientsWaiting: 0,
          completedVisits: 0,
          revenue: 0,
          averageWaitingTimeMinutes: null,
          averageConsultationTimeMinutes: null,
          noShows: 0,
          eligibleAppointments: 0,
        },
      ]);
      const { status, json } = await authJson(
        `/reports/dashboard?clinicId=${clinicAId}`,
        adminAToken,
      );
      assert.strictEqual(status, 200);
      assert.strictEqual((json.data as Record<string, unknown>).noShowRate, 0);
    });
  });

  describe('Chart reports and date ranges', () => {
    it('returns Recharts-ready daily revenue, appointment, and waiting series', async () => {
      mockPrisma.rawQueryResults.push(
        [
          { date: '2026-10-01', revenue: 100, payments: 2 },
          { date: '2026-10-02', revenue: 0, payments: 0 },
        ],
        [
          { date: '2026-10-01', appointments: 4, completedVisits: 2, cancellations: 1, noShows: 1 },
          { date: '2026-10-02', appointments: 0, completedVisits: 0, cancellations: 0, noShows: 0 },
        ],
        [
          {
            date: '2026-10-01',
            patients: 2,
            averageWaitingTimeMinutes: 12.5,
            averageConsultationTimeMinutes: 20,
          },
          {
            date: '2026-10-02',
            patients: 0,
            averageWaitingTimeMinutes: null,
            averageConsultationTimeMinutes: null,
          },
        ],
      );

      const revenue = await authJson(
        `/reports/revenue?clinicId=${clinicAId}&range=custom&startDate=2026-10-01&endDate=2026-10-02`,
        adminAToken,
      );
      const appointments = await authJson(
        `/reports/appointments?clinicId=${clinicAId}&range=custom&startDate=2026-10-01&endDate=2026-10-02`,
        adminAToken,
      );
      const waiting = await authJson(
        `/reports/waiting-time?clinicId=${clinicAId}&range=custom&startDate=2026-10-01&endDate=2026-10-02`,
        adminAToken,
      );

      const revenueRows = (revenue.json.data as { data: Array<Record<string, unknown>> }).data;
      assert.strictEqual(revenue.status, 200);
      assert.strictEqual(revenueRows[0].revenue, 100);
      assert.strictEqual(revenueRows[1].revenue, 0);

      const appointmentRows = (appointments.json.data as { data: Array<Record<string, unknown>> })
        .data;
      assert.strictEqual(appointments.status, 200);
      assert.strictEqual(appointmentRows[0].noShows, 1);
      assert.strictEqual(appointmentRows[1].appointments, 0);

      const waitingRows = (waiting.json.data as { data: Array<Record<string, unknown>> }).data;
      assert.strictEqual(waiting.status, 200);
      assert.strictEqual(waitingRows[0].averageWaitingTimeMinutes, 12.5);
      assert.strictEqual(waitingRows[1].averageConsultationTimeMinutes, null);
    });

    it('supports today, 7-day, 30-day, and custom ranges and rejects invalid custom dates', async () => {
      mockPrisma.rawQueryResults.push([], [], []);
      const today = await authJson(`/reports/revenue?clinicId=${clinicAId}`, adminAToken);
      const sevenDays = await authJson(
        `/reports/revenue?clinicId=${clinicAId}&range=7d`,
        adminAToken,
      );
      const thirtyDays = await authJson(
        `/reports/revenue?clinicId=${clinicAId}&range=30d`,
        adminAToken,
      );
      const periods = [today, sevenDays, thirtyDays].map(
        (response) =>
          (response.json.data as { period: { range: string; startDate: string; endDate: string } })
            .period,
      );
      assert.deepStrictEqual(
        periods.map((period) => period.range),
        ['today', '7d', '30d'],
      );
      assert.strictEqual(periods[0].startDate, periods[0].endDate);
      assert.strictEqual(periods[1].startDate, thisDateOffset(periods[1].endDate, -6));
      assert.strictEqual(periods[2].startDate, thisDateOffset(periods[2].endDate, -29));

      const invalid = await authJson(
        `/reports/appointments?clinicId=${clinicAId}&range=custom&startDate=2026-10-04&endDate=2026-10-03`,
        adminAToken,
      );
      assert.strictEqual(invalid.status, 400);
    });

    it('prevents a user without clinic access from reading another clinic reports', async () => {
      const { status } = await authJson(`/reports/dashboard?clinicId=${clinicBId}`, adminAToken);
      assert.strictEqual(status, 403);
    });
  });
});

function thisDateOffset(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
