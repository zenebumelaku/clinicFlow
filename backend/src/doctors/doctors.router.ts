import { Router } from 'express';
import { Role } from '@prisma/client';
import { AppServices } from '../services';
import { createAuthMiddleware, requireRoles } from '../auth/middlewares/auth.middleware';
import { createClinicAccessMiddleware } from '../tenancy/clinic-access.middleware';
import { validateBody, validateQuery, validateUuidParam } from '../common/middleware/validation.middleware';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { UpdateDoctorAvailabilityDto } from './dto/update-doctor-availability.dto';
import { DoctorQueryDto } from './dto/doctor-query.dto';

export function createDoctorsRouter(services: AppServices): Router {
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
    validateBody(CreateDoctorDto),
    async (req, res, next) => {
      try {
        const result = await services.doctors.create(req.params.clinicId, req.body);
        res.status(201).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/',
    ...commonGuards,
    requireRoles(Role.ADMIN, Role.RECEPTIONIST, Role.DOCTOR, Role.PATIENT),
    validateQuery(DoctorQueryDto),
    async (req, res, next) => {
      try {
        const query = req.query as unknown as DoctorQueryDto;
        const result = await services.doctors.findAll(req.params.clinicId, query);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/:doctorId',
    ...commonGuards,
    validateUuidParam('doctorId'),
    requireRoles(Role.ADMIN, Role.RECEPTIONIST, Role.DOCTOR),
    async (req, res, next) => {
      try {
        const result = await services.doctors.findOne(req.params.clinicId, req.params.doctorId);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.patch(
    '/:doctorId',
    ...commonGuards,
    validateUuidParam('doctorId'),
    requireRoles(Role.ADMIN, Role.DOCTOR),
    validateBody(UpdateDoctorDto),
    async (req, res, next) => {
      try {
        const result = await services.doctors.update(req.params.clinicId, req.params.doctorId, req.body, req.user!);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.patch(
    '/:doctorId/availability',
    ...commonGuards,
    validateUuidParam('doctorId'),
    requireRoles(Role.ADMIN, Role.DOCTOR),
    validateBody(UpdateDoctorAvailabilityDto),
    async (req, res, next) => {
      try {
        const result = await services.doctors.updateAvailability(
          req.params.clinicId,
          req.params.doctorId,
          req.body.availabilityStatus,
          req.user!,
        );
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.delete(
    '/:doctorId',
    ...commonGuards,
    validateUuidParam('doctorId'),
    requireRoles(Role.ADMIN),
    async (req, res, next) => {
      try {
        const result = await services.doctors.remove(req.params.clinicId, req.params.doctorId);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
