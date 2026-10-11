import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomInt, timingSafeEqual } from 'crypto';
import { OtpPurpose, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { IOtpDeliveryService, OTP_DELIVERY_SERVICE } from './otp-delivery.interface';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  // Configuration constants
  private readonly OTP_EXPIRY_MINUTES = 5;
  private readonly OTP_COOLDOWN_SECONDS = 60;
  private readonly MAX_ATTEMPTS = 3;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Inject(OTP_DELIVERY_SERVICE)
    private readonly deliveryService: IOtpDeliveryService,
  ) {}

  /**
   * Generates and dispatches a cryptographically secure 6-digit OTP.
   * Enforces rate-limiting cooldown and invalidates prior pending OTPs.
   */
  async sendOtp(
    identifier: string,
    purpose: OtpPurpose = OtpPurpose.LOGIN,
  ): Promise<{ success: boolean; message: string; cooldownSeconds: number }> {
    const normalizedIdentifier = identifier.trim().toLowerCase();
    // Generate the code before entering the transaction; only its hash is persisted.
    const rawCode = this.generateSecureCode();
    const codeHash = this.hashCode(rawCode);
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);
    let savedOtp: { id: string } | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        savedOtp = await this.prisma.$transaction(
          async (transaction) => {
            const recentOtp = await transaction.otp.findFirst({
              where: { identifier: normalizedIdentifier, purpose },
              orderBy: { createdAt: 'desc' },
            });
            if (recentOtp) {
              const elapsedSeconds = Math.floor(
                (Date.now() - recentOtp.createdAt.getTime()) / 1000,
              );
              if (elapsedSeconds < this.OTP_COOLDOWN_SECONDS) {
                const remainingCooldown = this.OTP_COOLDOWN_SECONDS - elapsedSeconds;
                throw new BadRequestException(
                  `Please wait ${remainingCooldown} seconds before requesting a new OTP code`,
                );
              }
            }

            await transaction.otp.updateMany({
              where: { identifier: normalizedIdentifier, purpose, isUsed: false },
              data: { isUsed: true },
            });
            const user = await transaction.user.findFirst({
              where: { OR: [{ phone: normalizedIdentifier }, { email: normalizedIdentifier }] },
              select: { id: true },
            });
            return transaction.otp.create({
              data: {
                identifier: normalizedIdentifier,
                codeHash,
                purpose,
                userId: user?.id,
                expiresAt,
                maxAttempts: this.MAX_ATTEMPTS,
                attempts: 0,
                isUsed: false,
              },
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
        break;
      } catch (error) {
        const serializationConflict =
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          (error as { code: string }).code === 'P2034';
        if (!serializationConflict) throw error;
        if (attempt === 2) {
          throw new BadRequestException('Another OTP request is being processed; retry shortly');
        }
      }
    }
    if (!savedOtp) throw new BadRequestException('Unable to create verification code');

    // 7. Dispatch via configured delivery provider
    try {
      const delivered = await this.deliveryService.send(normalizedIdentifier, rawCode, purpose);
      if (!delivered) throw new Error('OTP delivery was rejected');
    } catch {
      await this.prisma.otp.update({
        where: { id: savedOtp.id },
        data: { isUsed: true },
      });
      this.logger.error('OTP delivery provider failed to deliver a verification code');
      throw new ServiceUnavailableException('Unable to deliver verification code');
    }

    this.logger.log(`Dispatched OTP (purpose: ${purpose})`);

    return {
      success: true,
      message: `OTP sent successfully. Valid for ${this.OTP_EXPIRY_MINUTES} minutes.`,
      cooldownSeconds: this.OTP_COOLDOWN_SECONDS,
    };
  }

  /**
   * Verifies an OTP code against security policies:
   * - Single-use enforcement
   * - Expiration check
   * - Brute-force rate limiting (max attempts)
   */
  async verifyOtp(
    identifier: string,
    code: string,
    purpose: OtpPurpose = OtpPurpose.LOGIN,
  ): Promise<{ verified: boolean; identifier: string; userId?: string }> {
    const normalizedIdentifier = identifier.trim().toLowerCase();
    const cleanCode = code.trim();

    // 1. Fetch latest unused OTP record
    const otpRecord = await this.prisma.otp.findFirst({
      where: {
        identifier: normalizedIdentifier,
        purpose,
        isUsed: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new BadRequestException('No active OTP found. Please request a new verification code.');
    }

    // 2. Check Expiration
    const now = new Date();
    if (now > otpRecord.expiresAt) {
      await this.prisma.otp.updateMany({
        where: { id: otpRecord.id, isUsed: false },
        data: { isUsed: true },
      });
      throw new BadRequestException(
        'The verification code has expired. Please request a new code.',
      );
    }

    // 3. Check Brute-Force Attempts
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      await this.prisma.otp.updateMany({
        where: { id: otpRecord.id, isUsed: false },
        data: { isUsed: true },
      });
      throw new BadRequestException(
        'Maximum verification attempts exceeded. Code has been invalidated.',
      );
    }

    // 4. Validate Code Hash
    const incomingCodeHash = this.hashCode(cleanCode);
    const isCorrectCode = timingSafeEqual(
      Buffer.from(incomingCodeHash, 'hex'),
      Buffer.from(otpRecord.codeHash, 'hex'),
    );
    if (!isCorrectCode) {
      const updatedAttempts = otpRecord.attempts + 1;
      const isLocked = updatedAttempts >= otpRecord.maxAttempts;

      const attemptUpdate = await this.prisma.otp.updateMany({
        where: { id: otpRecord.id, isUsed: false, attempts: otpRecord.attempts },
        data: {
          attempts: { increment: 1 },
          isUsed: isLocked,
        },
      });
      if (attemptUpdate.count !== 1) {
        throw new BadRequestException('Verification code is no longer active; request a new code');
      }

      if (isLocked) {
        throw new BadRequestException(
          'Incorrect verification code. Maximum attempts reached, code invalidated.',
        );
      }

      const remainingAttempts = otpRecord.maxAttempts - updatedAttempts;
      throw new BadRequestException(
        `Incorrect verification code. ${remainingAttempts} attempt(s) remaining.`,
      );
    }

    // 5. Mark single-use OTP as used immediately
    const consumed = await this.prisma.otp.updateMany({
      where: { id: otpRecord.id, isUsed: false, attempts: otpRecord.attempts },
      data: { isUsed: true },
    });
    if (consumed.count !== 1) {
      throw new BadRequestException('Verification code is no longer active; request a new code');
    }

    return {
      verified: true,
      identifier: normalizedIdentifier,
      userId: otpRecord.userId ?? undefined,
    };
  }

  /**
   * Generates a cryptographically strong 6-digit numeric string
   */
  private generateSecureCode(): string {
    return randomInt(100000, 1000000).toString();
  }

  /**
   * Hashes the plain OTP code using SHA-256
   */
  private hashCode(code: string): string {
    const pepper =
      this.configService.get<string>('otp.pepper') ||
      this.configService.get<string>('OTP_PEPPER') ||
      'development-only-otp-pepper-do-not-use-in-production';
    return createHash('sha256').update(`${code}:${pepper}`).digest('hex');
  }
}
