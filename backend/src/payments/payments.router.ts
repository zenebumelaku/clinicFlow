import { Router } from 'express';
import { Role } from '@prisma/client';
import { AppServices } from '../services';
import { createAuthMiddleware, requireRoles } from '../auth/middlewares/auth.middleware';
import { createClinicAccessMiddleware } from '../tenancy/clinic-access.middleware';
import { validateBody, validateQuery } from '../common/middleware/validation.middleware';
import { CreatePaymentDto } from './dto/create-payment.dto';
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

  router.get(
    '/',
    ...baseGuards,
    validateQuery(PaymentQueryDto),
    async (req, res, next) => {
      try {
        const query = req.query as unknown as PaymentQueryDto;
        const result = await services.payments.findAll(query);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
