import { Router } from 'express';
import { Role } from '@prisma/client';
import { AppServices } from '../services';
import { createAuthMiddleware, requireRoles } from '../auth/middlewares/auth.middleware';
import { createClinicAccessMiddleware } from '../tenancy/clinic-access.middleware';
import { validateBody, validateQuery, validateUuidParam } from '../common/middleware/validation.middleware';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

export function createBranchesRouter(services: AppServices): Router {
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
    validateBody(CreateBranchDto),
    async (req, res, next) => {
      try {
        const result = await services.branches.create(req.params.clinicId, req.body);
        res.status(201).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/',
    ...commonGuards,
    requireRoles(Role.ADMIN, Role.RECEPTIONIST, Role.DOCTOR),
    validateQuery(PaginationQueryDto),
    async (req, res, next) => {
      try {
        const query = req.query as unknown as PaginationQueryDto;
        const result = await services.branches.findAll(req.params.clinicId, query);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/:branchId',
    ...commonGuards,
    validateUuidParam('branchId'),
    requireRoles(Role.ADMIN, Role.RECEPTIONIST, Role.DOCTOR),
    async (req, res, next) => {
      try {
        const result = await services.branches.findOne(req.params.clinicId, req.params.branchId);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.patch(
    '/:branchId',
    ...commonGuards,
    validateUuidParam('branchId'),
    requireRoles(Role.ADMIN),
    validateBody(UpdateBranchDto),
    async (req, res, next) => {
      try {
        const result = await services.branches.update(req.params.clinicId, req.params.branchId, req.body);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.delete(
    '/:branchId',
    ...commonGuards,
    validateUuidParam('branchId'),
    requireRoles(Role.ADMIN),
    async (req, res, next) => {
      try {
        const result = await services.branches.remove(req.params.clinicId, req.params.branchId);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
