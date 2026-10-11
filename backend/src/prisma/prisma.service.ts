import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? [
              { emit: 'event', level: 'query' },
              { emit: 'stdout', level: 'info' },
              { emit: 'stdout', level: 'warn' },
              { emit: 'stdout', level: 'error' },
            ]
          : [{ emit: 'stdout', level: 'error' }],
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to PostgreSQL database via Prisma');
    } catch (error) {
      this.logger.error(
        'Failed to connect to PostgreSQL database via Prisma:',
        error instanceof Error ? error.message : error,
      );
      // In development, allow the application to start so swagger and endpoints can be inspected
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Disconnected from PostgreSQL database');
  }
}
