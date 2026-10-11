import { describe, it, before, after } from 'node:test';
import * as assert from 'node:assert';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { Role } from '@prisma/client';
import configuration from '../src/common/config/configuration';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthModule } from '../src/auth/auth.module';
import { CommonModule } from '../src/common/common.module';
import { ConsoleOtpDeliveryService } from '../src/auth/otp/console-otp-delivery.service';
import { TokenService } from '../src/auth/token.service';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { MockPrismaService } from './mock-prisma.service';

describe('MediFlow ET Part 2: Authentication & Authorization Tests', () => {
  let app: INestApplication;
  let baseUrl: string;
  let mockPrisma: MockPrismaService;
  let otpDelivery: ConsoleOtpDeliveryService;
  let tokenService: TokenService;

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
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new TransformInterceptor());

    await app.init();
    await app.listen(0);

    const address = app.getHttpServer().address();
    const port = typeof address === 'string' ? 3000 : address.port;
    baseUrl = `http://localhost:${port}/api/v1`;

    otpDelivery = app.get<ConsoleOtpDeliveryService>(ConsoleOtpDeliveryService);
    tokenService = app.get<TokenService>(TokenService);
  });

  after(async () => {
    await app.close();
  });

  // =========================================================================
  // Test 1: Successful Authentication (OTP flow, me, refresh, logout)
  // =========================================================================
  describe('1. Successful Authentication', () => {
    const testPhone = '+251911000001';
    let receivedAccessToken: string;
    let receivedRefreshToken: string;

    it('should send an OTP code successfully', async () => {
      const res = await fetch(`${baseUrl}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: testPhone }),
      });

      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.ok(json.data.cooldownSeconds > 0);

      const dispatchedCode = otpDelivery.getLatestCode(testPhone.toLowerCase());
      assert.ok(dispatchedCode, 'An OTP code should have been dispatched');
      assert.strictEqual(dispatchedCode.length, 6);
    });

    it('should verify OTP and return access token + refresh token + user profile', async () => {
      const code = otpDelivery.getLatestCode(testPhone.toLowerCase())!;

      const res = await fetch(`${baseUrl}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: testPhone,
          code,
          firstName: 'Abebe',
          lastName: 'Bikila',
        }),
      });

      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.ok(json.data.accessToken);
      assert.ok(json.data.refreshToken);
      assert.strictEqual(json.data.user.phone, testPhone.toLowerCase());
      assert.strictEqual(json.data.user.role, Role.PATIENT);
      assert.ok(
        [...mockPrisma.auditLogs.values()].some((log) => log.action === 'AUTH_VERIFY_OTP'),
        'Successful OTP authentication should be audited',
      );

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

  describe('OTP request concurrency', () => {
    it('enforces one cooldown winner and one successful verification', async () => {
      const identifier = '+251911000099';
      const sendResults = await Promise.all([
        fetch(`${baseUrl}/auth/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier }),
        }),
        fetch(`${baseUrl}/auth/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier }),
        }),
      ]);
      assert.deepStrictEqual(sendResults.map((response) => response.status).sort(), [200, 400]);

      const code = otpDelivery.getLatestCode(identifier)!;
      const verifyResults = await Promise.all([
        fetch(`${baseUrl}/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, code }),
        }),
        fetch(`${baseUrl}/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, code }),
        }),
      ]);
      assert.deepStrictEqual(verifyResults.map((response) => response.status).sort(), [200, 400]);
    });
  });

  describe('Password login enumeration protection', () => {
    it('returns the same unauthorized response for unknown and OTP-only accounts', async () => {
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

  // =========================================================================
  // Test 2: Invalid OTP & Brute-force Attempt Lockout
  // =========================================================================
  describe('2. Invalid OTP Handling & Rate Limiting', () => {
    const testPhone = '+251922000002';

    it('should reject incorrect OTP code and report remaining attempts', async () => {
      await fetch(`${baseUrl}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: testPhone }),
      });

      // Submit incorrect code (attempt 1)
      const res1 = await fetch(`${baseUrl}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: testPhone, code: '000000' }),
      });

      assert.strictEqual(res1.status, 400);
      const json1 = await res1.json();
      assert.match(json1.message, /Incorrect verification code/);
    });

    it('should invalidate OTP after 3 consecutive wrong attempts', async () => {
      // Attempt 2
      await fetch(`${baseUrl}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: testPhone, code: '111111' }),
      });

      // Attempt 3
      const res3 = await fetch(`${baseUrl}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: testPhone, code: '222222' }),
      });

      assert.strictEqual(res3.status, 400);
      const json3 = await res3.json();
      assert.match(json3.message, /Maximum attempts reached/);

      // Even the correct code now fails because code is locked
      const validCode = otpDelivery.getLatestCode(testPhone.toLowerCase())!;
      const resAfterLock = await fetch(`${baseUrl}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: testPhone, code: validCode }),
      });

      assert.strictEqual(resAfterLock.status, 400);
    });
  });

  // =========================================================================
  // Test 3: Expired OTP
  // =========================================================================
  describe('3. Expired OTP Rejection', () => {
    const testPhone = '+251933000003';

    it('should reject verification if the OTP has expired', async () => {
      await fetch(`${baseUrl}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: testPhone }),
      });

      const code = otpDelivery.getLatestCode(testPhone.toLowerCase())!;

      // Manually simulate expiration by setting expiresAt to the past in the database
      for (const otp of mockPrisma.otps.values()) {
        if (otp.identifier === testPhone.toLowerCase()) {
          otp.expiresAt = new Date(Date.now() - 10000); // 10 seconds ago
        }
      }

      const res = await fetch(`${baseUrl}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: testPhone, code }),
      });

      assert.strictEqual(res.status, 400);
      const json = await res.json();
      assert.match(json.message, /expired/i);
    });
  });

  // =========================================================================
  // Test 4: Unauthorized Requests
  // =========================================================================
  describe('4. Unauthorized Request Protection', () => {
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
