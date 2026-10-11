import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QueuePriority } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class CheckInQueueDto {
  @ApiProperty({ description: 'Clinic tenant scope' })
  @IsUUID('4')
  clinicId!: string;

  @ApiProperty()
  @IsUUID('4')
  patientId!: string;

  @ApiPropertyOptional({ description: 'Assign the ticket to a doctor in this clinic' })
  @IsOptional()
  @IsUUID('4')
  doctorId?: string;

  @ApiPropertyOptional({ description: 'Optional appointment linked to this queue ticket' })
  @IsOptional()
  @IsUUID('4')
  appointmentId?: string;

  @ApiPropertyOptional({ enum: QueuePriority, default: QueuePriority.NORMAL })
  @IsOptional()
  @IsEnum(QueuePriority)
  priority?: QueuePriority;
}
