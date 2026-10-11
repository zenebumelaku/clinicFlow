import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, of, throwError } from 'rxjs';
import { Environment } from '../src/common/enums/environment.enum';
import { validate } from '../src/common/config/env.validation';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { CorrelationIdMiddleware } from '../src/common/middleware/correlation-id.middleware';
import { AuditInterceptor } from '../src/audit/audit.interceptor';
import { AuditRecord } from '../src/audit/audit.service';
import { HttpOtpDeliveryService } from '../src/auth/otp/http-otp-delivery.service';
import { OtpService } from '../src/auth/otp/otp.service';
import { MockPrismaService } from './mock-prisma.service';

describe('Production hardening controls', () => {
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
    new CorrelationIdMiddleware().use(
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
    const interceptor = new AuditInterceptor({
      record: async (record: AuditRecord) => {
        records.push(record);
      },
    } as never);
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
    const response = { statusCode: 201 };
    const context = {
      getType: () => 'http',
      switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }),
    } as unknown as ExecutionContext;

    await firstValueFrom(
      interceptor.intercept(context, { handle: () => of({ id: 'staff-a' }) } as CallHandler),
    );
    await assert.rejects(
      firstValueFrom(
        interceptor.intercept(context, {
          handle: () => throwError(() => new ForbiddenException()),
        } as CallHandler),
      ),
    );

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
    let responseBody: Record<string, unknown> | undefined;
    const request = { url: '/api/v1/items?id=private-value', originalUrl: undefined };
    const response = {
      status: () => response,
      json: (body: Record<string, unknown>) => {
        responseBody = body;
        return response;
      },
    };
    const host = {
      switchToHttp: () => ({ getResponse: () => response, getRequest: () => request }),
    } as never;
    new AllExceptionsFilter().catch(new BadRequestException('Invalid request'), host);
    assert.strictEqual(responseBody?.path, '/api/v1/items');
  });

  it('maps serialization conflicts and database outages to retryable statuses', () => {
    let responseStatus = 0;
    let responseBody: Record<string, unknown> | undefined;
    const response = {
      status: (status: number) => {
        responseStatus = status;
        return response;
      },
      json: (body: Record<string, unknown>) => {
        responseBody = body;
        return response;
      },
    };
    const request = { url: '/api/v1/resource' };
    const host = {
      switchToHttp: () => ({ getResponse: () => response, getRequest: () => request }),
    } as never;
    const serializationConflict = Object.assign(new Error('internal database detail'), {
      code: 'P2034',
    });
    new AllExceptionsFilter().catch(serializationConflict, host);
    assert.strictEqual(responseStatus, 409);
    assert.strictEqual(responseBody?.message, 'The record changed concurrently; retry the request');
  });

  it('does not expose unclassified database errors in development responses', () => {
    const details = 'Authentication failed against database server with secret credentials';
    let responseBody: Record<string, unknown> | undefined;
    const response = {
      status: () => response,
      json: (body: Record<string, unknown>) => {
        responseBody = body;
        return response;
      },
    };
    const request = { url: '/api/v1/auth/login' };
    const host = {
      switchToHttp: () => ({ getResponse: () => response, getRequest: () => request }),
    } as never;

    new AllExceptionsFilter().catch(
      Object.assign(new Error(details), { name: 'PrismaClientInitializationError' }),
      host,
    );

    assert.strictEqual(responseBody?.message, 'Internal server error');
    assert.ok(!JSON.stringify(responseBody).includes(details));
  });
});
