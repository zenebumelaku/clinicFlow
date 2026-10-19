import { describe, it, before, after } from 'node:test';
import * as assert from 'node:assert';
import { Role } from '@prisma/client';
import { PrismaService } from '../src/prisma/prisma.service';
import { TokenService } from '../src/auth/token.service';
import { MockPrismaService } from './mock-prisma.service';
import { createTestApp, TestAppInstance } from './test-app';

describe('ClinicFlow Part 2: Authentication & Authorization Tests', () => {
  let app: TestAppInstance;
  let baseUrl: string;
  let mockPrisma: MockPrismaService;
  let tokenService: TokenService;

  before(async () => {
    mockPrisma = new MockPrismaService();

    await mockPrisma.clinic.create({
      data: {
        name: 'Addis Health Center',
        slug: 'addis-health-center',
        phone: '+251911000000',
        isActive: true,
      },
    });

    app = await createTestApp({ mockPrisma: mockPrisma as unknown as PrismaService });
    baseUrl = app.baseUrl;
    tokenService = app.services.token;
  });

  after(async () => {
    await app.close();
  });

  // =========================================================================
  // Test 1: Successful Authentication (registration, login, me, refresh, logout)
  // =========================================================================
  describe('1. Successful Authentication', () => {
    const testPhone = '+251911000001';
    let receivedAccessToken: string;
    let receivedRefreshToken: string;

    it('should register a patient account and return access token + refresh token + user profile', async () => {
      const res = await fetch(`${baseUrl}/auth/register-patient`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: testPhone,
          password: 'patient-password-123',
          firstName: 'Abebe',
          lastName: 'Bikila',
        }),
      });

      assert.strictEqual(res.status, 201);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.ok(json.data.accessToken);
      assert.ok(json.data.refreshToken);
      assert.strictEqual(json.data.user.phone, testPhone.toLowerCase());
      assert.strictEqual(json.data.user.role, Role.PATIENT);
      assert.ok(
        [...mockPrisma.auditLogs.values()].some((log) => log.action === 'AUTH_REGISTER_PATIENT'),
        'Successful registration should be audited',
      );

      receivedAccessToken = json.data.accessToken;
      receivedRefreshToken = json.data.refreshToken;
    });

    it('should log in using password and return new session tokens', async () => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: testPhone,
          password: 'patient-password-123',
        }),
      });

      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.ok(json.data.accessToken);
      assert.ok(json.data.refreshToken);
      assert.strictEqual(json.data.user.phone, testPhone.toLowerCase());

      receivedAccessToken = json.data.accessToken;
      receivedRefreshToken = json.data.refreshToken;
    });

    it('should access protected /auth/me endpoint using JWT bearer token', async () => {
      const res = await fetch(`${baseUrl}/auth/me`, {
        headers: {
          Authorization: `Bearer ${receivedAccessToken}`,
        },
      });

      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.data.phone, testPhone.toLowerCase());
      assert.strictEqual(json.data.role, Role.PATIENT);
    });

    it('should successfully rotate tokens via /auth/refresh', async () => {
      const res = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: receivedRefreshToken }),
      });

      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.ok(json.data.accessToken);
      assert.ok(json.data.refreshToken);
      assert.notStrictEqual(json.data.refreshToken, receivedRefreshToken, 'Token must be rotated');

      // Update to new rotated token
      receivedRefreshToken = json.data.refreshToken;
    });

    it('should log out and revoke the refresh token', async () => {
      const res = await fetch(`${baseUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${receivedAccessToken}`,
        },
        body: JSON.stringify({ refreshToken: receivedRefreshToken }),
      });

      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.data.success, true);

      // Attempting to refresh with the revoked token must fail with 401
      const refreshRes = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: receivedRefreshToken }),
      });

      assert.strictEqual(refreshRes.status, 401);
    });
  });

  describe('Refresh token concurrency', () => {
    it('allows only one concurrent rotation of the same refresh token', async () => {
      const user = [...mockPrisma.users.values()].find(
        (record) => record.phone === '+251911000001',
      );
      assert.ok(user);
      const tokenPair = await tokenService.generateTokens(user);
      const results = await Promise.all([
        fetch(`${baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: tokenPair.refreshToken }),
        }),
        fetch(`${baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: tokenPair.refreshToken }),
        }),
      ]);
      assert.deepStrictEqual(results.map((response) => response.status).sort(), [200, 401]);
      assert.ok(
        [...mockPrisma.refreshTokens.values()].every(
          (token) => token.userId !== user.id || token.isRevoked,
        ),
      );
    });
  });

  describe('Password login enumeration protection', () => {
    it('returns the same unauthorized response for known and unknown accounts', async () => {
      const known = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: '+251911000001', password: 'NotThePassword123' }),
      });
      const unknown = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: '+251911000097', password: 'NotThePassword123' }),
      });
      const knownBody = await known.json();
      const unknownBody = await unknown.json();
      assert.strictEqual(known.status, 401);
      assert.strictEqual(unknown.status, 401);
      assert.strictEqual(knownBody.message, unknownBody.message);
    });
  });

  describe('Clinic administrator registration', () => {
    it('creates a clinic administrator and establishes membership', async () => {
      const phone = '+251911000050';
      const registrationResponse = await fetch(`${baseUrl}/auth/register-clinic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          email: 'owner@newclinic.et',
          password: 'clinic-password-123',
          firstName: 'Clinic',
          lastName: 'Owner',
          clinicName: 'New Health Center',
          clinicCity: 'Addis Ababa',
        }),
      });

      assert.strictEqual(registrationResponse.status, 201);
      const registration = await registrationResponse.json();
      assert.strictEqual(registration.data.user.role, Role.ADMIN);
      assert.ok(registration.data.accessToken);
      assert.ok(registration.data.refreshToken);

      const user = mockPrisma.users.get(registration.data.user.id);
      assert.ok(user?.passwordHash, 'New accounts should have a password hash');
      assert.notStrictEqual(user.passwordHash, 'clinic-password-123');

      const clinic = [...mockPrisma.clinics.values()].find(
        (record) => record.name === 'New Health Center',
      );
      assert.ok(clinic);
      assert.strictEqual(clinic.city, 'Addis Ababa');
      assert.ok(
        [...mockPrisma.staffMembers.values()].some(
          (membership) => membership.clinicId === clinic.id && membership.userId === user.id,
        ),
        'The new administrator should be linked to the clinic',
      );

      const clinicsResponse = await fetch(`${baseUrl}/clinics?page=1&limit=100`, {
        headers: { Authorization: `Bearer ${registration.data.accessToken}` },
      });
      assert.strictEqual(clinicsResponse.status, 200);
      const clinics = await clinicsResponse.json();
      assert.ok(clinics.data.some((record: { id: string }) => record.id === clinic.id));

      const resetResponse = await fetch(`${baseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: phone,
          password: 'new-clinic-password-456',
        }),
      });
      assert.strictEqual(resetResponse.status, 200);

      const userRefreshTokens = [...mockPrisma.refreshTokens.values()].filter(
        (token) => token.userId === user.id,
      );
      assert.ok(userRefreshTokens.every((token) => token.isRevoked));
      const oldPasswordLogin = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: phone, password: 'clinic-password-123' }),
      });
      assert.strictEqual(oldPasswordLogin.status, 401);
      const newPasswordLogin = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: phone, password: 'new-clinic-password-456' }),
      });
      assert.strictEqual(newPasswordLogin.status, 200);
    });
  });

  // =========================================================================
  // Test 2: Unauthorized Requests
  // =========================================================================
  describe('2. Unauthorized Request Protection', () => {
    it('should reject request without Authorization header with 401', async () => {
      const res = await fetch(`${baseUrl}/auth/me`);
      assert.strictEqual(res.status, 401);
    });

    it('should reject request with malformed or invalid token with 401', async () => {
      const res = await fetch(`${baseUrl}/auth/me`, {
        headers: {
          Authorization: 'Bearer invalid.bogus.token',
        },
      });
      assert.strictEqual(res.status, 401);
    });
  });

  // =========================================================================
  // Test 5: Role Restrictions & RBAC
  // =========================================================================
  describe('5. Role-Based Access Control (RBAC) Enforcement', () => {
    let patientToken: string;
    let doctorToken: string;
    let receptionistToken: string;
    let adminToken: string;

    before(async () => {
      // Create user records with each role
      const patient = await mockPrisma.user.create({
        data: {
          phone: '+251944000001',
          role: Role.PATIENT,
          firstName: 'Patient',
          lastName: 'User',
        },
      });
      const doctor = await mockPrisma.user.create({
        data: { phone: '+251944000002', role: Role.DOCTOR, firstName: 'Doctor', lastName: 'User' },
      });
      const receptionist = await mockPrisma.user.create({
        data: {
          phone: '+251944000003',
          role: Role.RECEPTIONIST,
          firstName: 'Recept',
          lastName: 'User',
        },
      });
      const admin = await mockPrisma.user.create({
        data: { phone: '+251944000004', role: Role.ADMIN, firstName: 'Admin', lastName: 'User' },
      });

      // Generate JWT tokens for each role
      patientToken = (await tokenService.generateTokens(patient)).accessToken;
      doctorToken = (await tokenService.generateTokens(doctor)).accessToken;
      receptionistToken = (await tokenService.generateTokens(receptionist)).accessToken;
      adminToken = (await tokenService.generateTokens(admin)).accessToken;
    });

    it('should deny PATIENT access to ADMIN-only endpoint (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/auth/test/admin-only`, {
        headers: { Authorization: `Bearer ${patientToken}` },
      });
      assert.strictEqual(res.status, 403);
    });

    it('should deny DOCTOR access to ADMIN-only endpoint (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/auth/test/admin-only`, {
        headers: { Authorization: `Bearer ${doctorToken}` },
      });
      assert.strictEqual(res.status, 403);
    });

    it('should allow ADMIN access to ADMIN-only endpoint (200 OK)', async () => {
      const res = await fetch(`${baseUrl}/auth/test/admin-only`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
    });

    it('should deny RECEPTIONIST access to DOCTOR-only endpoint (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/auth/test/doctor-only`, {
        headers: { Authorization: `Bearer ${receptionistToken}` },
      });
      assert.strictEqual(res.status, 403);
    });

    it('should allow DOCTOR access to DOCTOR-only endpoint (200 OK)', async () => {
      const res = await fetch(`${baseUrl}/auth/test/doctor-only`, {
        headers: { Authorization: `Bearer ${doctorToken}` },
      });
      assert.strictEqual(res.status, 200);
    });

    it('should deny PATIENT access to RECEPTIONIST-only endpoint (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/auth/test/receptionist-only`, {
        headers: { Authorization: `Bearer ${patientToken}` },
      });
      assert.strictEqual(res.status, 403);
    });

    it('should allow RECEPTIONIST access to RECEPTIONIST-only endpoint (200 OK)', async () => {
      const res = await fetch(`${baseUrl}/auth/test/receptionist-only`, {
        headers: { Authorization: `Bearer ${receptionistToken}` },
      });
      assert.strictEqual(res.status, 200);
    });
  });
});
