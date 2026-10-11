import { PaymentMethod, PaymentStatus } from '@prisma/client';

export class PaymentResponseDto {
  id!: string;
  clinicId!: string;
  patientId!: string;
  appointmentId!: string | null;
  amount!: number;
  currency!: string;
  method!: PaymentMethod;
  status!: PaymentStatus;
  note!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}
