import { NotificationType } from '@prisma/client';

export class NotificationResponseDto {
  id!: string;
  clinicId!: string;
  userId!: string;
  appointmentId!: string | null;
  type!: NotificationType;
  title!: string;
  message!: string;
  readAt!: Date | null;
  createdAt!: Date;
}
