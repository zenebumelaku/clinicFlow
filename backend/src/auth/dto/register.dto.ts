import { ApiProperty, ApiPropertyOptional } from '../../common/decorators/swagger.shim';
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({
    example: '+251911234567',
    description: 'Unique phone number for the user account',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  phone!: string;

  @ApiPropertyOptional({
    example: 'doctor@ClinicFlow.et',
    description: 'Email address for communication',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'Account password (minimum 6 characters)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password!: string;

  @ApiProperty({
    example: 'Abebe',
    description: 'First name',
  })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  @MinLength(2, { message: 'First name must be at least 2 characters' })
  firstName!: string;

  @ApiProperty({
    example: 'Bekele',
    description: 'Last name',
  })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  @MinLength(2, { message: 'Last name must be at least 2 characters' })
  lastName!: string;

  @ApiPropertyOptional({
    enum: Role,
    default: Role.PATIENT,
    description: 'Role within the clinic (ADMIN, RECEPTIONIST, DOCTOR, PATIENT)',
  })
  @IsOptional()
  @IsEnum(Role, { message: 'Role must be a valid ClinicFlow system role' })
  role?: Role;
}
