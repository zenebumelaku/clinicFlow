import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PaginatedResponseDto, SortOrder } from '../common/dto/pagination.dto';
import { CreatePatientDto } from './dto/create-patient.dto';
import { PatientQueryDto } from './dto/patient-query.dto';
import { PatientResponseDto } from './dto/patient-response.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePatientDto): Promise<PatientResponseDto> {
    const medicalRecordNumber =
      dto.medicalRecordNumber || `MR-${randomUUID().slice(0, 12).toUpperCase()}`;
    try {
      const patient = await this.prisma.$transaction(async (transaction) => {
        const user = dto.userId
          ? await transaction.user.findUnique({ where: { id: dto.userId } })
          : await transaction.user.findFirst({
              where: {
                OR: [
                  { phone: dto.phone },
                  ...(dto.email ? [{ email: dto.email }] : []),
                ],
              },
            });

        if (user && (!user.isActive || user.role !== Role.PATIENT)) {
          throw new BadRequestException('Patient identity must reference an active PATIENT account');
        }
        if (!user && (!dto.phone || !dto.firstName || !dto.lastName)) {
          throw new BadRequestException('Phone, first name, and last name are required for a new patient');
        }

        const patientUser = user || await transaction.user.create({
          data: {
            phone: dto.phone!,
            email: dto.email || null,
            firstName: dto.firstName!,
            lastName: dto.lastName!,
            role: Role.PATIENT,
          },
        });

        return transaction.patient.create({
          data: {
            clinicId: dto.clinicId,
            userId: patientUser.id,
            medicalRecordNumber,
            dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
            gender: dto.gender || null,
            address: dto.address || null,
            emergencyContactName: dto.emergencyContactName || null,
            emergencyContactPhone: dto.emergencyContactPhone || null,
          },
          include: { user: true },
        });
      });
      return this.map(patient);
    } catch (error) {
      this.handleUnique(error);
    }
  }

  async findMine(userId: string): Promise<PatientResponseDto> {
    const patient = await this.prisma.patient.findFirst({
      where: { userId, isActive: true, clinic: { isActive: true } },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });
    if (!patient) throw new NotFoundException('No active patient profile is linked to this account');
    return this.map(patient);
  }

  async findAll(query: PatientQueryDto): Promise<PaginatedResponseDto<PatientResponseDto>> {
    const where: Prisma.PatientWhereInput = {
      clinicId: query.clinicId,
      ...(query.gender ? { gender: { equals: query.gender, mode: 'insensitive' } } : {}),
      ...(query.search
        ? {
            OR: [
              { medicalRecordNumber: { contains: query.search, mode: 'insensitive' } },
              { user: { is: { firstName: { contains: query.search, mode: 'insensitive' } } } },
              { user: { is: { lastName: { contains: query.search, mode: 'insensitive' } } } },
              { user: { is: { phone: { contains: query.search, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    };
    const sortField = ['createdAt', 'updatedAt', 'medicalRecordNumber'].includes(query.sortBy || '')
      ? query.sortBy!
      : 'createdAt';
    const orderBy: Prisma.PatientOrderByWithRelationInput =
      sortField === 'medicalRecordNumber'
        ? { medicalRecordNumber: query.sortOrder === SortOrder.ASC ? 'asc' : 'desc' }
        : { [sortField]: query.sortOrder === SortOrder.ASC ? 'asc' : 'desc' };

    const [total, patients] = await Promise.all([
      this.prisma.patient.count({ where }),
      this.prisma.patient.findMany({
        where,
        include: { user: true },
        skip: query.skip,
        take: query.limit,
        orderBy,
      }),
    ]);
    return new PaginatedResponseDto(
      patients.map((patient) => this.map(patient)),
      total,
      query.page,
      query.limit,
    );
  }

  async findOne(clinicId: string, patientId: string): Promise<PatientResponseDto> {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, clinicId },
      include: { user: true },
    });
    if (!patient) throw new NotFoundException('Patient not found in this clinic');
    return this.map(patient);
  }

  async update(
    clinicId: string,
    patientId: string,
    dto: UpdatePatientDto,
  ): Promise<PatientResponseDto> {
    await this.findOne(clinicId, patientId);
    try {
      const patient = await this.prisma.patient.update({
        where: { id: patientId },
        data: {
          medicalRecordNumber: dto.medicalRecordNumber,
          dateOfBirth:
            dto.dateOfBirth === undefined
              ? undefined
              : dto.dateOfBirth
                ? new Date(dto.dateOfBirth)
                : null,
          gender: dto.gender,
          address: dto.address,
          emergencyContactName: dto.emergencyContactName,
          emergencyContactPhone: dto.emergencyContactPhone,
          isActive: dto.isActive,
        },
        include: { user: true },
      });
      return this.map(patient);
    } catch (error) {
      this.handleUnique(error);
    }
  }

  private map(patient: {
    id: string;
    clinicId: string;
    userId: string;
    medicalRecordNumber: string;
    dateOfBirth: Date | null;
    gender: string | null;
    address: string | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    user: { firstName: string; lastName: string; phone: string; email: string | null; role: Role };
  }): PatientResponseDto {
    return {
      id: patient.id,
      clinicId: patient.clinicId,
      userId: patient.userId,
      medicalRecordNumber: patient.medicalRecordNumber,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      address: patient.address,
      emergencyContactName: patient.emergencyContactName,
      emergencyContactPhone: patient.emergencyContactPhone,
      isActive: patient.isActive,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
      user: patient.user,
    };
  }

  private handleUnique(error: unknown): never {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      throw new ConflictException(
        'Patient already exists in this clinic or record number is taken',
      );
    }
    throw error;
  }
}
