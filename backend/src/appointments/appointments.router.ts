import { Router } from 'express';
import { Role } from '@prisma/client';
import { AppServices } from '../services';
import { createAuthMiddleware, requireRoles } from '../auth/middlewares/auth.middleware';
import { createClinicAccessMiddleware } from '../tenancy/clinic-access.middleware';
import { validateBody, validateQuery, validateUuidParam } from '../common/middleware/validation.middleware';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentQueryDto } from './dto/appointment-query.dto';

export function createAppointmentsRouter(services: AppServices): Router {
  const router = Router();
  const authenticate = createAuthMiddleware(services.prisma, services.config);
  const requireClinicAccess = createClinicAccessMiddleware(services.prisma);

  const baseGuards = [authenticate, requireClinicAccess];

  router.post(
    '/',
    ...baseGuards,
    requireRoles(Role.ADMIN, Role.RECEPTIONIST),
    validateBody(CreateAppointmentDto),
    async (req, res, next) => {
      try {
        const result = await services.appointments.create(req.body);
        res.status(201).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/',
    ...baseGuards,
    requireRoles(Role.ADMIN, Role.RECEPTIONIST, Role.DOCTOR, Role.PATIENT),
    validateQuery(AppointmentQueryDto),
    async (req, res, next) => {
      try {
        const query = req.query as unknown as AppointmentQueryDto;
        const patientUserId = req.user!.role === Role.PATIENT ? req.user!.id : undefined;
        const result = await services.appointments.findAll(query, patientUserId);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/:appointmentId',
    ...baseGuards,
    validateUuidParam('appointmentId'),
    requireRoles(Role.ADMIN, Role.RECEPTIONIST, Role.DOCTOR),
    async (req, res, next) => {
      try {
        const clinicId = req.query.clinicId as string;
        const result = await services.appointments.findOne(clinicId, req.params.appointmentId);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.patch(
    '/:appointmentId',
    ...baseGuards,
    validateUuidParam('appointmentId'),
    requireRoles(Role.ADMIN, Role.RECEPTIONIST),
    validateBody(UpdateAppointmentDto),
    async (req, res, next) => {
      try {
        const clinicId = req.query.clinicId as string;
        const result = await services.appointments.update(clinicId, req.params.appointmentId, req.body);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/:appointmentId/cancel',
    ...baseGuards,
    validateUuidParam('appointmentId'),
    requireRoles(Role.ADMIN, Role.RECEPTIONIST),
    async (req, res, next) => {
      try {
        const clinicId = req.query.clinicId as string;
        const result = await services.appointments.cancel(clinicId, req.params.appointmentId);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/:appointmentId/check-in',
    ...baseGuards,
    validateUuidParam('appointmentId'),
    requireRoles(Role.ADMIN, Role.RECEPTIONIST),
    async (req, res, next) => {
      try {
        const clinicId = req.query.clinicId as string;
        const result = await services.appointments.checkIn(clinicId, req.params.appointmentId);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
