import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class PaymentQueryDto extends PaginationQueryDto {
  @ApiProperty({ description: 'Clinic tenant scope' })
  @IsUUID('4')
  clinicId!: string;

  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  patientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  appointmentId?: string;
}
