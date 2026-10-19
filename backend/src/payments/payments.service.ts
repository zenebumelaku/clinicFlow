import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '../common/exceptions/http.exceptions';
import { AppointmentStatus, PaymentMethod, PaymentStatus, Prisma, Role } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '../common/config/config.service';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { ChapaService } from './chapa.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { InitializeChapaDto } from './dto/initialize-chapa.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';

export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chapaService?: ChapaService,
  ) {}

  async create(dto: CreatePaymentDto): Promise<PaymentResponseDto> {
    if (dto.method === PaymentMethod.CHAPA) {
      throw new BadRequestException('Use Chapa checkout to initialize and verify digital payments');
    }

    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, clinicId: dto.clinicId, isActive: true },
    });
    if (!patient)
      throw new BadRequestException('Patient does not belong to this clinic or is inactive');

    if (dto.appointmentId) {
      const appointment = await this.prisma.appointment.findFirst({
        where: { id: dto.appointmentId, clinicId: dto.clinicId },
      });
      if (!appointment || appointment.patientId !== dto.patientId) {
        throw new BadRequestException('Appointment does not belong to this patient and clinic');
      }
    }

    const payment = await this.prisma.$transaction(async (transaction) => {
      return transaction.payment.create({
        data: {
          clinicId: dto.clinicId,
          patientId: dto.patientId,
          appointmentId: dto.appointmentId || null,
          amount: new Prisma.Decimal(dto.amount),
          currency: dto.currency,
          method: dto.method,
          status: dto.status ?? PaymentStatus.COMPLETED,
          note: dto.note || null,
        },
      });
    });
    return this.map(payment);
  }

  async findAll(
    query: PaymentQueryDto,
    patientUserId?: string,
  ): Promise<PaginatedResponseDto<PaymentResponseDto>> {
    const where: Prisma.PaymentWhereInput = {
      clinicId: query.clinicId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.patientId ? { patientId: query.patientId } : {}),
      ...(query.appointmentId ? { appointmentId: query.appointmentId } : {}),
      ...(patientUserId ? { patient: { is: { userId: patientUserId } } } : {}),
    };
    const [total, payments] = await Promise.all([
      this.prisma.payment.count({ where }),
      this.prisma.payment.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return new PaginatedResponseDto(
      payments.map((payment) => this.map(payment)),
      total,
      query.page,
      query.limit,
    );
  }

  async initializeChapaPayment(
    dto: InitializeChapaDto,
    actor: AuthenticatedUser,
  ): Promise<{
    checkoutUrl: string;
    txRef: string;
    paymentId: string;
    amount: number;
    currency: string;
  }> {
    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, clinicId: dto.clinicId, isActive: true },
      include: { user: true },
    });
    if (!patient) {
      throw new BadRequestException('Patient not found in this clinic or is inactive');
    }

    if (actor.role === Role.PATIENT && patient.userId !== actor.id) {
      throw new ForbiddenException('You cannot initiate payments for another patient account');
    }

    if (dto.appointmentId) {
      const appointment = await this.prisma.appointment.findFirst({
        where: { id: dto.appointmentId, clinicId: dto.clinicId },
      });
      if (!appointment || appointment.patientId !== dto.patientId) {
        throw new BadRequestException('Appointment does not belong to this patient and clinic');
      }
    }

    const txRef = `cf-tx-${randomUUID()}`;
    const chapa = this.chapaService || new ChapaService(new ConfigService());

    const initResult = await chapa.initialize({
      amount: dto.amount,
      currency: 'ETB',
      email: patient.user?.email || actor.email || 'patient@ClinicFlow.et',
      firstName: patient.user?.firstName || actor.firstName || 'Patient',
      lastName: patient.user?.lastName || actor.lastName || 'User',
      phone: patient.user?.phone || actor.phone || '+251911000000',
      txRef,
      callbackUrl: dto.callbackUrl,
      returnUrl: dto.returnUrl,
      title: 'ClinicFlow Consultation Payment',
      description: dto.description || 'Consultation fee settlement',
    });

    const payment = await this.prisma.payment.create({
      data: {
        clinicId: dto.clinicId,
        patientId: dto.patientId,
        appointmentId: dto.appointmentId || null,
        amount: new Prisma.Decimal(dto.amount),
        currency: 'ETB',
        method: PaymentMethod.CHAPA,
        status: PaymentStatus.PENDING,
        note: JSON.stringify({
          provider: 'CHAPA',
          txRef,
          initiatedAt: new Date().toISOString(),
          description: dto.description,
        }),
      },
    });

    return {
      checkoutUrl: initResult.checkoutUrl,
      txRef,
      paymentId: payment.id,
      amount: dto.amount,
      currency: 'ETB',
    };
  }

  async verifyChapaPayment(
    txRef: string,
    clinicId?: string,
    actor?: AuthenticatedUser,
  ): Promise<PaymentResponseDto> {
    const payment = await this.prisma.payment.findFirst({
      where: {
        note: { contains: txRef },
        ...(clinicId ? { clinicId } : {}),
      },
      include: { appointment: true, patient: true },
    });

    if (!payment) {
      throw new NotFoundException(`No payment record found with reference ${txRef}`);
    }

    if (actor && actor.role === Role.PATIENT && payment.patient.userId !== actor.id) {
      throw new ForbiddenException('You are not authorized to verify this payment record');
    }

    // Prevent duplicate processing if already completed
    if (payment.status === PaymentStatus.COMPLETED) {
      return this.map(payment);
    }

    const chapa = this.chapaService || new ChapaService(new ConfigService());
    const verification = await chapa.verify(txRef);

    if (verification.txRef !== txRef) {
      throw new BadRequestException('Chapa returned a different transaction reference');
    }

    if (verification.status === 'success') {
      if (
        verification.amount !== Number(payment.amount) ||
        verification.currency.toUpperCase() !== payment.currency.toUpperCase()
      ) {
        throw new BadRequestException(
          'Chapa payment amount or currency does not match the payment',
        );
      }

      const updated = await this.prisma.$transaction(async (tx) => {
        const p = await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.COMPLETED,
            note: JSON.stringify({
              provider: 'CHAPA',
              txRef,
              reference: verification.reference,
              verifiedAt: new Date().toISOString(),
              method: verification.paymentMethod,
            }),
          },
        });

        if (payment.appointmentId) {
          await tx.appointment.update({
            where: { id: payment.appointmentId },
            data: { status: AppointmentStatus.CONFIRMED },
          });
        }

        return p;
      });

      return this.map(updated);
    } else if (verification.status === 'failed') {
      const failed = await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
      });
      return this.map(failed);
    }

    return this.map(payment);
  }

  getChapaService(): ChapaService {
    return this.chapaService || new ChapaService(new ConfigService());
  }

  private map(payment: {
    id: string;
    clinicId: string;
    patientId: string;
    appointmentId: string | null;
    amount: Prisma.Decimal | number;
    currency: string;
    method: CreatePaymentDto['method'];
    status: PaymentStatus;
    note: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): PaymentResponseDto {
    return {
      id: payment.id,
      clinicId: payment.clinicId,
      patientId: payment.patientId,
      appointmentId: payment.appointmentId,
      amount: Number(payment.amount),
      currency: payment.currency,
      method: payment.method,
      status: payment.status,
      note: payment.note,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }
}
