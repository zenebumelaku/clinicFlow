export const OTP_DELIVERY_SERVICE = 'OTP_DELIVERY_SERVICE';

export interface IOtpDeliveryService {
  /**
   * Dispatches an OTP to the recipient (phone number or email).
   *
   * @param recipient Phone number or email address
   * @param code The 6-digit plain OTP code
   * @param purpose Reason for OTP (e.g. LOGIN, REGISTRATION)
   * @returns Promise resolving to true if sent successfully
   */
  send(recipient: string, code: string, purpose: string): Promise<boolean>;
}
