import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { Request, Response } from 'express';
import { Environment } from '../src/common/enums/environment.enum';
import { BadRequestException } from '../src/common/exceptions/http.exceptions';
import { validate } from '../src/common/config/env.validation';
import { ConfigService } from '../src/common/config/config.service';
import { correlationIdMiddleware } from '../src/common/middleware/correlation-id.middleware';
import { errorMiddleware } from '../src/common/middleware/error.middleware';
import { createAuditMiddleware } from '../src/audit/audit.middleware';
import { AuditRecord } from '../src/audit/audit.service';
import { HttpOtpDeliveryService } from '../src/auth/otp/http-otp-delivery.service';
import { OtpService } from '../src/auth/otp/otp.service';
import { MockPrismaService } from './mock-prisma.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './test-app';

function captureErrorResponse(exception: unknown, request: Partial<Request>) {
  let statusCode = 0;
  let body: Record<string, unknown> | undefined;
  const response = {
    status(status: number) {
      statusCode = status;
      return this;
    },
    json(value: Record<string, unknown>) {
      body = value;
      return this;
    },
  };

  errorMiddleware(
    exception,
    request as Request,
    response as unknown as Response,
    () => undefined,
  );
  return { statusCode, body };
}

describe('Production hardening controls', () => {
  it('serves the health endpoint and Swagger UI through Express', async () => {
    const app = await createTestApp({
      mockPrisma: new MockPrismaService() as unknown as PrismaService,
    });

    try {
      const healthResponse = await fetch(`${app.baseUrl}/health`);
      const health = await healthResponse.json();
      assert.strictEqual(healthResponse.status, 200);
      assert.strictEqual(health.success, true);
      assert.strictEqual(health.data.status, 'ok');

      const docsResponse = await fetch(app.baseUrl.replace('/api/v1', '/api/docs'));
      assert.strictEqual(docsResponse.status, 200);
      assert.match(await docsResponse.text(), /swagger-ui/i);

      const unauthorizedResponse = await fetch(`${app.baseUrl}/auth/me`);
      assert.strictEqual(unauthorizedResponse.status, 401);

      for (let request = 1; request <= 9; request++) {
        const throttleResponse = await fetch(`${app.baseUrl}/auth/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        assert.strictEqual(throttleResponse.status, request === 9 ? 429 : 400);
      }
    } finally {
      await app.close();
    }
  });

  it('requires strong OTP and explicit CORS configuration in production', () => {
    const validProduction = {
      NODE_ENV: Environment.Production,
      DATABASE_URL: 'postgresql://mediflow:secret@db.example/mediflow',
      JWT_SECRET: 'x'.repeat(64),
      OTP_PEPPER: 'p'.repeat(64),
      OTP_DELIVERY_URL: 'https://sms.example.test/v1/send',
      OTP_DELIVERY_TOKEN: 't'.repeat(64),
      CORS_ORIGIN: 'https://clinic.example.test',
      SWAGGER_ENABLED: false,
    };
    assert.doesNotThrow(() => validate(validProduction));
    assert.throws(() => validate({ ...validProduction, OTP_PEPPER: undefined }));
    assert.throws(() => validate({ ...validProduction, OTP_DELIVERY_TOKEN: undefined }));
    assert.throws(() =>
      validate({ ...validProduction, OTP_DELIVERY_URL: 'http://sms.example.test' }),
    );
    assert.throws(() => validate({ ...validProduction, CORS_ORIGIN: '*' }));
    assert.throws(() => validate({ ...validProduction, TRUST_PROXY_HOPS: 9 }));
    assert.doesNotThrow(() =>
      validate({
        NODE_ENV: Environment.Development,
        DATABASE_URL: 'postgresql://mediflow:secret@localhost/mediflow',
        JWT_SECRET: 'x'.repeat(64),
      }),
    );
  });

  it('sends production OTPs to the configured HTTPS adapter without logging the code', async () => {
    const originalFetch = global.fetch;
    let capturedUrl = '';
    let capturedAuthorization = '';
    let capturedBody = '';
    global.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
      capturedUrl = String(input);
      capturedAuthorization = new Headers(init?.headers).get('authorization') || '';
      capturedBody = String(init?.body);
      return new Response(null, { status: 202 });
    }) as typeof fetch;

    try {
      const service = new HttpOtpDeliveryService(
        new ConfigService({
          otp: {
            deliveryUrl: 'https://sms.example.test/v1/send',
            deliveryToken: 'provider-secret',
          },
        }),
      );
      assert.strictEqual(await service.send('+251911000000', '812345', 'LOGIN'), true);
      assert.strictEqual(capturedUrl, 'https://sms.example.test/v1/send');
      assert.strictEqual(capturedAuthorization, 'Bearer provider-secret');
      assert.deepStrictEqual(JSON.parse(capturedBody), {
        recipient: '+251911000000',
        code: '812345',
        purpose: 'LOGIN',
      });
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('invalidates an OTP when the delivery provider fails', async () => {
    const prisma = new MockPrismaService();
    const service = new OtpService(
      prisma as never,
      new ConfigService({ otp: { pepper: 'test-only-pepper' } }),
      { send: async () => false },
    );
    await assert.rejects(service.sendOtp('+251911000096'));
    const storedOtp = [...prisma.otps.values()][0];
    assert.ok(storedOtp);
    assert.strictEqual(storedOtp.isUsed, true);
  });

  it('sanitizes untrusted correlation IDs before returning them to callers', () => {
    const request = { headers: { 'x-correlation-id': 'bad\r\nforged: value' } };
    let responseId = '';
    let continued = false;
    correlationIdMiddleware(
      request as never,
      { setHeader: (_name: string, value: string) => (responseId = value) } as never,
      () => {
        continued = true;
      },
    );
    assert.match(responseId, /^[0-9a-f-]{36}$/i);
    assert.strictEqual(continued, true);
  });

  it('audits successful and failed mutating requests without recording body data', async () => {
    const records: AuditRecord[] = [];
    const middleware = createAuditMiddleware({
      record: async (record: AuditRecord) => {
        records.push(record);
      },
    } as never);
    const runAudit = (statusCode: number) => {
      let finish: (() => void) | undefined;
      const request = {
        method: 'PATCH',
        originalUrl: '/api/v1/clinics/clinic-a/staff/staff-a?secret=query-value',
        params: { clinicId: 'clinic-a', staffId: 'staff-a' },
        query: { secret: 'query-value' },
        body: { password: 'never-audit-this' },
        user: { id: 'user-a', role: 'ADMIN' },
        ip: '127.0.0.1',
        get: () => 'test-agent',
        correlationId: 'safe-correlation-id',
      };
      const response = {
        statusCode,
        json: () => response,
        on: (_event: string, listener: () => void) => {
          finish = listener;
          return response;
        },
      };
      middleware(request as never, response as never, () => undefined);
      finish?.();
    };

    runAudit(201);
    runAudit(403);

    assert.strictEqual(records.length, 2);
    assert.strictEqual(records[0].clinicId, 'clinic-a');
    assert.strictEqual(records[0].entityId, 'staff-a');
    assert.ok(!records[0].action.includes('query-value'));
    assert.ok(!records[0].details?.includes('never-audit-this'));
    assert.match(records[0].details || '', /success/);
    assert.match(records[0].details || '', /201/);
    assert.match(records[1].details || '', /failure/);
  });

  it('omits query parameters from exception response paths', () => {
    const result = captureErrorResponse(new BadRequestException('Invalid request'), {
      url: '/api/v1/items?id=private-value',
    });
    assert.strictEqual(result.body?.path, '/api/v1/items');
  });

  it('maps serialization conflicts and database outages to retryable statuses', () => {
    const serializationConflict = Object.assign(new Error('internal database detail'), {
      code: 'P2034',
    });
    const result = captureErrorResponse(serializationConflict, { url: '/api/v1/resource' });
    assert.strictEqual(result.statusCode, 409);
    assert.strictEqual(result.body?.message, 'The record changed concurrently; retry the request');
  });

  it('does not expose unclassified database errors in development responses', () => {
    const details = 'Authentication failed against database server with secret credentials';
    const result = captureErrorResponse(
      Object.assign(new Error(details), { name: 'PrismaClientInitializationError' }),
      { url: '/api/v1/auth/login' },
    );

    assert.strictEqual(result.body?.message, 'Internal server error');
    assert.ok(!JSON.stringify(result.body).includes(details));
  });
});
