import { after, before, describe, it } from 'node:test';
import * as assert from 'node:assert';
import { QueuePriority, QueueTicketStatus, Role } from '@prisma/client';
import { PrismaService } from '../src/prisma/prisma.service';
import { TokenService } from '../src/auth/token.service';
import { MockPrismaService } from './mock-prisma.service';
import { createTestApp, TestAppInstance } from './test-app';

describe('ClinicFlow Part 5: Real-Time Clinic Queue', () => {
  let app: TestAppInstance;
  let baseUrl: string;
  let mockPrisma: MockPrismaService;
  let adminAToken: string;
  let adminBToken: string;
  let receptionistAToken: string;
  let receptionistBToken: string;
  let clinicAId: string;
  let clinicBId: string;
  let doctorAId: string;
  let patientAId: string;
  let patientA2Id: string;
  let patientA3Id: string;
  let patientBId: string;

  before(async () => {
    mockPrisma = new MockPrismaService();
    app = await createTestApp({ mockPrisma: mockPrisma as unknown as PrismaService });
    baseUrl = app.baseUrl;
    const tokenService = app.services.token;

    const adminA = await mockPrisma.user.create({
      data: { phone: '+251977000001', role: Role.ADMIN, firstName: 'Admin', lastName: 'A' },
    });
    const adminB = await mockPrisma.user.create({
      data: { phone: '+251977000002', role: Role.ADMIN, firstName: 'Admin', lastName: 'B' },
    });
    const receptionistA = await mockPrisma.user.create({
      data: {
        phone: '+251977000003',
        role: Role.RECEPTIONIST,
        firstName: 'Reception',
        lastName: 'A',
      },
    });
    const receptionistB = await mockPrisma.user.create({
      data: {
        phone: '+251977000004',
        role: Role.RECEPTIONIST,
        firstName: 'Reception',
        lastName: 'B',
      },
    });
    const doctorUserA = await mockPrisma.user.create({
      data: { phone: '+251977000005', role: Role.DOCTOR, firstName: 'Doctor', lastName: 'A' },
    });
    const doctorUserB = await mockPrisma.user.create({
      data: { phone: '+251977000006', role: Role.DOCTOR, firstName: 'Doctor', lastName: 'B' },
    });
    const patientUserA = await mockPrisma.user.create({
      data: { phone: '+251977000007', role: Role.PATIENT, firstName: 'Patient', lastName: 'A' },
    });
    const patientUserA2 = await mockPrisma.user.create({
      data: { phone: '+251977000008', role: Role.PATIENT, firstName: 'Patient', lastName: 'A2' },
    });
    const patientUserA3 = await mockPrisma.user.create({
      data: { phone: '+251977000009', role: Role.PATIENT, firstName: 'Patient', lastName: 'A3' },
    });
    const patientUserB = await mockPrisma.user.create({
      data: { phone: '+251977000010', role: Role.PATIENT, firstName: 'Patient', lastName: 'B' },
    });

    adminAToken = (await tokenService.generateTokens(adminA)).accessToken;
    adminBToken = (await tokenService.generateTokens(adminB)).accessToken;
    receptionistAToken = (await tokenService.generateTokens(receptionistA)).accessToken;
    receptionistBToken = (await tokenService.generateTokens(receptionistB)).accessToken;

    const clinicA = await authJson('/clinics', adminAToken, {
      method: 'POST',
      body: JSON.stringify({ name: 'Queue Clinic A', phone: '+251111007001' }),
    });
    clinicAId = (clinicA.json.data as Record<string, unknown>).id as string;
    const clinicB = await authJson('/clinics', adminBToken, {
      method: 'POST',
      body: JSON.stringify({ name: 'Queue Clinic B', phone: '+251111007002' }),
    });
    clinicBId = (clinicB.json.data as Record<string, unknown>).id as string;

    for (const [userId, token] of [
      [receptionistA.id, adminAToken],
      [receptionistB.id, adminAToken],
    ]) {
      await authJson(`/clinics/${clinicAId}/staff`, token, {
        method: 'POST',
        body: JSON.stringify({ userId, role: Role.RECEPTIONIST }),
      });
    }

    const doctorStaffA = await authJson(`/clinics/${clinicAId}/staff`, adminAToken, {
      method: 'POST',
      body: JSON.stringify({ userId: doctorUserA.id, role: Role.DOCTOR }),
    });
    const doctorA = await authJson(`/clinics/${clinicAId}/doctors`, adminAToken, {
      method: 'POST',
      body: JSON.stringify({
        staffMemberId: (doctorStaffA.json.data as Record<string, unknown>).id,
        specialization: 'General Practice',
        licenseNumber: 'QUEUE-DOC-A',
      }),
    });
    doctorAId = (doctorA.json.data as Record<string, unknown>).id as string;
    const doctorStaffB = await authJson(`/clinics/${clinicBId}/staff`, adminBToken, {
      method: 'POST',
      body: JSON.stringify({ userId: doctorUserB.id, role: Role.DOCTOR }),
    });
    await authJson(`/clinics/${clinicBId}/doctors`, adminBToken, {
      method: 'POST',
      body: JSON.stringify({
        staffMemberId: (doctorStaffB.json.data as Record<string, unknown>).id,
        specialization: 'Pediatrics',
        licenseNumber: 'QUEUE-DOC-B',
      }),
    });

    patientAId = await createPatient(clinicAId, patientUserA.id, adminAToken);
    patientA2Id = await createPatient(clinicAId, patientUserA2.id, adminAToken);
    patientA3Id = await createPatient(clinicAId, patientUserA3.id, adminAToken);
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

  async function checkIn(
    patientId: string,
    token = receptionistAToken,
    clinicId = clinicAId,
    doctorId?: string,
    priority: QueuePriority = QueuePriority.NORMAL,
  ) {
    return authJson('/queue/check-in', token, {
      method: 'POST',
      body: JSON.stringify({ clinicId, patientId, doctorId, priority }),
    });
  }

  describe('Daily numbering and clinic filters', () => {
    it('assigns unique consecutive numbers under simultaneous receptionist check-ins', async () => {
      const results = await Promise.all([
        checkIn(patientAId, receptionistAToken, clinicAId, doctorAId),
        checkIn(patientA2Id, receptionistBToken, clinicAId, doctorAId),
      ]);
      assert.deepStrictEqual(
        results.map((result) => result.status),
        [201, 201],
      );
      const numbers = results.map(
        (result) => (result.json.data as Record<string, unknown>).queueNumber as number,
      );
      assert.deepStrictEqual(
        numbers.sort((a, b) => a - b),
        [1, 2],
      );
    });

    it('requires clinic membership and filters the queue by doctor', async () => {
      const forbidden = await authJson(`/queue?clinicId=${clinicBId}`, adminAToken);
      assert.strictEqual(forbidden.status, 403);

      const list = await authJson(
        `/queue?clinicId=${clinicAId}&doctorId=${doctorAId}`,
        receptionistAToken,
      );
      assert.strictEqual(list.status, 200);
      const tickets = list.json.data as Array<{ doctorId: string; queueNumber: number }>;
      assert.ok(tickets.length >= 2);
      assert.ok(tickets.every((ticket) => ticket.doctorId === doctorAId));
      assert.deepStrictEqual(
        tickets.map((ticket) => ticket.queueNumber),
        [...tickets.map((ticket) => ticket.queueNumber)].sort((a, b) => a - b),
      );
    });

    it('orders emergency and urgent tickets ahead of normal tickets without changing numbers', async () => {
      const normal = await checkIn(patientAId, receptionistAToken, clinicAId, doctorAId);
      const urgent = await checkIn(
        patientA2Id,
        receptionistAToken,
        clinicAId,
        doctorAId,
        QueuePriority.URGENT,
      );
      const emergency = await checkIn(
        patientA3Id,
        receptionistAToken,
        clinicAId,
        doctorAId,
        QueuePriority.EMERGENCY,
      );
      const ticketIds = [normal, urgent, emergency].map(
        (result) => (result.json.data as Record<string, unknown>).id,
      );
      const list = await authJson(`/queue?clinicId=${clinicAId}`, receptionistAToken);
      const ordered = (
        list.json.data as Array<{ id: string; priority: QueuePriority; queueNumber: number }>
      ).filter((ticket) => ticketIds.includes(ticket.id));
      assert.deepStrictEqual(
        ordered.map((ticket) => ticket.priority),
        [QueuePriority.EMERGENCY, QueuePriority.URGENT, QueuePriority.NORMAL],
      );
      assert.deepStrictEqual(
        ordered.map((ticket) => ticket.queueNumber),
        [
          (emergency.json.data as Record<string, unknown>).queueNumber,
          (urgent.json.data as Record<string, unknown>).queueNumber,
          (normal.json.data as Record<string, unknown>).queueNumber,
        ],
      );
    });

    it('rejects check-in when patient or doctor belongs to another clinic', async () => {
      const patientMismatch = await checkIn(patientBId);
      assert.strictEqual(patientMismatch.status, 400);

      const foreignDoctor = [...mockPrisma.doctors.values()].find(
        (doctor) => doctor.clinicId === clinicBId,
      )!;
      const doctorMismatch = await checkIn(
        patientA3Id,
        receptionistAToken,
        clinicAId,
        foreignDoctor.id,
      );
      assert.strictEqual(doctorMismatch.status, 400);
    });
  });

  describe('Ticket transitions and concurrency', () => {
    it('enforces WAITING to CALLED to IN_CONSULTATION to COMPLETED and reports durations', async () => {
      const created = await checkIn(patientA3Id, receptionistAToken, clinicAId, doctorAId);
      const ticketId = (created.json.data as Record<string, unknown>).id as string;

      const startEarly = await authJson(
        `/queue/${ticketId}/start?clinicId=${clinicAId}`,
        receptionistAToken,
        {
          method: 'POST',
        },
      );
      assert.strictEqual(startEarly.status, 400);

      const called = await authJson(
        `/queue/${ticketId}/call?clinicId=${clinicAId}`,
        receptionistAToken,
        {
          method: 'POST',
        },
      );
      assert.strictEqual(called.status, 201);
      const calledData = called.json.data as Record<string, unknown>;
      assert.strictEqual(calledData.status, QueueTicketStatus.CALLED);
      assert.ok(calledData.calledAt);

      const started = await authJson(
        `/queue/${ticketId}/start?clinicId=${clinicAId}`,
        receptionistAToken,
        {
          method: 'POST',
        },
      );
      assert.strictEqual(started.status, 201);
      const startedData = started.json.data as Record<string, unknown>;
      assert.strictEqual(startedData.status, QueueTicketStatus.IN_CONSULTATION);
      assert.ok(startedData.consultationStartedAt);
      assert.ok(Number(startedData.waitingDurationSeconds) >= 0);

      const completed = await authJson(
        `/queue/${ticketId}/complete?clinicId=${clinicAId}`,
        receptionistAToken,
        {
          method: 'POST',
        },
      );
      assert.strictEqual(completed.status, 201);
      const completedData = completed.json.data as Record<string, unknown>;
      assert.strictEqual(completedData.status, QueueTicketStatus.COMPLETED);
      assert.ok(completedData.completedAt);
      assert.ok(Number(completedData.consultationDurationSeconds) >= 0);

      const skipCompleted = await authJson(
        `/queue/${ticketId}/skip?clinicId=${clinicAId}`,
        receptionistAToken,
        {
          method: 'POST',
        },
      );
      assert.strictEqual(skipCompleted.status, 400);
    });

    it('allows only one receptionist to call a ticket during simultaneous actions', async () => {
      const created = await checkIn(patientA2Id);
      const ticketId = (created.json.data as Record<string, unknown>).id as string;
      const results = await Promise.all([
        authJson(`/queue/${ticketId}/call?clinicId=${clinicAId}`, receptionistAToken, {
          method: 'POST',
        }),
        authJson(`/queue/${ticketId}/call?clinicId=${clinicAId}`, receptionistBToken, {
          method: 'POST',
        }),
      ]);
      assert.deepStrictEqual(results.map((result) => result.status).sort(), [201, 400]);
      const finalList = await authJson(
        `/queue?clinicId=${clinicAId}&status=${QueueTicketStatus.CALLED}`,
        receptionistAToken,
      );
      const calledTickets = finalList.json.data as Array<{ id: string }>;
      assert.strictEqual(calledTickets.filter((ticket) => ticket.id === ticketId).length, 1);
    });

    it('permits skipping a waiting ticket once and rejects repeated skip actions', async () => {
      const created = await checkIn(patientAId);
      const ticketId = (created.json.data as Record<string, unknown>).id as string;
      const skipped = await authJson(
        `/queue/${ticketId}/skip?clinicId=${clinicAId}`,
        receptionistAToken,
        {
          method: 'POST',
        },
      );
      assert.strictEqual(skipped.status, 201);
      assert.strictEqual(
        (skipped.json.data as Record<string, unknown>).status,
        QueueTicketStatus.SKIPPED,
      );
      assert.ok((skipped.json.data as Record<string, unknown>).skippedAt);

      const repeated = await authJson(
        `/queue/${ticketId}/skip?clinicId=${clinicAId}`,
        receptionistAToken,
        {
          method: 'POST',
        },
      );
      assert.strictEqual(repeated.status, 400);
    });
  });
});
