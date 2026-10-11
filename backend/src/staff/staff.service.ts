import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { UserResponseDto } from '../auth/dto/auth-response.dto';
import { BranchesService } from '../branches/branches.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StaffQueryDto } from './dto/staff-query.dto';
import { StaffResponseDto } from './dto/staff-response.dto';

const STAFF_ROLES = new Set<Role>([Role.ADMIN, Role.RECEPTIONIST, Role.DOCTOR]);

@Injectable()
export class StaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly branchesService: BranchesService,
  ) {}

  async create(clinicId: string, dto: CreateStaffDto): Promise<StaffResponseDto> {
    this.assertStaffRole(dto.role);

    if (dto.branchId) {
      await this.branchesService.assertBranchInClinic(clinicId, dto.branchId);
    }

    const user = await this.resolveUser(dto);

    const existing = await this.prisma.staffMember.findFirst({
      where: { clinicId, userId: user.id },
    });
    if (existing) {
      throw new ConflictException('This user is already a staff member of the clinic');
    }

    try {
      const staff = await this.prisma.$transaction(async (transaction) => {
        if (user.role !== dto.role) {
          await transaction.user.update({
            where: { id: user.id },
            data: { role: dto.role },
          });
          user.role = dto.role;
        }

        return transaction.staffMember.create({
          data: {
            clinicId,
            userId: user.id,
            branchId: dto.branchId || null,
            jobTitle: dto.jobTitle || null,
            employeeCode: dto.employeeCode || null,
          },
          include: { user: true },
        });
      });
      return this.map(staff);
    } catch (error) {
      this.handleUnique(error);
    }
  }

  async findAll(
    clinicId: string,
    query: StaffQueryDto,
  ): Promise<PaginatedResponseDto<StaffResponseDto>> {
    const where: Prisma.StaffMemberWhereInput = {
      clinicId,
      ...(query.branchId ? { branchId: query.branchId } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.search
        ? {
            OR: [
              { jobTitle: { contains: query.search, mode: 'insensitive' } },
              { employeeCode: { contains: query.search, mode: 'insensitive' } },
              { user: { is: { firstName: { contains: query.search, mode: 'insensitive' } } } },
              { user: { is: { lastName: { contains: query.search, mode: 'insensitive' } } } },
              { user: { is: { phone: { contains: query.search, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    };

    const [total, records] = await Promise.all([
      this.prisma.staffMember.count({ where }),
      this.prisma.staffMember.findMany({
        where,
        include: { user: true },
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

  async findOne(clinicId: string, staffId: string): Promise<StaffResponseDto> {
    const staff = await this.prisma.staffMember.findFirst({
      where: { id: staffId, clinicId },
      include: { user: true },
    });
    if (!staff) {
      throw new NotFoundException('Staff member not found in this clinic');
    }
    return this.map(staff);
  }

  async update(clinicId: string, staffId: string, dto: UpdateStaffDto): Promise<StaffResponseDto> {
    const current = await this.prisma.staffMember.findFirst({
      where: { id: staffId, clinicId },
      include: { user: true },
    });
    if (!current) {
      throw new NotFoundException('Staff member not found in this clinic');
    }

    if (dto.branchId) {
      await this.branchesService.assertBranchInClinic(clinicId, dto.branchId);
    }
    try {
      const staff = await this.prisma.$transaction(async (transaction) => {
        if (dto.role) {
          this.assertStaffRole(dto.role);
          await transaction.user.update({
            where: { id: current.userId },
            data: { role: dto.role },
          });
        }

        return transaction.staffMember.update({
          where: { id: staffId },
          data: {
            branchId: dto.branchId === undefined ? undefined : dto.branchId,
            jobTitle: dto.jobTitle,
            employeeCode: dto.employeeCode,
            isActive: dto.isActive,
          },
          include: { user: true },
        });
      });
      return this.map(staff);
    } catch (error) {
      this.handleUnique(error);
    }
  }

  async remove(clinicId: string, staffId: string): Promise<{ success: boolean; message: string }> {
    await this.findOne(clinicId, staffId);
    await this.prisma.$transaction(async (transaction) => {
      await transaction.staffMember.update({
        where: { id: staffId },
        data: { isActive: false },
      });
      await transaction.doctor.updateMany({
        where: { staffMemberId: staffId, clinicId },
        data: { isActive: false },
      });
    });
    return { success: true, message: 'Staff member deactivated successfully' };
  }

  map(staff: {
    id: string;
    clinicId: string;
    branchId: string | null;
    userId: string;
    jobTitle: string | null;
    employeeCode: string | null;
    isActive: boolean;
    hiredAt: Date;
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
  }): StaffResponseDto {
    return {
      id: staff.id,
      clinicId: staff.clinicId,
      branchId: staff.branchId,
      userId: staff.userId,
      jobTitle: staff.jobTitle,
      employeeCode: staff.employeeCode,
      isActive: staff.isActive,
      hiredAt: staff.hiredAt,
      createdAt: staff.createdAt,
      updatedAt: staff.updatedAt,
      role: staff.user?.role ?? Role.RECEPTIONIST,
      user: staff.user ? this.mapUser(staff.user) : undefined,
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

  private async resolveUser(dto: CreateStaffDto) {
    if (dto.userId) {
      const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
      if (!user || !user.isActive) {
        throw new NotFoundException('User not found or inactive');
      }
      return user;
    }

    if (!dto.phone || !dto.firstName || !dto.lastName) {
      throw new BadRequestException(
        'Phone, first name, and last name are required to create a staff user',
      );
    }

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ phone: dto.phone }, ...(dto.email ? [{ email: dto.email }] : [])],
      },
    });
    if (existing) {
      return existing;
    }

    const passwordHash = dto.password ? await bcrypt.hash(dto.password, 10) : null;
    return this.prisma.user.create({
      data: {
        phone: dto.phone,
        email: dto.email || null,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        passwordHash,
        isActive: true,
      },
    });
  }

  private assertStaffRole(role: Role): void {
    if (!STAFF_ROLES.has(role)) {
      throw new BadRequestException('Staff role must be ADMIN, RECEPTIONIST, or DOCTOR');
    }
  }

  private handleUnique(error: unknown): never {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      throw new ConflictException(
        'A staff member with this employee code already exists in the clinic',
      );
    }
    throw error;
  }
}
