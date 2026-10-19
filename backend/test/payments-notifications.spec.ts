import { after, before, describe, it } from 'node:test';
import * as assert from 'node:assert';
import { NotificationType, PaymentMethod, PaymentStatus, Role } from '@prisma/client';
import { PrismaService } from '../src/prisma/prisma.service';
import { NotificationsService } from '../src/notifications/notifications.service';
import { TokenService } from '../src/auth/token.service';
import { MockPrismaService } from './mock-prisma.service';
import { createTestApp, TestAppInstance } from './test-app';

describe('ClinicFlow Part 6: Payments and Notifications', () => {
  let app: TestAppInstance;
  let baseUrl: string;
  let mockPrisma: MockPrismaService;
  let adminAToken: string;
  let adminBToken: string;
  let patientAToken: string;
  let clinicAId: string;
  let clinicBId: string;
  let patientAId: string;
  let patientBId: string;
  let receptionistAId: string;
  let notificationsService: NotificationsService;

  before(async () => {
    mockPrisma = new MockPrismaService();
    app = await createTestApp({ mockPrisma: mockPrisma as unknown as PrismaService });
    baseUrl = app.baseUrl;
    const tokenService = app.services.token;
    notificationsService = app.services.notifications;

    const adminA = await mockPrisma.user.create({
      data: { phone: '+251988000001', role: Role.ADMIN, firstName: 'Admin', lastName: 'A' },
    });
    const adminB = await mockPrisma.user.create({
      data: { phone: '+251988000002', role: Role.ADMIN, firstName: 'Admin', lastName: 'B' },
    });
    const receptionistA = await mockPrisma.user.create({
      data: {
        phone: '+251988000003',
        role: Role.RECEPTIONIST,
        firstName: 'Receptionist',
        lastName: 'A',
      },
    });
    const patientUserA = await mockPrisma.user.create({
      data: { phone: '+251988000004', role: Role.PATIENT, firstName: 'Patient', lastName: 'A' },
    });
    const patientUserB = await mockPrisma.user.create({
      data: { phone: '+251988000005', role: Role.PATIENT, firstName: 'Patient', lastName: 'B' },
    });
    receptionistAId = receptionistA.id;

    adminAToken = (await tokenService.generateTokens(adminA)).accessToken;
    adminBToken = (await tokenService.generateTokens(adminB)).accessToken;
    patientAToken = (await tokenService.generateTokens(patientUserA)).accessToken;

    const clinicA = await authJson('/clinics', adminAToken, {
      method: 'POST',
      body: JSON.stringify({ name: 'Payments Clinic A', phone: '+251111008001' }),
    });
    clinicAId = (clinicA.json.data as Record<string, unknown>).id as string;
    const clinicB = await authJson('/clinics', adminBToken, {
      method: 'POST',
      body: JSON.stringify({ name: 'Payments Clinic B', phone: '+251111008002' }),
    });
    clinicBId = (clinicB.json.data as Record<string, unknown>).id as string;

    await authJson(`/clinics/${clinicAId}/staff`, adminAToken, {
      method: 'POST',
      body: JSON.stringify({ userId: receptionistA.id, role: Role.RECEPTIONIST }),
    });
    patientAId = await createPatient(clinicAId, patientUserA.id, adminAToken);
    patientBId = await createPatient(clinicBId, patientUserB.id, adminBToken);
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

  async function createPatient(clinicId: string, userId: string, token: string): Promise<string> {
    const response = await authJson('/patients', token, {
      method: 'POST',
      body: JSON.stringify({ clinicId, userId }),
    });
    return (response.json.data as Record<string, unknown>).id as string;
  }

  async function createNotification(
    userId: string,
    clinicId: string,
    type: NotificationType,
    title: string,
  ): Promise<string> {
    const notification = await notificationsService.create({
      userId,
      clinicId,
      type,
      title,
      message: `${title} message`,
    });
    return notification.id;
  }

  describe('Payment records', () => {
    it('records manual payment methods and requires verified Chapa checkout for digital payments', async () => {
      const completed = await authJson('/payments', adminAToken, {
        method: 'POST',
        body: JSON.stringify({
          clinicId: clinicAId,
          patientId: patientAId,
          amount: 1250.5,
          method: PaymentMethod.MPESA,
        }),
      });
      assert.strictEqual(completed.status, 201);
      assert.strictEqual(
        (completed.json.data as Record<string, unknown>).status,
        PaymentStatus.COMPLETED,
      );
      assert.strictEqual((completed.json.data as Record<string, unknown>).currency, 'ETB');

      const unverifiedChapa = await authJson('/payments', adminAToken, {
        method: 'POST',
        body: JSON.stringify({
          clinicId: clinicAId,
          patientId: patientAId,
          amount: 1250.5,
          method: PaymentMethod.CHAPA,
        }),
      });
      assert.strictEqual(unverifiedChapa.status, 400);

      const pending = await authJson('/payments', adminAToken, {
        method: 'POST',
        body: JSON.stringify({
          clinicId: clinicAId,
          patientId: patientAId,
          amount: 75,
          method: PaymentMethod.CASH,
          status: PaymentStatus.PENDING,
        }),
      });
      assert.strictEqual(pending.status, 201);

      const { status, json } = await authJson(
        `/payments?clinicId=${clinicAId}&status=${PaymentStatus.PENDING}`,
        adminAToken,
      );
      assert.strictEqual(status, 200);
      const records = json.data as Array<{ status: PaymentStatus; method: PaymentMethod }>;
      assert.strictEqual(records.length, 1);
      assert.strictEqual(records[0].status, PaymentStatus.PENDING);
      assert.strictEqual(records[0].method, PaymentMethod.CASH);
    });

    it('rejects foreign-clinic patients and prevents cross-clinic payment listing', async () => {
      const invalid = await authJson('/payments', adminAToken, {
        method: 'POST',
        body: JSON.stringify({
          clinicId: clinicAId,
          patientId: patientBId,
          amount: 10,
          method: PaymentMethod.OTHER,
        }),
      });
      assert.strictEqual(invalid.status, 400);

      const forbidden = await authJson(`/payments?clinicId=${clinicBId}`, adminAToken);
      assert.strictEqual(forbidden.status, 403);

      const patientDenied = await authJson(`/payments?clinicId=${clinicAId}`, patientAToken);
      assert.strictEqual(patientDenied.status, 403);
    });

    it('validates amount, method, and status inputs', async () => {
      const invalid = await authJson('/payments', adminAToken, {
        method: 'POST',
        body: JSON.stringify({
          clinicId: clinicAId,
          patientId: patientAId,
          amount: 0,
          method: 'CRYPTO',
          status: 'PROCESSING',
        }),
      });
      assert.strictEqual(invalid.status, 400);
    });
  });

  describe('Notifications', () => {
    it('returns only notifications for the authenticated user and clinic', async () => {
      const ownId = await createNotification(
        [...mockPrisma.users.values()].find((user) => user.phone === '+251988000001')!.id,
        clinicAId,
        NotificationType.APPOINTMENT_REMINDER,
        'Appointment reminder',
      );
      await createNotification(
        receptionistAId,
        clinicAId,
        NotificationType.QUEUE_UPDATE,
        'Queue moved',
      );
      await createNotification(
        [...mockPrisma.users.values()].find((user) => user.phone === '+251988000002')!.id,
        clinicBId,
        NotificationType.SYSTEM,
        'Other clinic event',
      );

      const { status, json } = await authJson(`/notifications?clinicId=${clinicAId}`, adminAToken);
      assert.strictEqual(status, 200);
      const notifications = json.data as Array<{ id: string; userId: string; clinicId: string }>;
      assert.strictEqual(notifications.length, 1);
      assert.strictEqual(notifications[0].id, ownId);
      assert.strictEqual(notifications[0].clinicId, clinicAId);
    });

    it('lets patients read their own clinic notifications without staff membership', async () => {
      const patientUser = [...mockPrisma.users.values()].find(
        (user) => user.phone === '+251988000004',
      )!;
      await createNotification(
        patientUser.id,
        clinicAId,
        NotificationType.APPOINTMENT_CANCELLATION,
        'Appointment cancelled',
      );
      const { status, json } = await authJson(
        `/notifications?clinicId=${clinicAId}`,
        patientAToken,
      );
      assert.strictEqual(status, 200);
      const notifications = json.data as Array<{ userId: string }>;
      assert.strictEqual(notifications.length, 1);
      assert.strictEqual(notifications[0].userId, patientUser.id);
    });

    it('marks only the authenticated user’s notification read, idempotently', async () => {
      const ownUserId = [...mockPrisma.users.values()].find(
        (user) => user.phone === '+251988000001',
      )!.id;
      const ownId = await createNotification(
        ownUserId,
        clinicAId,
        NotificationType.DOCTOR_DELAY,
        'Doctor delayed',
      );
      const otherId = await createNotification(
        receptionistAId,
        clinicAId,
        NotificationType.QUEUE_UPDATE,
        'Other user queue update',
      );

      const first = await authJson(
        `/notifications/${ownId}/read?clinicId=${clinicAId}`,
        adminAToken,
        {
          method: 'PATCH',
        },
      );
      assert.strictEqual(first.status, 200);
      assert.ok((first.json.data as Record<string, unknown>).readAt);

      const repeated = await authJson(
        `/notifications/${ownId}/read?clinicId=${clinicAId}`,
        adminAToken,
        {
          method: 'PATCH',
        },
      );
      assert.strictEqual(repeated.status, 200);

      const otherUser = await authJson(
        `/notifications/${otherId}/read?clinicId=${clinicAId}`,
        adminAToken,
        { method: 'PATCH' },
      );
      assert.strictEqual(otherUser.status, 404);
    });

    it('requires clinic access before reading notifications', async () => {
      const { status } = await authJson(`/notifications?clinicId=${clinicBId}`, adminAToken);
      assert.strictEqual(status, 403);
    });
  });
});
