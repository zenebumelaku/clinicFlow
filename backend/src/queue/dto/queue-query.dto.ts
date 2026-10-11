import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QueueTicketStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID, Matches } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class QueueQueryDto extends PaginationQueryDto {
  @ApiProperty({ description: 'Clinic tenant scope' })
  @IsUUID('4')
  clinicId!: string;

  @ApiPropertyOptional({
    example: '2026-10-09',
    description: 'Clinic queue date; defaults to today in Ethiopia',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  queueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  doctorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  patientId?: string;

  @ApiPropertyOptional({ enum: QueueTicketStatus })
  @IsOptional()
  @IsEnum(QueueTicketStatus)
  status?: QueueTicketStatus;
}
