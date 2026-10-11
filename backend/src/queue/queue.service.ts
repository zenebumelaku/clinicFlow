import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, NotificationType, Prisma, QueuePriority, QueueTicketStatus } from '@prisma/client';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CheckInQueueDto } from './dto/check-in-queue.dto';
import { QueueQueryDto } from './dto/queue-query.dto';
import { QueueTicketResponseDto } from './dto/queue-ticket-response.dto';

@Injectable()
export class QueueService {
  constructor(private readonly prisma: PrismaService) {}

  async checkIn(dto: CheckInQueueDto): Promise<QueueTicketResponseDto> {
    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, clinicId: dto.clinicId, isActive: true },
    });
    if (!patient)
      throw new BadRequestException('Patient does not belong to this clinic or is inactive');

    let doctorId = dto.doctorId;
    if (doctorId) await this.assertDoctorInClinic(dto.clinicId, doctorId);

    const queueDate = this.currentQueueDate();
    return this.withSerializationRetry(async () => {
      try {
        return await this.prisma.$transaction(
          async (transaction) => {
            let appointment: { id: string; patientId: string; doctorId: string; status: AppointmentStatus } | null = null;
            if (dto.appointmentId) {
              appointment = await transaction.appointment.findFirst({
                where: { id: dto.appointmentId, clinicId: dto.clinicId },
                select: { id: true, patientId: true, doctorId: true, status: true },
              });
              if (!appointment) {
                throw new BadRequestException('Appointment does not belong to this clinic');
              }
              if (appointment.patientId !== dto.patientId) {
                throw new BadRequestException('Appointment does not belong to this patient');
              }
              if (dto.doctorId && appointment.doctorId !== dto.doctorId) {
                throw new BadRequestException('Appointment is assigned to a different doctor');
              }
              if (
                appointment.status !== AppointmentStatus.SCHEDULED &&
                appointment.status !== AppointmentStatus.CONFIRMED
              ) {
                throw new BadRequestException('Appointment is not available for check-in');
              }
              await this.assertDoctorInClinic(dto.clinicId, appointment.doctorId);
              doctorId = appointment.doctorId;
            }

            const counter = await transaction.queueDailyCounter.upsert({
              where: { clinicId_queueDate: { clinicId: dto.clinicId, queueDate } },
              create: { clinicId: dto.clinicId, queueDate, lastNumber: 1 },
              update: { lastNumber: { increment: 1 } },
            });
            const ticket = await transaction.queueTicket.create({
              data: {
                clinicId: dto.clinicId,
                patientId: dto.patientId,
                doctorId: doctorId || null,
                appointmentId: dto.appointmentId || null,
                queueDate,
                queueNumber: counter.lastNumber,
                priority: dto.priority ?? QueuePriority.NORMAL,
              },
              include: {
                patient: { include: { user: true } },
                doctor: { include: { user: true } },
              },
            });
            if (appointment) {
              const updated = await transaction.appointment.updateMany({
                where: { id: appointment.id, clinicId: dto.clinicId, status: appointment.status },
                data: { status: AppointmentStatus.CHECKED_IN, checkedInAt: new Date() },
              });
              if (updated.count !== 1) {
                throw new ConflictException('Appointment changed while check-in was in progress');
              }
            }
            await transaction.notification.create({
              data: {
                clinicId: dto.clinicId,
                userId: patient.userId,
                appointmentId: dto.appointmentId || null,
                type: NotificationType.QUEUE_UPDATE,
                title: 'Checked in',
                message: `Your clinic check-in is complete. Queue number ${ticket.queueNumber}.`,
              },
            });
            const position = await this.waitingPosition(transaction, ticket);
            return this.map(ticket, position);
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
      } catch (error) {
        this.handleUniqueConflict(error);
      }
    });
  }

  async findAll(
    query: QueueQueryDto,
    patientUserId?: string,
  ): Promise<PaginatedResponseDto<QueueTicketResponseDto>> {
    const queueDate = query.queueDate
      ? this.parseQueueDate(query.queueDate)
      : this.currentQueueDate();
    const where: Prisma.QueueTicketWhereInput = {
      clinicId: query.clinicId,
      queueDate,
      ...(query.doctorId ? { doctorId: query.doctorId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.patientId ? { patientId: query.patientId } : {}),
      ...(patientUserId ? { patient: { is: { userId: patientUserId } } } : {}),
    };
    const [total, tickets] = await Promise.all([
      this.prisma.queueTicket.count({ where }),
      this.prisma.queueTicket.findMany({
        where,
        include: { patient: { include: { user: true } }, doctor: { include: { user: true } } },
        skip: query.skip,
        take: query.limit,
        orderBy: [{ priority: 'asc' }, { queueNumber: 'asc' }],
      }),
    ]);
    return new PaginatedResponseDto(
      await Promise.all(tickets.map(async ticket => this.map(
        ticket,
        await this.waitingPosition(this.prisma, ticket),
      ))),
      total,
      query.page,
      query.limit,
    );
  }

  async call(clinicId: string, ticketId: string): Promise<QueueTicketResponseDto> {
    return this.transition(clinicId, ticketId, [QueueTicketStatus.WAITING], {
      status: QueueTicketStatus.CALLED,
      calledAt: new Date(),
    }, QueueTicketStatus.CALLED);
  }

  async start(clinicId: string, ticketId: string): Promise<QueueTicketResponseDto> {
    return this.transition(clinicId, ticketId, [QueueTicketStatus.CALLED], {
      status: QueueTicketStatus.IN_CONSULTATION,
      consultationStartedAt: new Date(),
    }, QueueTicketStatus.IN_CONSULTATION);
  }

  async complete(clinicId: string, ticketId: string): Promise<QueueTicketResponseDto> {
    return this.transition(clinicId, ticketId, [QueueTicketStatus.IN_CONSULTATION], {
      status: QueueTicketStatus.COMPLETED,
      completedAt: new Date(),
    }, QueueTicketStatus.COMPLETED);
  }

  async skip(clinicId: string, ticketId: string): Promise<QueueTicketResponseDto> {
    return this.transition(
      clinicId,
      ticketId,
      [QueueTicketStatus.WAITING, QueueTicketStatus.CALLED],
      { status: QueueTicketStatus.SKIPPED, skippedAt: new Date() },
      QueueTicketStatus.SKIPPED,
    );
  }

  private async transition(
    clinicId: string,
    ticketId: string,
    allowedFrom: QueueTicketStatus[],
    data: Prisma.QueueTicketUpdateManyMutationInput,
    nextStatus: QueueTicketStatus,
  ): Promise<QueueTicketResponseDto> {
    return this.withSerializationRetry(() =>
      this.prisma.$transaction(
        async (transaction) => {
          const current = await transaction.queueTicket.findFirst({
            where: { id: ticketId, clinicId },
            include: { patient: { select: { userId: true } } },
          });
          if (!current) throw new NotFoundException('Queue ticket not found in this clinic');
          if (!allowedFrom.includes(current.status)) {
            throw new BadRequestException(
              `Invalid queue transition from ${current.status} for this action`,
            );
          }

          const result = await transaction.queueTicket.updateMany({
            where: { id: ticketId, clinicId, status: current.status },
            data,
          });
          if (result.count !== 1) {
            throw new ConflictException(
              'Queue ticket was changed by another user; refresh and retry',
            );
          }

          const title =
            nextStatus === QueueTicketStatus.CALLED
              ? 'Your turn is ready'
              : nextStatus === QueueTicketStatus.IN_CONSULTATION
                ? 'Consultation started'
                : nextStatus === QueueTicketStatus.COMPLETED
                  ? 'Consultation completed'
                  : 'Queue status updated';

          if (
            current.appointmentId &&
            (nextStatus === QueueTicketStatus.IN_CONSULTATION ||
              nextStatus === QueueTicketStatus.COMPLETED)
          ) {
            const expectedStatus =
              nextStatus === QueueTicketStatus.IN_CONSULTATION
                ? AppointmentStatus.CHECKED_IN
                : AppointmentStatus.IN_CONSULTATION;
            const appointmentStatus =
              nextStatus === QueueTicketStatus.IN_CONSULTATION
                ? AppointmentStatus.IN_CONSULTATION
                : AppointmentStatus.COMPLETED;
            const appointmentUpdate = await transaction.appointment.updateMany({
              where: {
                id: current.appointmentId,
                clinicId,
                status: expectedStatus,
              },
              data: { status: appointmentStatus },
            });
            if (appointmentUpdate.count !== 1) {
              throw new ConflictException(
                'Appointment status changed concurrently; refresh and retry',
              );
            }
          }

          await transaction.notification.create({
            data: {
              clinicId,
              userId: current.patient.userId,
              appointmentId: current.appointmentId,
              type: NotificationType.QUEUE_UPDATE,
              title,
              message: `Your queue ticket status is now ${nextStatus}.`,
            },
          });

          const updated = await transaction.queueTicket.findFirst({
            where: { id: ticketId, clinicId },
            include: { patient: { include: { user: true } }, doctor: { include: { user: true } } },
          });
          if (!updated) throw new NotFoundException('Queue ticket not found in this clinic');
          const position = await this.waitingPosition(transaction, updated);
          return this.map(updated, position);
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ),
    );
  }

  private async waitingPosition(
    client: Pick<Prisma.TransactionClient, 'queueTicket'> | PrismaService,
    ticket: { clinicId: string; queueDate: Date; queueNumber: number; priority: QueuePriority; status: QueueTicketStatus },
  ): Promise<number> {
    if (ticket.status !== QueueTicketStatus.WAITING) return 0;
    const priorityRank: Record<QueuePriority, number> = {
      [QueuePriority.EMERGENCY]: 0,
      [QueuePriority.URGENT]: 1,
      [QueuePriority.NORMAL]: 2,
    };
    const earlierPriorities = Object.entries(priorityRank)
      .filter(([, rank]) => rank < priorityRank[ticket.priority])
      .map(([priority]) => priority as QueuePriority);
    const count = await client.queueTicket.count({
      where: {
        clinicId: ticket.clinicId,
        queueDate: ticket.queueDate,
        status: QueueTicketStatus.WAITING,
        OR: [
          ...(earlierPriorities.length ? [{ priority: { in: earlierPriorities } }] : []),
          { priority: ticket.priority, queueNumber: { lte: ticket.queueNumber } },
        ],
      },
    });
    return count;
  }

  private async assertDoctorInClinic(clinicId: string, doctorId: string): Promise<void> {
    const doctor = await this.prisma.doctor.findFirst({
      where: { id: doctorId, clinicId, isActive: true },
    });
    if (!doctor)
      throw new BadRequestException('Doctor does not belong to this clinic or is inactive');
  }

  private currentQueueDate(now = new Date()): Date {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Addis_Ababa',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
    return this.parseQueueDate(parts);
  }

  private parseQueueDate(date: string): Date {
    const parsed = new Date(`${date}T00:00:00.000Z`);
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
      throw new BadRequestException('Queue date must be a valid YYYY-MM-DD date');
    }
    return parsed;
  }

  private async withSerializationRetry<T>(operation: () => Promise<T>): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const isSerializationConflict =
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          (error as { code: string }).code === 'P2034';
        if (!isSerializationConflict) throw error;
        if (attempt === 2) {
          throw new ConflictException('Queue was updated concurrently; refresh and retry');
        }
      }
    }
    throw new ConflictException('Queue was updated concurrently; refresh and retry');
  }

  private handleUniqueConflict(error: unknown): never {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      throw new ConflictException('A queue ticket already exists for this appointment');
    }
    throw error;
  }

  private map(ticket: {
    id: string;
    clinicId: string;
    patientId: string;
    doctorId: string | null;
    appointmentId: string | null;
    queueDate: Date;
    queueNumber: number;
    priority: QueuePriority;
    status: QueueTicketStatus;
    checkedInAt: Date;
    calledAt: Date | null;
    consultationStartedAt: Date | null;
    completedAt: Date | null;
    skippedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    patient?: { medicalRecordNumber: string; user: { firstName: string; lastName: string } };
    doctor?: { specialization: string; user: { firstName: string; lastName: string } } | null;
  }, position = 0): QueueTicketResponseDto {
    const now = new Date();
    const waitingEnd = ticket.consultationStartedAt ?? ticket.skippedAt ?? now;
    const consultationEnd = ticket.completedAt ?? now;
    const secondsBetween = (start: Date, end: Date) =>
      Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
    return {
      id: ticket.id,
      clinicId: ticket.clinicId,
      patientId: ticket.patientId,
      doctorId: ticket.doctorId,
      appointmentId: ticket.appointmentId,
      queueDate: ticket.queueDate.toISOString().slice(0, 10),
      queueNumber: ticket.queueNumber,
      position,
      priority: ticket.priority,
      status: ticket.status,
      checkedInAt: ticket.checkedInAt,
      calledAt: ticket.calledAt,
      consultationStartedAt: ticket.consultationStartedAt,
      completedAt: ticket.completedAt,
      skippedAt: ticket.skippedAt,
      waitingDurationSeconds: secondsBetween(ticket.checkedInAt, waitingEnd),
      consultationDurationSeconds: ticket.consultationStartedAt
        ? secondsBetween(ticket.consultationStartedAt, consultationEnd)
        : null,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      patient: ticket.patient,
      doctor: ticket.doctor,
    };
  }
}
