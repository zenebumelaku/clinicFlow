import { Router } from 'express';
import { Role } from '@prisma/client';
import { AppServices } from '../services';
import { createAuthMiddleware, requireRoles } from '../auth/middlewares/auth.middleware';
import { createClinicAccessMiddleware } from '../tenancy/clinic-access.middleware';
import { validateQuery } from '../common/middleware/validation.middleware';
import { ReportQueryDto } from './dto/report-query.dto';

export function createReportsRouter(services: AppServices): Router {
  const router = Router();
  const authenticate = createAuthMiddleware(services.prisma, services.config);
  const requireClinicAccess = createClinicAccessMiddleware(services.prisma);

  const baseGuards = [
    authenticate,
    requireRoles(Role.ADMIN, Role.RECEPTIONIST),
    requireClinicAccess,
    validateQuery(ReportQueryDto),
  ];

  router.get(
    '/dashboard',
    ...baseGuards,
    async (req, res, next) => {
      try {
        const query = req.query as unknown as ReportQueryDto;
        const result = await services.reports.dashboard(query);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/revenue',
    ...baseGuards,
    async (req, res, next) => {
      try {
        const query = req.query as unknown as ReportQueryDto;
        const result = await services.reports.revenue(query);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/appointments',
    ...baseGuards,
    async (req, res, next) => {
      try {
        const query = req.query as unknown as ReportQueryDto;
        const result = await services.reports.appointments(query);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/waiting-time',
    ...baseGuards,
    async (req, res, next) => {
      try {
        const query = req.query as unknown as ReportQueryDto;
        const result = await services.reports.waitingTime(query);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
