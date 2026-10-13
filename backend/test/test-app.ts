import { AddressInfo } from 'node:net';
import { Server } from 'node:http';
import { Express } from 'express';
import { AppServices } from '../src/services';
import { createApp } from '../src/app';
import { PrismaService } from '../src/prisma/prisma.service';

export interface TestAppInstance {
  app: Express;
  server: Server;
  baseUrl: string;
  services: AppServices;
  close(): Promise<void>;
}

export async function createTestApp(options: {
  mockPrisma: PrismaService;
}): Promise<TestAppInstance> {
  const { app, services } = createApp({ prisma: options.mockPrisma });
  const server = app.listen(0, '127.0.0.1');

  await new Promise<void>((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    server.close();
    throw new Error('Test server did not bind to a TCP port');
  }

  const baseUrl = `http://127.0.0.1:${(address as AddressInfo).port}/api/v1`;

  return {
    app,
    server,
    baseUrl,
    services,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}
