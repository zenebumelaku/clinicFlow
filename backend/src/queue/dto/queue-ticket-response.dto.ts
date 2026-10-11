import { QueuePriority, QueueTicketStatus } from '@prisma/client';

export class QueueTicketResponseDto {
  id!: string;
  clinicId!: string;
  patientId!: string;
  doctorId!: string | null;
  appointmentId!: string | null;
  queueDate!: string;
  queueNumber!: number;
  position!: number;
  priority!: QueuePriority;
  status!: QueueTicketStatus;
  checkedInAt!: Date;
  calledAt!: Date | null;
  consultationStartedAt!: Date | null;
  completedAt!: Date | null;
  skippedAt!: Date | null;
  waitingDurationSeconds!: number;
  consultationDurationSeconds!: number | null;
  createdAt!: Date;
  updatedAt!: Date;
  patient?: { medicalRecordNumber: string; user: { firstName: string; lastName: string } };
  doctor?: { specialization: string; user: { firstName: string; lastName: string } } | null;
}
