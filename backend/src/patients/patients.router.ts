import { Router } from 'express';
import { Role } from '@prisma/client';
import { AppServices } from '../services';
import { createAuthMiddleware, requireRoles } from '../auth/middlewares/auth.middleware';
import { createClinicAccessMiddleware } from '../tenancy/clinic-access.middleware';
import { validateBody, validateQuery, validateUuidParam } from '../common/middleware/validation.middleware';
import { CreatePatientDto } from './dto/create-patient.dto';
import { PatientQueryDto } from './dto/patient-query.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

export function createPatientsRouter(services: AppServices): Router {
  const router = Router();
  const authenticate = createAuthMiddleware(services.prisma, services.config);
  const requireClinicAccess = createClinicAccessMiddleware(services.prisma);

  router.post(
    '/',
    authenticate,
    requireRoles(Role.ADMIN, Role.RECEPTIONIST),
    requireClinicAccess,
    validateBody(CreatePatientDto),
    async (req, res, next) => {
      try {
        const result = await services.patients.create(req.body);
        res.status(201).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/',
    authenticate,
    requireRoles(Role.ADMIN, Role.RECEPTIONIST, Role.DOCTOR),
    requireClinicAccess,
    validateQuery(PatientQueryDto),
    async (req, res, next) => {
      try {
        const query = req.query as unknown as PatientQueryDto;
        const result = await services.patients.findAll(query);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/me',
    authenticate,
    requireRoles(Role.PATIENT),
    async (req, res, next) => {
      try {
        const result = await services.patients.findMine(req.user!.id);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/:patientId',
    authenticate,
    validateUuidParam('patientId'),
    requireRoles(Role.ADMIN, Role.RECEPTIONIST, Role.DOCTOR),
    requireClinicAccess,
    async (req, res, next) => {
      try {
        const clinicId = req.query.clinicId as string;
        const result = await services.patients.findOne(clinicId, req.params.patientId);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.patch(
    '/:patientId',
    authenticate,
    validateUuidParam('patientId'),
    requireRoles(Role.ADMIN, Role.RECEPTIONIST),
    requireClinicAccess,
    validateBody(UpdatePatientDto),
    async (req, res, next) => {
      try {
        const clinicId = req.query.clinicId as string;
        const result = await services.patients.update(clinicId, req.params.patientId, req.body);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
