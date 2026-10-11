import { ApiPropertyOptional } from '@nestjs/swagger';
import { DoctorAvailabilityStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class DoctorQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'Cardiology' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  specialization?: string;

  @ApiPropertyOptional({ enum: DoctorAvailabilityStatus })
  @IsOptional()
  @IsEnum(DoctorAvailabilityStatus)
  availabilityStatus?: DoctorAvailabilityStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  branchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;
}
