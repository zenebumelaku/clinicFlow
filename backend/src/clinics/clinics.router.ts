import { Router } from 'express';
import { Role } from '@prisma/client';
import { AppServices } from '../services';
import { createAuthMiddleware, requireRoles } from '../auth/middlewares/auth.middleware';
import { createClinicAccessMiddleware } from '../tenancy/clinic-access.middleware';
import { validateBody, validateQuery, validateUuidParam } from '../common/middleware/validation.middleware';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { UpdateClinicDto } from './dto/update-clinic.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

export function createClinicsRouter(services: AppServices): Router {
  const router = Router();
  const authenticate = createAuthMiddleware(services.prisma, services.config);
  const requireClinicAccess = createClinicAccessMiddleware(services.prisma);

  router.post(
    '/',
    authenticate,
    requireRoles(Role.ADMIN),
    validateBody(CreateClinicDto),
    async (req, res, next) => {
      try {
        const result = await services.clinics.create(req.user!.id, req.body);
        res.status(201).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/',
    authenticate,
    validateQuery(PaginationQueryDto),
    async (req, res, next) => {
      try {
        const query = req.query as unknown as PaginationQueryDto;
        const result = await services.clinics.listPaginated(req.user!.id, query.page, query.limit);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/:clinicId',
    authenticate,
    validateUuidParam('clinicId'),
    requireClinicAccess,
    async (req, res, next) => {
      try {
        const result = await services.clinics.findOne(req.params.clinicId);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.patch(
    '/:clinicId',
    authenticate,
    validateUuidParam('clinicId'),
    requireRoles(Role.ADMIN),
    requireClinicAccess,
    validateBody(UpdateClinicDto),
    async (req, res, next) => {
      try {
        const result = await services.clinics.update(req.params.clinicId, req.body);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.delete(
    '/:clinicId',
    authenticate,
    validateUuidParam('clinicId'),
    requireRoles(Role.ADMIN),
    requireClinicAccess,
    async (req, res, next) => {
      try {
        const result = await services.clinics.remove(req.params.clinicId);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
