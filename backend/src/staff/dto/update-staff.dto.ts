import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

const STAFF_ROLES = [Role.ADMIN, Role.RECEPTIONIST, Role.DOCTOR] as const;

export class UpdateStaffDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  branchId?: string | null;

  @ApiPropertyOptional({ example: 'Clinic Manager' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  jobTitle?: string;

  @ApiPropertyOptional({ example: 'EMP-002' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsOptional()
  @IsString()
  @MaxLength(40)
  employeeCode?: string;

  @ApiPropertyOptional({ enum: STAFF_ROLES })
  @IsOptional()
  @IsEnum(STAFF_ROLES, { message: 'Staff role must be ADMIN, RECEPTIONIST, or DOCTOR' })
  role?: Role;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
