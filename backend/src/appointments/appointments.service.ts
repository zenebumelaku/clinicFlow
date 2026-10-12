import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '../common/exceptions/http.exceptions';
import { AppointmentStatus, Prisma } from '@prisma/client';
import { PaginatedResponseDto, SortOrder } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentQueryDto } from './dto/appointment-query.dto';
import { AppointmentResponseDto } from './dto/appointment-response.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

const TERMINAL_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.COMPLETED,
  AppointmentStatus.CANCELLED,
  AppointmentStatus.NO_SHOW,
];

const ALLOWED_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  [AppointmentStatus.SCHEDULED]: [
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.CHECKED_IN,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
  ],
  [AppointmentStatus.CONFIRMED]: [
    AppointmentStatus.CHECKED_IN,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
  ],
  [AppointmentStatus.CHECKED_IN]: [AppointmentStatus.IN_CONSULTATION, AppointmentStatus.CANCELLED],
  [AppointmentStatus.IN_CONSULTATION]: [AppointmentStatus.COMPLETED],
  [AppointmentStatus.COMPLETED]: [],
  [AppointmentStatus.CANCELLED]: [],
  [AppointmentStatus.NO_SHOW]: [],
};

export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAppointmentDto): Promise<AppointmentResponseDto> {
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    this.assertValidInterval(startsAt, endsAt);
    try {
      return await this.prisma.$transaction(
        async (transaction) => {
          await this.assertPatientInClinic(dto.clinicId, dto.patientId, transaction);
          await this.assertDoctorInClinic(dto.clinicId, dto.doctorId, transaction);
          await this.assertNoOverlap(transaction, dto.clinicId, dto.doctorId, startsAt, endsAt);
          const appointment = await transaction.appointment.create({
            data: {
              clinicId: dto.clinicId,
              patientId: dto.patientId,
              doctorId: dto.doctorId,
              startsAt,
              endsAt,
              reason: dto.reason || null,
              notes: dto.notes || null,
            },
            include: { patient: { include: { user: true } }, doctor: { include: { user: true } } },
          });
          return this.map(appointment);
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      this.handleTransactionError(error);
    }
  }

  async findAll(
    query: AppointmentQueryDto,
    patientUserId?: string,
  ): Promise<PaginatedResponseDto<AppointmentResponseDto>> {
    const where: Prisma.AppointmentWhereInput = {
      clinicId: query.clinicId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.doctorId ? { doctorId: query.doctorId } : {}),
      ...(query.patientId ? { patientId: query.patientId } : {}),
      ...(patientUserId ? { patient: { is: { userId: patientUserId } } } : {}),
      ...(query.search
        ? {
            OR: [
              { reason: { contains: query.search, mode: 'insensitive' } },
              {
                patient: {
                  is: {
                    OR: [
                      { medicalRecordNumber: { contains: query.search, mode: 'insensitive' } },
                      {
                        user: {
                          is: {
                            OR: [
                              { firstName: { contains: query.search, mode: 'insensitive' } },
                              { lastName: { contains: query.search, mode: 'insensitive' } },
                              { phone: { contains: query.search, mode: 'insensitive' } },
                            ],
                          },
                        },
                      },
                    ],
                  },
                },
              },
              {
                doctor: {
                  is: {
                    user: {
                      is: {
                        OR: [
                          { firstName: { contains: query.search, mode: 'insensitive' } },
                          { lastName: { contains: query.search, mode: 'insensitive' } },
                        ],
                      },
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };
    const sortOrder = query.sortOrder === SortOrder.ASC ? 'asc' : 'desc';
    const [total, appointments] = await Promise.all([
      this.prisma.appointment.count({ where }),
      this.prisma.appointment.findMany({
        where,
        include: { patient: { include: { user: true } }, doctor: { include: { user: true } } },
        skip: query.skip,
        take: query.limit,
        orderBy: { [query.sortBy === 'createdAt' ? 'createdAt' : 'startsAt']: sortOrder },
      }),
    ]);
    return new PaginatedResponseDto(
      appointments.map((appointment) => this.map(appointment)),
      total,
      query.page,
      query.limit,
    );
  }

  async findOne(clinicId: string, appointmentId: string): Promise<AppointmentResponseDto> {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, clinicId },
      include: { patient: { include: { user: true } }, doctor: { include: { user: true } } },
    });
    if (!appointment) throw new NotFoundException('Appointment not found in this clinic');
    return this.map(appointment);
  }

  async update(
    clinicId: string,
    appointmentId: string,
    dto: UpdateAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    try {
      return await this.prisma.$transaction(
        async (transaction) => {
          const current = await transaction.appointment.findFirst({
            where: { id: appointmentId, clinicId },
          });
          if (!current) throw new NotFoundException('Appointment not found in this clinic');
          if (dto.status) this.assertTransition(current.status, dto.status);

          const patientId = dto.patientId ?? current.patientId;
          const doctorId = dto.doctorId ?? current.doctorId;
          const startsAt = dto.startsAt ? new Date(dto.startsAt) : current.startsAt;
          const endsAt = dto.endsAt ? new Date(dto.endsAt) : current.endsAt;
          const schedulingChanged =
            dto.patientId !== undefined ||
            dto.doctorId !== undefined ||
            dto.startsAt !== undefined ||
            dto.endsAt !== undefined;
          if (schedulingChanged) {
            if (TERMINAL_STATUSES.includes(current.status)) {
              throw new BadRequestException('A terminal appointment cannot be rescheduled');
            }
            this.assertValidInterval(startsAt, endsAt);
            await this.assertPatientInClinic(clinicId, patientId, transaction);
            await this.assertDoctorInClinic(clinicId, doctorId, transaction);
            await this.assertNoOverlap(
              transaction,
              clinicId,
              doctorId,
              startsAt,
              endsAt,
              appointmentId,
            );
          }

          const updated = await transaction.appointment.update({
            where: { id: appointmentId },
            data: {
              patientId: dto.patientId,
              doctorId: dto.doctorId,
              startsAt: dto.startsAt ? startsAt : undefined,
              endsAt: dto.endsAt ? endsAt : undefined,
              status: dto.status,
              reason: dto.reason,
              notes: dto.notes,
              ...(dto.status === AppointmentStatus.CHECKED_IN ? { checkedInAt: new Date() } : {}),
            },
            include: { patient: { include: { user: true } }, doctor: { include: { user: true } } },
          });
          return this.map(updated);
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      this.handleTransactionError(error);
    }
  }

  async cancel(clinicId: string, appointmentId: string): Promise<AppointmentResponseDto> {
    return this.update(clinicId, appointmentId, { status: AppointmentStatus.CANCELLED });
  }

  async checkIn(clinicId: string, appointmentId: string): Promise<AppointmentResponseDto> {
    return this.update(clinicId, appointmentId, { status: AppointmentStatus.CHECKED_IN });
  }

  private async assertPatientInClinic(
    clinicId: string,
    patientId: string,
    client: Pick<Prisma.TransactionClient, 'patient'> = this.prisma,
  ): Promise<void> {
    const patient = await client.patient.findFirst({
      where: { id: patientId, clinicId, isActive: true },
    });
    if (!patient)
      throw new BadRequestException('Patient does not belong to this clinic or is inactive');
  }

  private async assertDoctorInClinic(
    clinicId: string,
    doctorId: string,
    client: Pick<Prisma.TransactionClient, 'doctor'> = this.prisma,
  ): Promise<void> {
    const doctor = await client.doctor.findFirst({
      where: { id: doctorId, clinicId, isActive: true },
    });
    if (!doctor)
      throw new BadRequestException('Doctor does not belong to this clinic or is inactive');
  }

  private async assertNoOverlap(
    transaction: Pick<Prisma.TransactionClient, 'appointment'>,
    clinicId: string,
    doctorId: string,
    startsAt: Date,
    endsAt: Date,
    excludeId?: string,
  ): Promise<void> {
    const conflict = await transaction.appointment.findFirst({
      where: {
        clinicId,
        doctorId,
        status: { notIn: TERMINAL_STATUSES },
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (conflict) throw new ConflictException('Doctor already has an overlapping appointment');
  }

  private assertValidInterval(startsAt: Date, endsAt: Date): void {
    if (
      !Number.isFinite(startsAt.getTime()) ||
      !Number.isFinite(endsAt.getTime()) ||
      endsAt <= startsAt
    ) {
      throw new BadRequestException('Appointment end time must be after its start time');
    }
  }

  private assertTransition(current: AppointmentStatus, next: AppointmentStatus): void {
    if (!ALLOWED_TRANSITIONS[current].includes(next)) {
      throw new BadRequestException(`Invalid appointment status transition: ${current} to ${next}`);
    }
  }

  private handleTransactionError(error: unknown): never {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2034'
    ) {
      throw new ConflictException('Appointment scheduling conflict; retry with an available time');
    }
    throw error;
  }

  private map(appointment: {
    id: string;
    clinicId: string;
    patientId: string;
    doctorId: string;
    startsAt: Date;
    endsAt: Date;
    status: AppointmentStatus;
    reason: string | null;
    notes: string | null;
    checkedInAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    patient?: { medicalRecordNumber: string; user: { firstName: string; lastName: string } };
    doctor?: { specialization: string; user: { firstName: string; lastName: string } };
  }): AppointmentResponseDto {
    return {
      id: appointment.id,
      clinicId: appointment.clinicId,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      startsAt: appointment.startsAt,
      endsAt: appointment.endsAt,
      status: appointment.status,
      reason: appointment.reason,
      notes: appointment.notes,
      checkedInAt: appointment.checkedInAt,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
      patient: appointment.patient,
      doctor: appointment.doctor,
    };
  }
}
