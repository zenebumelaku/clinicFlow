import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentStatus, Prisma } from '@prisma/client';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePaymentDto): Promise<PaymentResponseDto> {
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

  async findAll(query: PaymentQueryDto): Promise<PaginatedResponseDto<PaymentResponseDto>> {
    const where: Prisma.PaymentWhereInput = {
      clinicId: query.clinicId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.patientId ? { patientId: query.patientId } : {}),
      ...(query.appointmentId ? { appointmentId: query.appointmentId } : {}),
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
