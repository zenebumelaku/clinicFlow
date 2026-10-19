import { Router } from 'express';
import { Role } from '@prisma/client';
import { AppServices } from '../services';
import { createAuthMiddleware, requireRoles } from './middlewares/auth.middleware';
import { validateBody } from '../common/middleware/validation.middleware';
import { createRateLimiter } from '../common/middleware/rate-limiter.middleware';
import { RegisterClinicDto } from './dto/register-clinic.dto';
import { RegisterPatientDto } from './dto/register-patient.dto';
import { RegisterDoctorDto } from './dto/register-doctor.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';

export function createAuthRouter(services: AppServices): Router {
  const router = Router();
  const authenticate = createAuthMiddleware(services.prisma, services.config);

  const authThrottle = createRateLimiter({ limit: 8, ttl: 60000 });

  router.post(
    '/register-clinic',
    authThrottle,
    validateBody(RegisterClinicDto),
    async (req, res, next) => {
      try {
        const result = await services.auth.registerClinic(req.body);
        res.status(201).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/register-patient',
    authThrottle,
    validateBody(RegisterPatientDto),
    async (req, res, next) => {
      try {
        const result = await services.auth.registerPatient(req.body);
        res.status(201).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/register-doctor',
    authThrottle,
    validateBody(RegisterDoctorDto),
    async (req, res, next) => {
      try {
        const result = await services.auth.registerDoctor(req.body);
        res.status(201).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/reset-password',
    authThrottle,
    validateBody(ResetPasswordDto),
    async (req, res, next) => {
      try {
        const result = await services.auth.resetPassword(req.body);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/login',
    authThrottle,
    validateBody(LoginDto),
    async (req, res, next) => {
      try {
        const result = await services.auth.login(req.body);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/refresh',
    validateBody(RefreshTokenDto),
    async (req, res, next) => {
      try {
        const result = await services.auth.refresh(req.body);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/logout',
    validateBody(LogoutDto),
    async (req, res, next) => {
      try {
        const user = req.user as { id?: string } | undefined;
        const result = await services.auth.logout(user?.id, req.body);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/me',
    authenticate,
    async (req, res, next) => {
      try {
        const result = await services.auth.getProfile(req.user!.id);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/test/admin-only',
    authenticate,
    requireRoles(Role.ADMIN),
    (req, res) => {
      res.status(200).json({
        message: 'Access granted to ADMIN resource',
        user: req.user,
      });
    },
  );

  router.get(
    '/test/doctor-only',
    authenticate,
    requireRoles(Role.DOCTOR),
    (req, res) => {
      res.status(200).json({
        message: 'Access granted to DOCTOR resource',
        user: req.user,
      });
    },
  );

  router.get(
    '/test/receptionist-only',
    authenticate,
    requireRoles(Role.RECEPTIONIST),
    (req, res) => {
      res.status(200).json({
        message: 'Access granted to RECEPTIONIST resource',
        user: req.user,
      });
    },
  );

  router.get(
    '/test/patient-only',
    authenticate,
    requireRoles(Role.PATIENT),
    (req, res) => {
      res.status(200).json({
        message: 'Access granted to PATIENT resource',
        user: req.user,
      });
    },
  );

  return router;
}
