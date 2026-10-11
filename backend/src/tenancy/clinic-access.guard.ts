import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { Role } from '@prisma/client';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class ClinicAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;

    if (!user?.id) {
      throw new UnauthorizedException('Authentication is required to access clinic resources');
    }

    let clinicId =
      (request.params?.clinicId as string | undefined) ??
      (request.query?.clinicId as string | undefined) ??
      (request.body?.clinicId as string | undefined);
    if (!clinicId && user.role === Role.PATIENT) {
      const patient = await this.prisma.patient.findFirst({
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
      this.prisma.clinic.findUnique({
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
      this.prisma.staffMember.findFirst({
        where: {
          clinicId,
          userId: user.id,
          isActive: true,
        },
      }),
      user.role === Role.PATIENT
        ? this.prisma.patient.findFirst({
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

    request.clinic = clinic;
    request.staffMember = membership;
    return true;
  }
}
