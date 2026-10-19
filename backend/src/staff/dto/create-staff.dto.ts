import { ApiProperty, ApiPropertyOptional } from '../../common/decorators/swagger.shim';
import { Role } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

const STAFF_ROLES = [Role.ADMIN, Role.RECEPTIONIST, Role.DOCTOR] as const;

export class CreateStaffDto {
  @ApiPropertyOptional({
    description: 'Existing user to attach as staff. Required if phone is not provided.',
  })
  @IsOptional()
  @IsUUID('4', { message: 'userId must be a valid UUID' })
  userId?: string;

  @ApiPropertyOptional({
    example: '+251911234567',
    description: 'Required when creating a new user',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @ValidateIf((dto: CreateStaffDto) => !dto.userId)
  @IsString()
  @IsNotEmpty({ message: 'Phone is required when userId is not provided' })
  phone?: string;

  @ApiPropertyOptional({ example: 'staff@ClinicFlow.et' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Abebe' })
  @ValidateIf((dto: CreateStaffDto) => !dto.userId)
  @IsString()
  @IsNotEmpty({ message: 'First name is required when creating a new user' })
  @MinLength(2)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Bekele' })
  @ValidateIf((dto: CreateStaffDto) => !dto.userId)
  @IsString()
  @IsNotEmpty({ message: 'Last name is required when creating a new user' })
  @MinLength(2)
  lastName?: string;

  @ApiPropertyOptional({ example: 'SecurePassword123!' })
  @ValidateIf((dto: CreateStaffDto) => !dto.userId)
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password?: string;

  @ApiProperty({ enum: STAFF_ROLES, example: Role.RECEPTIONIST })
  @IsEnum(STAFF_ROLES, { message: 'Staff role must be ADMIN, RECEPTIONIST, or DOCTOR' })
  role!: Role;

  @ApiPropertyOptional({ description: 'Optional branch assignment within the clinic' })
  @IsOptional()
  @IsUUID('4')
  branchId?: string;

  @ApiPropertyOptional({ example: 'Front Desk Supervisor' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  jobTitle?: string;

  @ApiPropertyOptional({ example: 'EMP-001' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsOptional()
  @IsString()
  @MaxLength(40)
  employeeCode?: string;
}
