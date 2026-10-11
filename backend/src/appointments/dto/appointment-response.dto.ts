import { AppointmentStatus } from '@prisma/client';

export class AppointmentResponseDto {
  id!: string;
  clinicId!: string;
  patientId!: string;
  doctorId!: string;
  startsAt!: Date;
  endsAt!: Date;
  status!: AppointmentStatus;
  reason!: string | null;
  notes!: string | null;
  checkedInAt!: Date | null;
  createdAt!: Date;
  updatedAt!: Date;
  patient?: { medicalRecordNumber: string; user: { firstName: string; lastName: string } };
  doctor?: { specialization: string; user: { firstName: string; lastName: string } };
}
