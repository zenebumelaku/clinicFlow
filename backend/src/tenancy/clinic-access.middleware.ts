import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '../common/exceptions/http.exceptions';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      clinic?: unknown;
      staffMember?: unknown;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

export function createClinicAccessMiddleware(prisma: PrismaService) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user as AuthenticatedUser | undefined;

      if (!user?.id) {
        throw new UnauthorizedException('Authentication is required to access clinic resources');
      }

      let clinicId =
        (req.params?.clinicId as string | undefined) ??
        (req.query?.clinicId as string | undefined) ??
        (req.body?.clinicId as string | undefined);

      if (!clinicId && user.role === Role.PATIENT) {
        const patient = await prisma.patient.findFirst({
          where: { userId: user.id, isActive: true, clinic: { isActive: true } },
          select: { clinicId: true },
          orderBy: { createdAt: 'asc' },
        });
        clinicId = patient?.clinicId;
      }

      if (!clinicId) {
        throw new ForbiddenException('Clinic context is required for this request');
      }

      if (!UUID_V4.test(clinicId)) {
        throw new BadRequestException('clinicId must be a valid UUID');
      }

      const [clinic, membership, patientProfile] = await Promise.all([
        prisma.clinic.findUnique({
          where: { id: clinicId },
          select: {
            id: true,
            name: true,
            slug: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            region: true,
            licenseNumber: true,
            logoUrl: true,
            description: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.staffMember.findFirst({
          where: {
            clinicId,
            userId: user.id,
            isActive: true,
          },
        }),
        user.role === Role.PATIENT
          ? prisma.patient.findFirst({
              where: { clinicId, userId: user.id, isActive: true },
            })
          : Promise.resolve(null),
      ]);

      if (!clinic || !clinic.isActive) {
        throw new NotFoundException('Clinic not found');
      }

      if (!membership && !patientProfile) {
        throw new ForbiddenException('You do not have access to this clinic');
      }

      req.clinic = clinic;
      req.staffMember = membership;
      next();
    } catch (err) {
      next(err);
    }
  };
}
