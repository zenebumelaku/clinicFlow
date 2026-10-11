import { after, before, describe, it } from 'node:test';
import * as assert from 'node:assert';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { AppointmentStatus, Role } from '@prisma/client';
import configuration from '../src/common/config/configuration';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthModule } from '../src/auth/auth.module';
import { ClinicsModule } from '../src/clinics/clinics.module';
import { PatientsModule } from '../src/patients/patients.module';
import { AppointmentsModule } from '../src/appointments/appointments.module';
import { CommonModule } from '../src/common/common.module';
import { TokenService } from '../src/auth/token.service';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { MockPrismaService } from './mock-prisma.service';

describe('MediFlow ET Part 4: Patients and Appointments', () => {
  let app: INestApplication;
  let baseUrl: string;
  let mockPrisma: MockPrismaService;
  let adminAToken: string;
  let adminBToken: string;
  let clinicAId: string;
  let clinicBId: string;
  let doctorAId: string;
  let doctorBId: string;
  let patientAId: string;
  let patientBId: string;

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
        PatientsModule,
        AppointmentsModule,
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
      data: { phone: '+251966000001', role: Role.ADMIN, firstName: 'Admin', lastName: 'A' },
    });
    const adminB = await mockPrisma.user.create({
      data: { phone: '+251966000002', role: Role.ADMIN, firstName: 'Admin', lastName: 'B' },
    });
    const doctorUserA = await mockPrisma.user.create({
      data: { phone: '+251966000003', role: Role.DOCTOR, firstName: 'Doctor', lastName: 'A' },
    });
    const doctorUserB = await mockPrisma.user.create({
      data: { phone: '+251966000006', role: Role.DOCTOR, firstName: 'Doctor', lastName: 'B' },
    });
    const patientUserA = await mockPrisma.user.create({
      data: { phone: '+251966000004', role: Role.PATIENT, firstName: 'Patient', lastName: 'A' },
    });
    const patientUserB = await mockPrisma.user.create({
      data: { phone: '+251966000005', role: Role.PATIENT, firstName: 'Patient', lastName: 'B' },
    });
    adminAToken = (await tokenService.generateTokens(adminA)).accessToken;
    adminBToken = (await tokenService.generateTokens(adminB)).accessToken;

    const clinicA = await authJson('/clinics', adminAToken, {
      method: 'POST',
      body: JSON.stringify({ name: 'Part 4 Clinic A', phone: '+251111006001' }),
    });
    clinicAId = (clinicA.json.data as Record<string, unknown>).id as string;
    const clinicB = await authJson('/clinics', adminBToken, {
      method: 'POST',
      body: JSON.stringify({ name: 'Part 4 Clinic B', phone: '+251111006002' }),
    });
    clinicBId = (clinicB.json.data as Record<string, unknown>).id as string;

    const doctorStaff = await authJson(`/clinics/${clinicAId}/staff`, adminAToken, {
      method: 'POST',
      body: JSON.stringify({ userId: doctorUserA.id, role: Role.DOCTOR }),
    });
    const staffId = (doctorStaff.json.data as Record<string, unknown>).id as string;
    const doctor = await authJson(`/clinics/${clinicAId}/doctors`, adminAToken, {
      method: 'POST',
      body: JSON.stringify({
        staffMemberId: staffId,
        specialization: 'Family Medicine',
        licenseNumber: 'PART4-DOC-A',
      }),
    });
    doctorAId = (doctor.json.data as Record<string, unknown>).id as string;

    const doctorStaffB = await authJson(`/clinics/${clinicBId}/staff`, adminBToken, {
      method: 'POST',
      body: JSON.stringify({ userId: doctorUserB.id, role: Role.DOCTOR }),
    });
    const doctorBStaffId = (doctorStaffB.json.data as Record<string, unknown>).id as string;
    const doctorB = await authJson(`/clinics/${clinicBId}/doctors`, adminBToken, {
      method: 'POST',
      body: JSON.stringify({
        staffMemberId: doctorBStaffId,
        specialization: 'Pediatrics',
        licenseNumber: 'PART4-DOC-B',
      }),
    });
    doctorBId = (doctorB.json.data as Record<string, unknown>).id as string;

    const patientA = await authJson('/patients', adminAToken, {
      method: 'POST',
      body: JSON.stringify({ clinicId: clinicAId, userId: patientUserA.id }),
    });
    patientAId = (patientA.json.data as Record<string, unknown>).id as string;
    const patientB = await authJson('/patients', adminBToken, {
      method: 'POST',
      body: JSON.stringify({ clinicId: clinicBId, userId: patientUserB.id }),
    });
    patientBId = (patientB.json.data as Record<string, unknown>).id as string;
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

  describe('Patient management', () => {
    it('creates and lists only patients in the requested clinic with pagination/search/sorting', async () => {
      const { status, json } = await authJson(
        `/patients?clinicId=${clinicAId}&search=Patient&page=1&limit=5&sortBy=medicalRecordNumber&sortOrder=asc`,
        adminAToken,
      );
      assert.strictEqual(status, 200);
      const result = json.data as Array<{ id: string }>;
      assert.strictEqual((json.meta as { total: number }).total, 1);
      assert.strictEqual(result[0].id, patientAId);
      assert.notStrictEqual(result[0].id, patientBId);
    });

    it('rejects patient profile access without clinic membership', async () => {
      const { status } = await authJson(
        `/patients/${patientBId}?clinicId=${clinicAId}`,
        adminAToken,
      );
      assert.strictEqual(status, 404);
    });

    it('updates patient details only within the clinic', async () => {
      const { status, json } = await authJson(
        `/patients/${patientAId}?clinicId=${clinicAId}`,
        adminAToken,
        {
          method: 'PATCH',
          body: JSON.stringify({ address: 'Bole, Addis Ababa' }),
        },
      );
      assert.strictEqual(status, 200);
      assert.strictEqual((json.data as Record<string, unknown>).address, 'Bole, Addis Ababa');
    });
  });

  describe('Appointment rules', () => {
    const startsAt = '2026-10-12T09:00:00.000Z';
    const endsAt = '2026-10-12T09:30:00.000Z';

    async function createAppointment(token = adminAToken, overrides: Record<string, unknown> = {}) {
      return authJson('/appointments', token, {
        method: 'POST',
        body: JSON.stringify({
          clinicId: clinicAId,
          patientId: patientAId,
          doctorId: doctorAId,
          startsAt,
          endsAt,
          ...overrides,
        }),
      });
    }

    it('rejects appointment creation with a patient from another clinic', async () => {
      const { status } = await createAppointment(adminAToken, { patientId: patientBId });
      assert.strictEqual(status, 400);
    });

    it('rejects appointment creation with a doctor from another clinic', async () => {
      const { status } = await createAppointment(adminAToken, { doctorId: doctorBId });
      assert.strictEqual(status, 400);
    });

    it('rejects an overlapping appointment for the same doctor', async () => {
      const first = await createAppointment();
      assert.strictEqual(first.status, 201);
      const second = await createAppointment(adminAToken, {
        startsAt: '2026-10-12T09:15:00.000Z',
        endsAt: '2026-10-12T09:45:00.000Z',
      });
      assert.strictEqual(second.status, 409);
      assert.match(String(second.json.message), /overlapping appointment/i);
    });

    it('prevents simultaneous requests from double-booking a doctor', async () => {
      const simultaneous = await Promise.all([
        createAppointment(adminAToken, {
          startsAt: '2026-10-12T14:00:00.000Z',
          endsAt: '2026-10-12T14:30:00.000Z',
        }),
        createAppointment(adminAToken, {
          startsAt: '2026-10-12T14:10:00.000Z',
          endsAt: '2026-10-12T14:40:00.000Z',
        }),
      ]);
      assert.deepStrictEqual(simultaneous.map((result) => result.status).sort(), [201, 409]);
    });

    it('accepts valid transitions and rejects invalid transitions', async () => {
      const created = await createAppointment(adminAToken, {
        startsAt: '2026-10-12T11:00:00.000Z',
        endsAt: '2026-10-12T11:30:00.000Z',
      });
      const appointmentId = (created.json.data as Record<string, unknown>).id as string;

      const invalid = await authJson(
        `/appointments/${appointmentId}?clinicId=${clinicAId}`,
        adminAToken,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: AppointmentStatus.COMPLETED }),
        },
      );
      assert.strictEqual(invalid.status, 400);
      assert.match(String(invalid.json.message), /invalid appointment status transition/i);

      const confirmed = await authJson(
        `/appointments/${appointmentId}?clinicId=${clinicAId}`,
        adminAToken,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: AppointmentStatus.CONFIRMED }),
        },
      );
      assert.strictEqual(confirmed.status, 200);
      assert.strictEqual(
        (confirmed.json.data as Record<string, unknown>).status,
        AppointmentStatus.CONFIRMED,
      );

      const checkedIn = await authJson(
        `/appointments/${appointmentId}/check-in?clinicId=${clinicAId}`,
        adminAToken,
        { method: 'POST' },
      );
      assert.strictEqual(checkedIn.status, 201);
      assert.strictEqual(
        (checkedIn.json.data as Record<string, unknown>).status,
        AppointmentStatus.CHECKED_IN,
      );

      const started = await authJson(
        `/appointments/${appointmentId}?clinicId=${clinicAId}`,
        adminAToken,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: AppointmentStatus.IN_CONSULTATION }),
        },
      );
      assert.strictEqual(started.status, 200);

      const completed = await authJson(
        `/appointments/${appointmentId}?clinicId=${clinicAId}`,
        adminAToken,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: AppointmentStatus.COMPLETED }),
        },
      );
      assert.strictEqual(completed.status, 200);

      const backwards = await authJson(
        `/appointments/${appointmentId}?clinicId=${clinicAId}`,
        adminAToken,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: AppointmentStatus.CONFIRMED }),
        },
      );
      assert.strictEqual(backwards.status, 400);
    });

    it('lists and retrieves appointments only within the clinic scope', async () => {
      const { status, json } = await authJson(`/appointments?clinicId=${clinicAId}`, adminAToken);
      assert.strictEqual(status, 200);
      const result = json.data as Array<{ clinicId: string }>;
      assert.ok(result.every((appointment) => appointment.clinicId === clinicAId));
    });

    it('does not expose another clinic appointment details or updates', async () => {
      const created = await authJson('/appointments', adminBToken, {
        method: 'POST',
        body: JSON.stringify({
          clinicId: clinicBId,
          patientId: patientBId,
          doctorId: doctorBId,
          startsAt: '2026-10-13T09:00:00.000Z',
          endsAt: '2026-10-13T09:30:00.000Z',
        }),
      });
      assert.strictEqual(created.status, 201);
      const appointmentId = (created.json.data as Record<string, unknown>).id as string;

      const detail = await authJson(
        `/appointments/${appointmentId}?clinicId=${clinicAId}`,
        adminAToken,
      );
      assert.strictEqual(detail.status, 404);

      const update = await authJson(
        `/appointments/${appointmentId}?clinicId=${clinicAId}`,
        adminAToken,
        { method: 'PATCH', body: JSON.stringify({ reason: 'Unauthorized edit' }) },
      );
      assert.strictEqual(update.status, 404);

      const list = await authJson(`/appointments?clinicId=${clinicAId}`, adminAToken);
      const appointments = list.json.data as Array<{ id: string }>;
      assert.ok(appointments.every((appointment) => appointment.id !== appointmentId));
    });

    it('cancels a scheduled appointment and rejects later transitions', async () => {
      const created = await createAppointment(adminAToken, {
        startsAt: '2026-10-12T16:00:00.000Z',
        endsAt: '2026-10-12T16:30:00.000Z',
      });
      const appointmentId = (created.json.data as Record<string, unknown>).id as string;
      const cancelled = await authJson(
        `/appointments/${appointmentId}/cancel?clinicId=${clinicAId}`,
        adminAToken,
        { method: 'POST' },
      );
      assert.strictEqual(cancelled.status, 201);
      assert.strictEqual(
        (cancelled.json.data as Record<string, unknown>).status,
        AppointmentStatus.CANCELLED,
      );

      const checkIn = await authJson(
        `/appointments/${appointmentId}/check-in?clinicId=${clinicAId}`,
        adminAToken,
        { method: 'POST' },
      );
      assert.strictEqual(checkIn.status, 400);
    });
  });
});
