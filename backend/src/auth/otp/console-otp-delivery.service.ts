import { Injectable, Logger } from '@nestjs/common';
import { IOtpDeliveryService } from './otp-delivery.interface';

@Injectable()
export class ConsoleOtpDeliveryService implements IOtpDeliveryService {
  private readonly logger = new Logger(ConsoleOtpDeliveryService.name);

  // In-memory record of recent OTPs sent (useful for automated testing and dev verification)
  private readonly recentOtps = new Map<string, { code: string; timestamp: Date }>();

  async send(recipient: string, code: string, purpose: string): Promise<boolean> {
    this.recentOtps.set(recipient, { code, timestamp: new Date() });

    this.logger.log(
      `\n================= [MediFlow ET OTP Service] =================\n` +
        `  Recipient : ${recipient}\n` +
        `  Purpose   : ${purpose}\n` +
        `  Code      : ${code} (Expires in 5 minutes)\n` +
        `=============================================================\n`,
    );

    return true;
  }

  /**
   * Helper method for integration tests to verify dispatch without real SMS provider
   */
  getLatestCode(recipient: string): string | undefined {
    return this.recentOtps.get(recipient)?.code;
  }

  /**
   * Clear test records
   */
  clear(): void {
    this.recentOtps.clear();
  }
}
