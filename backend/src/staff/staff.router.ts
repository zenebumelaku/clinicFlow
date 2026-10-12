import { Router } from 'express';
import { Role } from '@prisma/client';
import { AppServices } from '../services';
import { createAuthMiddleware, requireRoles } from '../auth/middlewares/auth.middleware';
import { createClinicAccessMiddleware } from '../tenancy/clinic-access.middleware';
import { validateBody, validateQuery, validateUuidParam } from '../common/middleware/validation.middleware';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StaffQueryDto } from './dto/staff-query.dto';

export function createStaffRouter(services: AppServices): Router {
  const router = Router({ mergeParams: true });
  const authenticate = createAuthMiddleware(services.prisma, services.config);
  const requireClinicAccess = createClinicAccessMiddleware(services.prisma);

  const commonGuards = [
    authenticate,
    validateUuidParam('clinicId'),
    requireClinicAccess,
  ];

  router.post(
    '/',
    ...commonGuards,
    requireRoles(Role.ADMIN),
    validateBody(CreateStaffDto),
    async (req, res, next) => {
      try {
        const result = await services.staff.create(req.params.clinicId, req.body);
        res.status(201).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/',
    ...commonGuards,
    requireRoles(Role.ADMIN, Role.RECEPTIONIST),
    validateQuery(StaffQueryDto),
    async (req, res, next) => {
      try {
        const query = req.query as unknown as StaffQueryDto;
        const result = await services.staff.findAll(req.params.clinicId, query);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/:staffId',
    ...commonGuards,
    validateUuidParam('staffId'),
    requireRoles(Role.ADMIN, Role.RECEPTIONIST),
    async (req, res, next) => {
      try {
        const result = await services.staff.findOne(req.params.clinicId, req.params.staffId);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.patch(
    '/:staffId',
    ...commonGuards,
    validateUuidParam('staffId'),
    requireRoles(Role.ADMIN),
    validateBody(UpdateStaffDto),
    async (req, res, next) => {
      try {
        const result = await services.staff.update(req.params.clinicId, req.params.staffId, req.body);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.delete(
    '/:staffId',
    ...commonGuards,
    validateUuidParam('staffId'),
    requireRoles(Role.ADMIN),
    async (req, res, next) => {
      try {
        const result = await services.staff.remove(req.params.clinicId, req.params.staffId);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
