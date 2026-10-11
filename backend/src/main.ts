import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port', 3000);
  const nodeEnv = configService.get<string>('nodeEnv', 'development');
  const apiPrefix = configService.get<string>('apiPrefix', 'api/v1');
  const swaggerPath = configService.get<string>('swaggerPath', 'api/docs');
  const corsOrigin = configService.get<string>('cors.origin', '*');
  const trustProxyHops = configService.get<number>('trustProxyHops', 0);
  const swaggerEnabledEnv = configService.get<string | boolean>('swaggerEnabled');
  const swaggerEnabled =
    swaggerEnabledEnv === true ||
    swaggerEnabledEnv === 'true' ||
    (swaggerEnabledEnv === undefined && nodeEnv !== 'production');

  if (trustProxyHops > 0) {
    app.getHttpAdapter().getInstance().set('trust proxy', trustProxyHops);
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

  app.enableCors({
    origin,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id'],
  });

  app.setGlobalPrefix(apiPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('MediFlow ET API')
      .setDescription(
        'MediFlow ET - Electronic Healthcare & Clinic Management System Backend API Documentation',
      )
      .setVersion('1.0.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter your JWT access token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('Health', 'Health status checks')
      .addTag('Authentication & Authorization', 'Authentication, OTP, JWT, and RBAC')
      .addTag('Clinics', 'Clinic profile management with tenant isolation')
      .addTag('Branches', 'Clinic branch CRUD')
      .addTag('Staff', 'Clinic staff management')
      .addTag('Doctors', 'Doctor profiles, specialization, and availability')
      .addTag('Patients', 'Clinic patient registration and records')
      .addTag('Appointments', 'Appointment scheduling and status workflow')
      .addTag('Clinic Queue', 'Daily clinic queue and consultation flow')
      .addTag('Payments', 'Payment records (no external processor)')
      .addTag('Notifications', 'User and clinic notifications')
      .addTag('Reports', 'Dashboard and analytics')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(swaggerPath, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
      },
      customSiteTitle: 'MediFlow ET - API Documentation',
    });
  }

  app.enableShutdownHooks();

  await app.listen(port);

  logger.log(`MediFlow ET Backend is running on: http://localhost:${port}/${apiPrefix}`);
  if (swaggerEnabled) {
    logger.log(`Swagger Documentation available at: http://localhost:${port}/${swaggerPath}`);
  }
}

void bootstrap();
