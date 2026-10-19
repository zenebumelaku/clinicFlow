import { ApiProperty, ApiPropertyOptional } from '../../common/decorators/swagger.shim';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class RegisterPatientDto {
  @ApiProperty({
    example: '+251911234567',
    description: 'Unique phone number for the patient account',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  phone!: string;

  @ApiPropertyOptional({
    example: 'patient@ClinicFlow.et',
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
    example: 'Ayalew',
    description: 'First name',
  })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  @MinLength(2, { message: 'First name must be at least 2 characters' })
  firstName!: string;

  @ApiProperty({
    example: 'Kebede',
    description: 'Last name',
  })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  @MinLength(2, { message: 'Last name must be at least 2 characters' })
  lastName!: string;

  @ApiPropertyOptional({
    example: 'MALE',
    description: 'Gender (MALE, FEMALE, OTHER)',
  })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({
    example: '1990-05-15',
    description: 'Date of birth (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'dateOfBirth must be a valid ISO date string' })
  dateOfBirth?: string;

  @ApiPropertyOptional({
    example: 'Tirhas Kebede',
    description: 'Emergency contact name',
  })
  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @ApiPropertyOptional({
    example: '+251911998877',
    description: 'Emergency contact phone',
  })
  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @ApiPropertyOptional({
    example: 'c64a4b12-9c3a-4ef8-8219-c4dae16ef90e',
    description: 'Clinic ID to associate with (defaults to primary clinic if not provided)',
  })
  @IsOptional()
  @IsUUID('4', { message: 'clinicId must be a valid UUID v4' })
  clinicId?: string;
}
