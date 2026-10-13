import { describe, it, before, after } from 'node:test';
import * as assert from 'node:assert';
import { DoctorAvailabilityStatus, Role } from '@prisma/client';
import { PrismaService } from '../src/prisma/prisma.service';
import { TokenService } from '../src/auth/token.service';
import { MockPrismaService } from './mock-prisma.service';
import { createTestApp, TestAppInstance } from './test-app';

describe('ClinicFlow Part 3: Clinics, Branches, Staff, Doctors', () => {
  let app: TestAppInstance;
  let baseUrl: string;
  let mockPrisma: MockPrismaService;
  let tokenService: TokenService;

  let clinicAId: string;
  let clinicBId: string;
  let adminAToken: string;
  let adminBToken: string;
  let receptionistAToken: string;
  let doctorAToken: string;
  let doctorAUserId: string;
  let doctorAId: string;
  let doctorBId: string;
  let patientToken: string;

  before(async () => {
    mockPrisma = new MockPrismaService();

    app = await createTestApp({ mockPrisma: mockPrisma as unknown as PrismaService });
    baseUrl = app.baseUrl;
    tokenService = app.services.token;

    const adminA = await mockPrisma.user.create({
      data: { phone: '+251955000001', role: Role.ADMIN, firstName: 'Admin', lastName: 'A' },
    });
    const adminB = await mockPrisma.user.create({
      data: { phone: '+251955000002', role: Role.ADMIN, firstName: 'Admin', lastName: 'B' },
    });
    const receptionistA = await mockPrisma.user.create({
      data: {
        phone: '+251955000003',
        role: Role.RECEPTIONIST,
        firstName: 'Desk',
        lastName: 'A',
      },
    });
    const doctorUserA = await mockPrisma.user.create({
      data: { phone: '+251955000004', role: Role.DOCTOR, firstName: 'Doc', lastName: 'A' },
    });
    const patient = await mockPrisma.user.create({
      data: { phone: '+251955000005', role: Role.PATIENT, firstName: 'Pat', lastName: 'User' },
    });
    doctorAUserId = doctorUserA.id;

    adminAToken = (await tokenService.generateTokens(adminA)).accessToken;
    adminBToken = (await tokenService.generateTokens(adminB)).accessToken;
    receptionistAToken = (await tokenService.generateTokens(receptionistA)).accessToken;
    doctorAToken = (await tokenService.generateTokens(doctorUserA)).accessToken;
    patientToken = (await tokenService.generateTokens(patient)).accessToken;
  });

  after(async () => {
    await app.close();
  });

  const authJson = async (
    path: string,
    token: string,
    init: RequestInit = {},
  ): Promise<{ status: number; json: Record<string, unknown> }> => {
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(init.headers || {}),
      },
    });
    const json = (await res.json()) as Record<string, unknown>;
    return { status: res.status, json };
  };

  describe('1. Clinic profile CRUD', () => {
    it('should reject unauthenticated clinic creation with 401', async () => {
      const res = await fetch(`${baseUrl}/clinics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'No Auth Clinic', phone: '+251111000000' }),
      });
      assert.strictEqual(res.status, 401);
    });

    it('should deny PATIENT creating a clinic (403)', async () => {
      const { status } = await authJson('/clinics', patientToken, {
        method: 'POST',
        body: JSON.stringify({ name: 'Patient Clinic', phone: '+251111000001' }),
      });
      assert.strictEqual(status, 403);
    });

    it('should allow ADMIN to create a clinic and become staff', async () => {
      const { status, json } = await authJson('/clinics', adminAToken, {
        method: 'POST',
        body: JSON.stringify({
          name: 'Addis Health Center',
          phone: '+251111234567',
          city: 'Addis Ababa',
          licenseNumber: 'MOH-CLN-A',
        }),
      });
      assert.strictEqual(status, 201);
      assert.strictEqual(json.success, true);
      const data = json.data as Record<string, unknown>;
      assert.strictEqual(data.name, 'Addis Health Center');
      assert.ok(data.id);
      clinicAId = data.id as string;
    });

    it('should allow a second ADMIN to create an isolated clinic', async () => {
      const { status, json } = await authJson('/clinics', adminBToken, {
        method: 'POST',
        body: JSON.stringify({
          name: 'Bahir Dar Clinic',
          phone: '+251582000000',
          licenseNumber: 'MOH-CLN-B',
        }),
      });
      assert.strictEqual(status, 201);
      clinicBId = (json.data as Record<string, unknown>).id as string;
      assert.notStrictEqual(clinicAId, clinicBId);
    });

    it('should list only clinics the authenticated admin belongs to', async () => {
      const { status, json } = await authJson('/clinics', adminAToken);
      assert.strictEqual(status, 200);
      const data = json.data as Array<{ id: string }>;
      assert.strictEqual(data.length, 1);
      assert.strictEqual(data[0].id, clinicAId);
    });

    it('should return clinic profile for a member of that clinic', async () => {
      const { status, json } = await authJson(`/clinics/${clinicAId}`, adminAToken);
      assert.strictEqual(status, 200);
      assert.strictEqual((json.data as Record<string, unknown>).id, clinicAId);
    });

    it('should reject invalid clinic payloads', async () => {
      const { status, json } = await authJson('/clinics', adminAToken, {
        method: 'POST',
        body: JSON.stringify({ phone: '+251111000009' }),
      });
      assert.strictEqual(status, 400);
      assert.match(String(json.message), /Validation failed|name/i);
    });
  });

  describe('2. Tenant isolation', () => {
    it('should forbid admin A from reading clinic B profile', async () => {
      const { status, json } = await authJson(`/clinics/${clinicBId}`, adminAToken);
      assert.strictEqual(status, 403);
      assert.match(String(json.message), /do not have access/i);
    });

    it('should forbid admin B from updating clinic A', async () => {
      const { status } = await authJson(`/clinics/${clinicAId}`, adminBToken, {
        method: 'PATCH',
        body: JSON.stringify({ description: 'Hijacked' }),
      });
      assert.strictEqual(status, 403);
    });

    it('should forbid a patient with no membership from accessing clinic A', async () => {
      const { status } = await authJson(`/clinics/${clinicAId}`, patientToken);
      assert.strictEqual(status, 403);
    });

    it('should forbid clinic A admin from listing clinic B staff', async () => {
      const { status } = await authJson(`/clinics/${clinicBId}/staff`, adminAToken);
      assert.strictEqual(status, 403);
    });

    it('should forbid clinic A admin from listing clinic B doctors', async () => {
      const { status } = await authJson(`/clinics/${clinicBId}/doctors`, adminAToken);
      assert.strictEqual(status, 403);
    });
  });

  describe('3. Branch, staff, and doctor management with RBAC', () => {
    it('should allow clinic ADMIN to create a branch', async () => {
      const { status, json } = await authJson(`/clinics/${clinicAId}/branches`, adminAToken, {
        method: 'POST',
        body: JSON.stringify({ name: 'Bole Branch', code: 'BOLE-01', city: 'Addis Ababa' }),
      });
      assert.strictEqual(status, 201);
      assert.strictEqual((json.data as Record<string, unknown>).code, 'BOLE-01');
    });

    it('should deny PATIENT creating a branch even with a stolen clinic id', async () => {
      const { status } = await authJson(`/clinics/${clinicAId}/branches`, patientToken, {
        method: 'POST',
        body: JSON.stringify({ name: 'Illegal', code: 'X' }),
      });
      assert.strictEqual(status, 403);
    });

    it('should allow ADMIN to add receptionist and doctor staff to clinic A', async () => {
      const receptionist = [...mockPrisma.users.values()].find((u) => u.phone === '+251955000003')!;
      const doctorUser = [...mockPrisma.users.values()].find((u) => u.phone === '+251955000004')!;

      const recRes = await authJson(`/clinics/${clinicAId}/staff`, adminAToken, {
        method: 'POST',
        body: JSON.stringify({
          userId: receptionist.id,
          role: Role.RECEPTIONIST,
          jobTitle: 'Front Desk',
          employeeCode: 'EMP-REC-01',
        }),
      });
      assert.strictEqual(recRes.status, 201);

      const docStaff = await authJson(`/clinics/${clinicAId}/staff`, adminAToken, {
        method: 'POST',
        body: JSON.stringify({
          userId: doctorUser.id,
          role: Role.DOCTOR,
          jobTitle: 'Consultant',
          employeeCode: 'EMP-DOC-01',
        }),
      });
      assert.strictEqual(docStaff.status, 201);
    });

    it('should deny RECEPTIONIST from creating staff (RBAC)', async () => {
      const { status } = await authJson(`/clinics/${clinicAId}/staff`, receptionistAToken, {
        method: 'POST',
        body: JSON.stringify({
          phone: '+251955000099',
          firstName: 'New',
          lastName: 'Hire',
          role: Role.RECEPTIONIST,
        }),
      });
      assert.strictEqual(status, 403);
    });

    it('should allow RECEPTIONIST to list staff in their own clinic', async () => {
      const { status, json } = await authJson(`/clinics/${clinicAId}/staff`, receptionistAToken);
      assert.strictEqual(status, 200);
      const data = json.data as unknown[];
      assert.ok(data.length >= 2);
    });

    it('should deny DOCTOR from listing staff (RBAC)', async () => {
      const { status } = await authJson(`/clinics/${clinicAId}/staff`, doctorAToken);
      assert.strictEqual(status, 403);
    });

    it('should allow ADMIN to create a doctor with specialization', async () => {
      const staff = [...mockPrisma.staffMembers.values()].find((s) => s.userId === doctorAUserId)!;
      const { status, json } = await authJson(`/clinics/${clinicAId}/doctors`, adminAToken, {
        method: 'POST',
        body: JSON.stringify({
          staffMemberId: staff.id,
          specialization: 'Cardiology',
          licenseNumber: 'FMHACA-DOC-A1',
          consultationFee: 900,
        }),
      });
      assert.strictEqual(status, 201);
      const data = json.data as Record<string, unknown>;
      assert.strictEqual(data.specialization, 'Cardiology');
      assert.strictEqual(data.availabilityStatus, DoctorAvailabilityStatus.AVAILABLE);
      doctorAId = data.id as string;
    });

    it('should create a doctor in clinic B that clinic A cannot see', async () => {
      const { status, json } = await authJson(`/clinics/${clinicBId}/doctors`, adminBToken, {
        method: 'POST',
        body: JSON.stringify({
          phone: '+251955000088',
          firstName: 'Other',
          lastName: 'Doctor',
          password: 'SecurePassword123!',
          specialization: 'Dermatology',
          licenseNumber: 'FMHACA-DOC-B1',
        }),
      });
      assert.strictEqual(status, 201);
      doctorBId = (json.data as Record<string, unknown>).id as string;

      const listA = await authJson(`/clinics/${clinicAId}/doctors`, adminAToken);
      const doctorsA = listA.json.data as Array<{ id: string }>;
      assert.ok(doctorsA.every((d) => d.id !== doctorBId));
    });

    it('should 404 when requesting another clinic doctor under own clinic path', async () => {
      const { status } = await authJson(`/clinics/${clinicAId}/doctors/${doctorBId}`, adminAToken);
      assert.strictEqual(status, 404);
    });

    it('should let a doctor update own availability but not specialization', async () => {
      const avail = await authJson(
        `/clinics/${clinicAId}/doctors/${doctorAId}/availability`,
        doctorAToken,
        {
          method: 'PATCH',
          body: JSON.stringify({ availabilityStatus: DoctorAvailabilityStatus.BUSY }),
        },
      );
      assert.strictEqual(avail.status, 200);
      assert.strictEqual(
        (avail.json.data as Record<string, unknown>).availabilityStatus,
        DoctorAvailabilityStatus.BUSY,
      );

      const spec = await authJson(`/clinics/${clinicAId}/doctors/${doctorAId}`, doctorAToken, {
        method: 'PATCH',
        body: JSON.stringify({ specialization: 'Neurology' }),
      });
      assert.strictEqual(spec.status, 403);
    });

    it('should allow ADMIN to update doctor specialization', async () => {
      const { status, json } = await authJson(
        `/clinics/${clinicAId}/doctors/${doctorAId}`,
        adminAToken,
        {
          method: 'PATCH',
          body: JSON.stringify({ specialization: 'Interventional Cardiology' }),
        },
      );
      assert.strictEqual(status, 200);
      assert.strictEqual(
        (json.data as Record<string, unknown>).specialization,
        'Interventional Cardiology',
      );
    });

    it('should deny RECEPTIONIST from changing doctor availability (RBAC)', async () => {
      const { status } = await authJson(
        `/clinics/${clinicAId}/doctors/${doctorAId}/availability`,
        receptionistAToken,
        {
          method: 'PATCH',
          body: JSON.stringify({ availabilityStatus: DoctorAvailabilityStatus.ON_LEAVE }),
        },
      );
      assert.strictEqual(status, 403);
    });

    it('should reject invalid availability status', async () => {
      const { status } = await authJson(
        `/clinics/${clinicAId}/doctors/${doctorAId}/availability`,
        adminAToken,
        {
          method: 'PATCH',
          body: JSON.stringify({ availabilityStatus: 'SLEEPING' }),
        },
      );
      assert.strictEqual(status, 400);
    });
  });
});
