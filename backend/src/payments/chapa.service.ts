import {
  BadRequestException,
  ServiceUnavailableException,
} from '../common/exceptions/http.exceptions';
import { ConfigService } from '../common/config/config.service';
import { Logger } from '../common/utils/logger';
import * as crypto from 'crypto';

export interface ChapaInitializeOptions {
  amount: number;
  currency?: string;
  email?: string;
  firstName: string;
  lastName: string;
  phone: string;
  txRef: string;
  callbackUrl?: string;
  returnUrl?: string;
  title?: string;
  description?: string;
}

export interface ChapaInitializeResult {
  status: 'success' | 'error';
  message: string;
  checkoutUrl: string;
  txRef: string;
}

export interface ChapaVerifyResult {
  status: 'success' | 'pending' | 'failed';
  txRef: string;
  reference?: string;
  amount: number;
  currency: string;
  paymentMethod?: string;
  raw?: unknown;
}

export class ChapaService {
  private readonly logger = new Logger(ChapaService.name);
  private readonly secretKey: string;
  private readonly baseUrl: string;
  private readonly webhookSecret: string;

  constructor(private readonly config: ConfigService) {
    this.secretKey = this.config.get<string>('chapa.secretKey', process.env.CHAPA_SECRET_KEY || '');
    this.baseUrl = this.config
      .get<string>('chapa.baseUrl', process.env.CHAPA_BASE_URL || 'https://api.chapa.co/v1')
      .replace(/\/$/, '');
    this.webhookSecret = this.config.get<string>(
      'chapa.webhookSecret',
      process.env.CHAPA_WEBHOOK_SECRET || this.secretKey,
    );
  }

  isConfigured(): boolean {
    const key = this.secretKey.trim();
    return Boolean(key && !/(^|[-_])(?:your|placeholder|replace)([-_]|$)/i.test(key));
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Initializes a transaction with Chapa Hosted Checkout
   * POST /v1/transaction/initialize
   */
  async initialize(options: ChapaInitializeOptions): Promise<ChapaInitializeResult> {
    const {
      amount,
      currency = 'ETB',
      email = 'patient@ClinicFlow.et',
      firstName,
      lastName,
      phone,
      txRef,
      callbackUrl,
      returnUrl,
      title = 'ClinicFlow Care Payment',
      description = 'Clinical consultation fee payment',
    } = options;

    if (!amount || amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    if (!txRef) {
      throw new BadRequestException('Transaction reference (tx_ref) is required');
    }

    const payload = {
      amount: amount.toString(),
      currency,
      email: email || 'patient@ClinicFlow.et',
      first_name: firstName,
      last_name: lastName,
      phone_number: phone,
      tx_ref: txRef,
      callback_url: callbackUrl,
      return_url: returnUrl,
      customization: {
        title,
        description,
      },
    };

    if (!this.isConfigured()) {
      throw new ServiceUnavailableException('Chapa payments are not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        status: string;
        message: string;
        data?: { checkout_url: string };
      };

      if (!response.ok || data.status !== 'success' || !data.data?.checkout_url) {
        this.logger.error(`Chapa initialization failed: ${data.message || response.statusText}`);
        throw new BadRequestException(
          data.message || 'Chapa payment gateway initialization failed. Please check credentials.',
        );
      }

      return {
        status: 'success',
        message: data.message,
        checkoutUrl: data.data.checkout_url,
        txRef,
      };
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error(`Network or fetch error connecting to Chapa: ${err}`);
      throw new BadRequestException('Could not connect to Chapa payment server. Please try again.');
    }
  }

  /**
   * Verifies payment status server-to-server with Chapa
   * GET /v1/transaction/verify/{tx_ref}
   */
  async verify(txRef: string): Promise<ChapaVerifyResult> {
    if (!txRef) {
      throw new BadRequestException('Transaction reference is required for verification');
    }

    if (!this.isConfigured()) {
      throw new ServiceUnavailableException('Chapa payments are not configured');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/transaction/verify/${encodeURIComponent(txRef)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const data = (await response.json()) as {
        status: string;
        message: string;
        data?: {
          status: string;
          amount: number;
          currency: string;
          reference?: string;
          tx_ref: string;
          method?: string;
        };
      };

      if (!response.ok || data.status !== 'success' || !data.data) {
        this.logger.warn(`Chapa verification returned unverified or failed: ${data.message}`);
        return {
          status: 'failed',
          txRef,
          amount: 0,
          currency: 'ETB',
          raw: data,
        };
      }

      const transactionStatus = data.data.status?.toLowerCase();
      return {
        status:
          transactionStatus === 'success'
            ? 'success'
            : transactionStatus === 'pending'
              ? 'pending'
              : 'failed',
        txRef: data.data.tx_ref,
        reference: data.data.reference,
        amount: Number(data.data.amount),
        currency: data.data.currency,
        paymentMethod: data.data.method || 'CHAPA',
        raw: data.data,
      };
    } catch (err) {
      this.logger.error(`Error verifying Chapa transaction: ${err}`);
      throw new BadRequestException(
        'Payment verification failed due to network connectivity issues.',
      );
    }
  }

  /**
   * Verifies HMAC SHA256 signature on incoming webhooks
   */
  verifyWebhookSignature(rawBody: string | Buffer, signature: string): boolean {
    if (!signature || !this.webhookSecret) return false;
    try {
      const expected = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(rawBody)
        .digest('hex');
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch {
      return false;
    }
  }
}
