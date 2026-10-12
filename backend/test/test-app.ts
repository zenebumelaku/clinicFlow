import { AddressInfo } from 'net';
import { createApp } from '../src/app';
import { PrismaService } from '../src/prisma/prisma.service';
import { TokenService } from '../src/auth/token.service';
import { ConsoleOtpDeliveryService } from '../src/auth/otp/console-otp-delivery.service';
import { NotificationsService } from '../src/notifications/notifications.service';

export interface TestAppInstance {
  setGlobalPrefix(prefix: string): void;
  useGlobalPipes(...pipes: unknown[]): void;
  useGlobalFilters(...filters: unknown[]): void;
  useGlobalInterceptors(...interceptors: unknown[]): void;
  init(): Promise<void>;
  listen(port: number): Promise<void>;
  getHttpServer(): { address(): AddressInfo | string | null };
  close(): Promise<void>;
  get<T>(serviceClass: unknown): T;
}

export type INestApplication = TestAppInstance;

export class ValidationPipe {
  constructor(_options?: unknown) {}
}

export const Test = {
  createTestingModule: (_options?: unknown) => {
    let mockPrismaInstance: unknown;

    const builder = {
      overrideProvider: (_provider: unknown) => ({
        useValue: (val: unknown) => {
          mockPrismaInstance = val;
          return builder;
        },
      }),
      compile: async () => ({
        createNestApplication: (): TestAppInstance => {
          const { app, services } = createApp({
            serviceOverrides: {
              prisma: mockPrismaInstance as PrismaService,
            },
          });

          let server: ReturnType<typeof app.listen> | undefined;

          return {
            setGlobalPrefix: () => {},
            useGlobalPipes: () => {},
            useGlobalFilters: () => {},
            useGlobalInterceptors: () => {},
            init: async () => {},
            listen: async (_port: number) => {
              server = app.listen(0);
              await new Promise<void>((resolve) => server!.once('listening', resolve));
            },
            getHttpServer: () => server!,
            close: async () => {
              if (server) {
                await new Promise<void>((resolve) => server!.close(() => resolve()));
              }
            },
            get: <T>(serviceClass: unknown): T => {
              const sName = (serviceClass as { name?: string })?.name;
              if (sName === 'TokenService' || serviceClass === TokenService) return services.token as T;
              if (sName === 'ConsoleOtpDeliveryService' || serviceClass === ConsoleOtpDeliveryService)
                return services.otpDelivery as T;
              if (sName === 'NotificationsService' || serviceClass === NotificationsService)
                return services.notifications as T;
              return (services as unknown as Record<string, T>)[sName || ''];
            },
          };
        },
      }),
    };

    return builder;
  },
};
