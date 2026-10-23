import { IOtpDeliveryService } from './otp-delivery.interface';

export class UnavailableOtpDeliveryService implements IOtpDeliveryService {
  async send(): Promise<boolean> {
    return false;
  }
}
