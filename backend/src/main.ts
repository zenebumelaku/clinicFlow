import 'dotenv/config';
import { createApp } from './application';
import { Logger } from './common/utils/logger';
import { validate } from './common/config/env.validation';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    validate(process.env);
  } catch (error) {
    logger.error('Environment validation error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }

  const { app, services } = createApp();
  const config = services.config;

  const port = config.get<number>('port', 3000);
  const apiPrefix = config.get<string>('apiPrefix', 'api/v1');
  const swaggerPath = config.get<string>('swaggerPath', 'api/docs');
  const nodeEnv = config.get<string>('nodeEnv', 'development');
  const swaggerEnabledEnv = config.get<string | boolean>('swaggerEnabled');
  const swaggerEnabled =
    swaggerEnabledEnv === true ||
    swaggerEnabledEnv === 'true' ||
    (swaggerEnabledEnv === undefined && nodeEnv !== 'production');

  await services.prisma.onModuleInit();

  const server = app.listen(port, () => {
    logger.log(`ClinicFlow Backend is running on: http://localhost:${port}/${apiPrefix}`);
    if (swaggerEnabled) {
      logger.log(`Swagger Documentation available at: http://localhost:${port}/${swaggerPath}`);
    }
  });

  const shutdown = async (signal: string) => {
    logger.log(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      await services.prisma.onModuleDestroy();
      logger.log('Process terminated.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

void bootstrap();
