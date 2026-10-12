import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '../common/exceptions/http.exceptions';
import { DoctorAvailabilityStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { UserResponseDto } from '../auth/dto/auth-response.dto';
import { BranchesService } from '../branches/branches.service';
import { StaffService } from '../staff/staff.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { DoctorQueryDto } from './dto/doctor-query.dto';
import { DoctorResponseDto } from './dto/doctor-response.dto';

export class DoctorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly branchesService: BranchesService,
    private readonly staffService: StaffService,
  ) {}

  async create(clinicId: string, dto: CreateDoctorDto): Promise<DoctorResponseDto> {
    if (dto.branchId) {
      await this.branchesService.assertBranchInClinic(clinicId, dto.branchId);
    }

    const { staffMemberId, userId } = await this.resolveStaff(clinicId, dto);

    const duplicate = await this.prisma.doctor.findFirst({
      where: { clinicId, staffMemberId },
    });
    if (duplicate) {
      throw new ConflictException('A doctor profile already exists for this staff member');
    }

    try {
      const doctor = await this.prisma.doctor.create({
        data: {
          clinicId,
          staffMemberId,
          userId,
          specialization: dto.specialization,
          licenseNumber: dto.licenseNumber,
          bio: dto.bio || null,
          consultationFee: dto.consultationFee ?? null,
          availabilityStatus: DoctorAvailabilityStatus.AVAILABLE,
        },
        include: { user: true, staffMember: { include: { user: true } } },
      });
      return this.map(doctor);
    } catch (error) {
      this.handleUnique(error);
    }
  }

  async findAll(
    clinicId: string,
    query: DoctorQueryDto,
  ): Promise<PaginatedResponseDto<DoctorResponseDto>> {
    const where: Prisma.DoctorWhereInput = {
      clinicId,
      ...(query.specialization
        ? { specialization: { contains: query.specialization, mode: 'insensitive' } }
        : {}),
      ...(query.availabilityStatus ? { availabilityStatus: query.availabilityStatus } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.branchId ? { staffMember: { is: { branchId: query.branchId } } } : {}),
      ...(query.search
        ? {
            OR: [
              { specialization: { contains: query.search, mode: 'insensitive' } },
              { licenseNumber: { contains: query.search, mode: 'insensitive' } },
              { user: { is: { firstName: { contains: query.search, mode: 'insensitive' } } } },
              { user: { is: { lastName: { contains: query.search, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    };

    const [total, records] = await Promise.all([
      this.prisma.doctor.count({ where }),
      this.prisma.doctor.findMany({
        where,
        include: { user: true, staffMember: { include: { user: true } } },
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return new PaginatedResponseDto(
      records.map((record) => this.map(record)),
      total,
      query.page,
      query.limit,
    );
  }

  async findOne(clinicId: string, doctorId: string): Promise<DoctorResponseDto> {
    const doctor = await this.prisma.doctor.findFirst({
      where: { id: doctorId, clinicId },
      include: { user: true, staffMember: { include: { user: true } } },
    });
    if (!doctor) {
      throw new NotFoundException('Doctor not found in this clinic');
    }
    return this.map(doctor);
  }

  async update(
    clinicId: string,
    doctorId: string,
    dto: UpdateDoctorDto,
    actor: AuthenticatedUser,
  ): Promise<DoctorResponseDto> {
    const doctor = await this.prisma.doctor.findFirst({
      where: { id: doctorId, clinicId },
    });
    if (!doctor) {
      throw new NotFoundException('Doctor not found in this clinic');
    }

    this.assertCanUpdate(actor, doctor.userId, dto);

    try {
      const updated = await this.prisma.doctor.update({
        where: { id: doctorId },
        data: {
          specialization: dto.specialization,
          licenseNumber: dto.licenseNumber,
          bio: dto.bio,
          consultationFee: dto.consultationFee,
          availabilityStatus: dto.availabilityStatus,
          isActive: dto.isActive,
        },
        include: { user: true, staffMember: { include: { user: true } } },
      });
      return this.map(updated);
    } catch (error) {
      this.handleUnique(error);
    }
  }

  async updateAvailability(
    clinicId: string,
    doctorId: string,
    availabilityStatus: DoctorAvailabilityStatus,
    actor: AuthenticatedUser,
  ): Promise<DoctorResponseDto> {
    return this.update(clinicId, doctorId, { availabilityStatus }, actor);
  }

  async remove(clinicId: string, doctorId: string): Promise<{ success: boolean; message: string }> {
    await this.findOne(clinicId, doctorId);
    await this.prisma.doctor.update({
      where: { id: doctorId },
      data: { isActive: false, availabilityStatus: DoctorAvailabilityStatus.UNAVAILABLE },
    });
    return { success: true, message: 'Doctor deactivated successfully' };
  }

  map(doctor: {
    id: string;
    clinicId: string;
    staffMemberId: string;
    userId: string;
    specialization: string;
    licenseNumber: string;
    bio: string | null;
    consultationFee: Prisma.Decimal | number | null;
    availabilityStatus: DoctorAvailabilityStatus;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    user?: {
      id: string;
      phone: string;
      email: string | null;
      firstName: string;
      lastName: string;
      role: Role;
      isActive: boolean;
      createdAt: Date;
    };
    staffMember?: Parameters<StaffService['map']>[0];
  }): DoctorResponseDto {
    return {
      id: doctor.id,
      clinicId: doctor.clinicId,
      staffMemberId: doctor.staffMemberId,
      userId: doctor.userId,
      specialization: doctor.specialization,
      licenseNumber: doctor.licenseNumber,
      bio: doctor.bio,
      consultationFee:
        doctor.consultationFee === null || doctor.consultationFee === undefined
          ? null
          : Number(doctor.consultationFee),
      availabilityStatus: doctor.availabilityStatus,
      isActive: doctor.isActive,
      createdAt: doctor.createdAt,
      updatedAt: doctor.updatedAt,
      user: doctor.user ? this.mapUser(doctor.user) : undefined,
      staffMember: doctor.staffMember ? this.staffService.map(doctor.staffMember) : undefined,
    };
  }

  private mapUser(user: {
    id: string;
    phone: string;
    email: string | null;
    firstName: string;
    lastName: string;
    role: Role;
    isActive: boolean;
    createdAt: Date;
  }): UserResponseDto {
    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }

  private async resolveStaff(
    clinicId: string,
    dto: CreateDoctorDto,
  ): Promise<{ staffMemberId: string; userId: string }> {
    if (dto.staffMemberId) {
      const staff = await this.prisma.staffMember.findFirst({
        where: { id: dto.staffMemberId, clinicId },
      });
      if (!staff) {
        throw new NotFoundException('Staff member not found in this clinic');
      }
      await this.prisma.user.update({
        where: { id: staff.userId },
        data: { role: Role.DOCTOR },
      });
      return { staffMemberId: staff.id, userId: staff.userId };
    }

    if (dto.userId) {
      const existingStaff = await this.prisma.staffMember.findFirst({
        where: { clinicId, userId: dto.userId },
      });
      if (existingStaff) {
        await this.prisma.user.update({
          where: { id: dto.userId },
          data: { role: Role.DOCTOR },
        });
        return { staffMemberId: existingStaff.id, userId: dto.userId };
      }

      const created = await this.staffService.create(clinicId, {
        userId: dto.userId,
        role: Role.DOCTOR,
        branchId: dto.branchId,
        jobTitle: dto.jobTitle,
        employeeCode: dto.employeeCode,
      });
      return { staffMemberId: created.id, userId: created.userId };
    }

    if (!dto.phone || !dto.firstName || !dto.lastName) {
      throw new BadRequestException(
        'Provide staffMemberId, userId, or new user details (phone, firstName, lastName)',
      );
    }

    const created = await this.staffService.create(clinicId, {
      phone: dto.phone,
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      password: dto.password,
      role: Role.DOCTOR,
      branchId: dto.branchId,
      jobTitle: dto.jobTitle || 'Doctor',
      employeeCode: dto.employeeCode,
    });
    return { staffMemberId: created.id, userId: created.userId };
  }

  private assertCanUpdate(
    actor: AuthenticatedUser,
    doctorUserId: string,
    dto: UpdateDoctorDto,
  ): void {
    if (actor.role === Role.ADMIN) {
      return;
    }

    const isSelf = actor.id === doctorUserId && actor.role === Role.DOCTOR;
    if (!isSelf) {
      throw new ForbiddenException('You are not allowed to update this doctor profile');
    }

    const forbiddenForSelf = [
      'specialization',
      'licenseNumber',
      'consultationFee',
      'isActive',
    ] as const;
    const attemptedRestricted = forbiddenForSelf.some((field) => dto[field] !== undefined);
    if (attemptedRestricted) {
      throw new ForbiddenException('Doctors may only update their own bio and availability status');
    }
  }

  private handleUnique(error: unknown): never {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      throw new ConflictException('A doctor with this license number already exists in the clinic');
    }
    throw error;
  }
}
