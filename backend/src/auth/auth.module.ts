import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { OtpService } from './otp/otp.service';
import { ConsoleOtpDeliveryService } from './otp/console-otp-delivery.service';
import { OTP_DELIVERY_SERVICE } from './otp/otp-delivery.interface';
import { HttpOtpDeliveryService } from './otp/http-otp-delivery.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('jwt.secret') || configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn:
            configService.get<string>('jwt.expiresIn') ||
            configService.get<string>('JWT_EXPIRES_IN') ||
            '15m',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    OtpService,
    ConsoleOtpDeliveryService,
    {
      provide: OTP_DELIVERY_SERVICE,
      inject: [ConfigService, ConsoleOtpDeliveryService],
      useFactory: (configService: ConfigService, consoleDelivery: ConsoleOtpDeliveryService) =>
        configService.get<string>('nodeEnv') === 'production'
          ? new HttpOtpDeliveryService(configService)
          : consoleDelivery,
    },
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [
    AuthService,
    TokenService,
    OtpService,
    ConsoleOtpDeliveryService,
    JwtAuthGuard,
    RolesGuard,
    JwtModule,
  ],
})
export class AuthModule {}
