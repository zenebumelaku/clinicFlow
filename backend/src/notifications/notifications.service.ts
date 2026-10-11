import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';

export interface CreateNotificationInput {
  userId: string;
  clinicId: string;
  type: NotificationType;
  title: string;
  message: string;
  appointmentId?: string;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateNotificationInput): Promise<NotificationResponseDto> {
    await this.assertUserClinicAccess(input.userId, input.clinicId);
    if (input.appointmentId) {
      const appointment = await this.prisma.appointment.findFirst({
        where: { id: input.appointmentId, clinicId: input.clinicId },
      });
      if (!appointment) throw new BadRequestException('Appointment does not belong to this clinic');
    }
    const notification = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        clinicId: input.clinicId,
        appointmentId: input.appointmentId || null,
        type: input.type,
        title: input.title,
        message: input.message,
      },
    });
    return this.map(notification);
  }

  async findAll(
    userId: string,
    query: NotificationQueryDto,
  ): Promise<PaginatedResponseDto<NotificationResponseDto>> {
    await this.assertUserClinicAccess(userId, query.clinicId);
    const where: Prisma.NotificationWhereInput = {
      clinicId: query.clinicId,
      userId,
      ...(query.unreadOnly ? { readAt: null } : {}),
    };
    const [total, notifications] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return new PaginatedResponseDto(
      notifications.map((notification) => this.map(notification)),
      total,
      query.page,
      query.limit,
    );
  }

  async markRead(
    userId: string,
    clinicId: string,
    notificationId: string,
  ): Promise<NotificationResponseDto> {
    await this.assertUserClinicAccess(userId, clinicId);
    const existing = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId, clinicId },
    });
    if (!existing) throw new NotFoundException('Notification not found');

    if (!existing.readAt) {
      await this.prisma.notification.updateMany({
        where: { id: notificationId, userId, clinicId, readAt: null },
        data: { readAt: new Date() },
      });
    }
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId, clinicId },
    });
    if (!notification) throw new NotFoundException('Notification not found');
    return this.map(notification);
  }

  private async assertUserClinicAccess(userId: string, clinicId: string): Promise<void> {
    const clinic = await this.prisma.clinic.findUnique({ where: { id: clinicId } });
    if (!clinic || !clinic.isActive) throw new NotFoundException('Clinic not found');

    const [staffMembership, patientProfile] = await Promise.all([
      this.prisma.staffMember.findFirst({ where: { userId, clinicId, isActive: true } }),
      this.prisma.patient.findFirst({ where: { userId, clinicId, isActive: true } }),
    ]);
    if (!staffMembership && !patientProfile) {
      throw new ForbiddenException('You do not have access to this clinic');
    }
  }

  private map(notification: {
    id: string;
    clinicId: string;
    userId: string;
    appointmentId: string | null;
    type: NotificationType;
    title: string;
    message: string;
    readAt: Date | null;
    createdAt: Date;
  }): NotificationResponseDto {
    return {
      id: notification.id,
      clinicId: notification.clinicId,
      userId: notification.userId,
      appointmentId: notification.appointmentId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
    };
  }
}
