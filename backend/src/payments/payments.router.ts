import { Router } from 'express';
import { Role } from '@prisma/client';
import { AppServices } from '../services';
import { createAuthMiddleware, requireRoles } from '../auth/middlewares/auth.middleware';
import { createClinicAccessMiddleware } from '../tenancy/clinic-access.middleware';
import { validateBody, validateQuery } from '../common/middleware/validation.middleware';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { InitializeChapaDto } from './dto/initialize-chapa.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';

export function createPaymentsRouter(services: AppServices): Router {
  const router = Router();
  const authenticate = createAuthMiddleware(services.prisma, services.config);
  const requireClinicAccess = createClinicAccessMiddleware(services.prisma);

  const baseGuards = [
    authenticate,
    requireRoles(Role.ADMIN, Role.RECEPTIONIST),
    requireClinicAccess,
  ];

  router.post(
    '/',
    ...baseGuards,
    validateBody(CreatePaymentDto),
    async (req, res, next) => {
      try {
        const result = await services.payments.create(req.body);
        res.status(201).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * Initialize Chapa Checkout
   * Accessible by Admin, Receptionist, and Patient
   */
  router.post(
    '/chapa/initialize',
    authenticate,
    requireRoles(Role.ADMIN, Role.RECEPTIONIST, Role.PATIENT),
    requireClinicAccess,
    validateBody(InitializeChapaDto),
    async (req, res, next) => {
      try {
        const result = await services.payments.initializeChapaPayment(req.body, req.user!);
        res.status(201).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * Verify Chapa Transaction server-to-server
   * Accessible by Admin, Receptionist, and Patient
   */
  router.get(
    '/chapa/verify/:txRef',
    authenticate,
    requireRoles(Role.ADMIN, Role.RECEPTIONIST, Role.PATIENT),
    async (req, res, next) => {
      try {
        const result = await services.payments.verifyChapaPayment(
          req.params.txRef,
          req.query.clinicId as string | undefined,
          req.user!,
        );
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * Chapa Webhook Receiver
   * Public endpoint with signature validation
   */
  router.post(
    '/chapa/webhook',
    async (req, res, next) => {
      try {
        const signature = (req.headers['x-chapa-signature'] as string) || '';
        const chapa = services.payments.getChapaService();

        // In test mode, signature verification can be permissive if no secret configured
        if (chapa.isConfigured() && signature) {
          const rawBody = JSON.stringify(req.body);
          const isValid = chapa.verifyWebhookSignature(rawBody, signature);
          if (!isValid) {
            res.status(401).json({ error: 'Invalid webhook signature' });
            return;
          }
        }

        const txRef = req.body?.tx_ref || req.body?.trx_ref;
        if (txRef) {
          await services.payments.verifyChapaPayment(txRef);
        }

        res.status(200).json({ received: true });
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/',
    authenticate,
    requireClinicAccess,
    requireRoles(Role.ADMIN, Role.RECEPTIONIST),
    validateQuery(PaymentQueryDto),
    async (req, res, next) => {
      try {
        const query = req.query as unknown as PaymentQueryDto;
        const patientUserId = req.user!.role === Role.PATIENT ? req.user!.id : undefined;
        const result = await services.payments.findAll(query, patientUserId);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
