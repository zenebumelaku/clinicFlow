import { Router } from 'express';
import { Role } from '@prisma/client';
import { AppServices } from '../services';
import { createAuthMiddleware, requireRoles } from '../auth/middlewares/auth.middleware';
import { createClinicAccessMiddleware } from '../tenancy/clinic-access.middleware';
import { validateBody, validateQuery, validateUuidParam } from '../common/middleware/validation.middleware';
import { CheckInQueueDto } from './dto/check-in-queue.dto';
import { QueueQueryDto } from './dto/queue-query.dto';

export function createQueueRouter(services: AppServices): Router {
  const router = Router();
  const authenticate = createAuthMiddleware(services.prisma, services.config);
  const requireClinicAccess = createClinicAccessMiddleware(services.prisma);

  const baseGuards = [authenticate, requireClinicAccess];

  router.get(
    '/',
    ...baseGuards,
    requireRoles(Role.ADMIN, Role.RECEPTIONIST, Role.DOCTOR, Role.PATIENT),
    validateQuery(QueueQueryDto),
    async (req, res, next) => {
      try {
        const query = req.query as unknown as QueueQueryDto;
        const patientUserId = req.user!.role === Role.PATIENT ? req.user!.id : undefined;
        const result = await services.queue.findAll(query, patientUserId);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/check-in',
    ...baseGuards,
    requireRoles(Role.ADMIN, Role.RECEPTIONIST),
    validateBody(CheckInQueueDto),
    async (req, res, next) => {
      try {
        const result = await services.queue.checkIn(req.body);
        res.status(201).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/:ticketId/call',
    ...baseGuards,
    validateUuidParam('ticketId'),
    requireRoles(Role.ADMIN, Role.RECEPTIONIST),
    async (req, res, next) => {
      try {
        const clinicId = req.query.clinicId as string;
        const result = await services.queue.call(clinicId, req.params.ticketId);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/:ticketId/start',
    ...baseGuards,
    validateUuidParam('ticketId'),
    requireRoles(Role.ADMIN, Role.RECEPTIONIST, Role.DOCTOR),
    async (req, res, next) => {
      try {
        const clinicId = req.query.clinicId as string;
        const result = await services.queue.start(clinicId, req.params.ticketId);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/:ticketId/complete',
    ...baseGuards,
    validateUuidParam('ticketId'),
    requireRoles(Role.ADMIN, Role.RECEPTIONIST, Role.DOCTOR),
    async (req, res, next) => {
      try {
        const clinicId = req.query.clinicId as string;
        const result = await services.queue.complete(clinicId, req.params.ticketId);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/:ticketId/skip',
    ...baseGuards,
    validateUuidParam('ticketId'),
    requireRoles(Role.ADMIN, Role.RECEPTIONIST),
    async (req, res, next) => {
      try {
        const clinicId = req.query.clinicId as string;
        const result = await services.queue.skip(clinicId, req.params.ticketId);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
