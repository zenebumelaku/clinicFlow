import { ConfigAccessor } from '../../common/config/config.service';
import { IOtpDeliveryService } from './otp-delivery.interface';

export class HttpOtpDeliveryService implements IOtpDeliveryService {
  private readonly url: string;
  private readonly token: string;

  constructor(configService: ConfigAccessor) {
    this.url = configService.getOrThrow<string>('otp.deliveryUrl');
    this.token = configService.getOrThrow<string>('otp.deliveryToken');
  }

  async send(recipient: string, code: string, purpose: string): Promise<boolean> {
    const response = await fetch(this.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recipient, code, purpose }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      throw new Error(`OTP delivery endpoint returned HTTP ${response.status}`);
    }
    return true;
  }
}
