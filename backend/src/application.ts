import 'reflect-metadata';
import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { createServices, AppServices } from './services';
import { correlationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { loggingMiddleware } from './common/middleware/logging.middleware';
import { responseEnvelopeMiddleware } from './common/middleware/response-envelope.middleware';
import { errorMiddleware } from './common/middleware/error.middleware';
import { createRateLimiter } from './common/middleware/rate-limiter.middleware';
import { createAuditMiddleware } from './audit/audit.middleware';
import { swaggerDocument } from './swagger/swagger.document';
import { NotFoundException } from './common/exceptions/http.exceptions';

import { createHealthRouter } from './health/health.router';
import { createAuthRouter } from './auth/auth.router';
import { createClinicsRouter } from './clinics/clinics.router';
import { createBranchesRouter } from './branches/branches.router';
import { createStaffRouter } from './staff/staff.router';
import { createDoctorsRouter, createDoctorSelfRouter } from './doctors/doctors.router';
import { createPatientsRouter } from './patients/patients.router';
import { createAppointmentsRouter } from './appointments/appointments.router';
import { createQueueRouter } from './queue/queue.router';
import { createPaymentsRouter } from './payments/payments.router';
import { createNotificationsRouter } from './notifications/notifications.router';
import { createReportsRouter } from './reports/reports.router';
import { PrismaService } from './prisma/prisma.service';
import { ConfigService } from './common/config/config.service';

export interface CreateAppOptions {
  prisma?: PrismaService;
  configService?: ConfigService;
}

export function createApp(options?: CreateAppOptions): { app: Express; services: AppServices } {
  const services = createServices({
    prisma: options?.prisma,
    config: options?.configService,
  });
  const config = services.config;

  const app = express();

  const nodeEnv = config.get<string>('nodeEnv', 'development');
  const apiPrefix = config.get<string>('apiPrefix', 'api/v1');
  const swaggerPath = config.get<string>('swaggerPath', 'api/docs');
  const corsOrigin = config.get<string>('cors.origin', '*');
  const trustProxyHops = config.get<number>('trustProxyHops', 0);
  const swaggerEnabledEnv = config.get<string | boolean>('swaggerEnabled');
  const swaggerEnabled =
    swaggerEnabledEnv === true ||
    swaggerEnabledEnv === 'true' ||
    (swaggerEnabledEnv === undefined && nodeEnv !== 'production');

  if (trustProxyHops > 0) {
    app.set('trust proxy', trustProxyHops);
  }

  app.use(
    helmet({
      contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
      hidePoweredBy: true,
    }),
  );

  const origin =
    corsOrigin === '*'
      ? nodeEnv === 'production'
        ? false
        : true
      : corsOrigin.split(',').map((value) => value.trim());

  app.use(
    cors({
      origin,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id'],
    }),
  );

  app.use(
    express.json({
      verify: (request, _response, body) => {
        if (request.url?.endsWith('/payments/chapa/webhook')) {
          Object.assign(request, { rawBody: body });
        }
      },
    }),
  );
  app.use(express.urlencoded({ extended: true }));

  app.use(correlationIdMiddleware);
  app.use(loggingMiddleware);
  app.use(responseEnvelopeMiddleware);
  app.use(createAuditMiddleware(services.audit));

  const throttleLimit = config.get<number>('throttle.limit', 100);
  const throttleTtl = config.get<number>('throttle.ttl', 60000);
  app.use(createRateLimiter({ limit: throttleLimit, ttl: throttleTtl }));

  if (swaggerEnabled) {
    const cleanSwaggerPath = '/' + swaggerPath.replace(/^\//, '').replace(/\/$/, '');
    app.use(cleanSwaggerPath, swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  }

  const cleanPrefix = '/' + apiPrefix.replace(/^\//, '').replace(/\/$/, '');

  app.use(cleanPrefix, createHealthRouter(services.prisma));
  app.use(`${cleanPrefix}/auth`, createAuthRouter(services));
  app.use(`${cleanPrefix}/clinics`, createClinicsRouter(services));
  app.use(`${cleanPrefix}/clinics/:clinicId/branches`, createBranchesRouter(services));
  app.use(`${cleanPrefix}/clinics/:clinicId/staff`, createStaffRouter(services));
  app.use(`${cleanPrefix}/clinics/:clinicId/doctors`, createDoctorsRouter(services));
  app.use(`${cleanPrefix}/doctors`, createDoctorSelfRouter(services));
  app.use(`${cleanPrefix}/patients`, createPatientsRouter(services));
  app.use(`${cleanPrefix}/appointments`, createAppointmentsRouter(services));
  app.use(`${cleanPrefix}/queue`, createQueueRouter(services));
  app.use(`${cleanPrefix}/payments`, createPaymentsRouter(services));
  app.use(`${cleanPrefix}/notifications`, createNotificationsRouter(services));
  app.use(`${cleanPrefix}/reports`, createReportsRouter(services));

  app.use((req, _res, next) => {
    next(new NotFoundException(`Cannot ${req.method} ${req.path}`));
  });

  app.use(errorMiddleware);

  return { app, services };
}
