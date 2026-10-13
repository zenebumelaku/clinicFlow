import { ApiProperty, ApiPropertyOptional } from '../../common/decorators/swagger.shim';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreatePatientDto {
  @ApiProperty({ description: 'Clinic tenant scope' })
  @IsUUID('4')
  clinicId!: string;

  @ApiProperty({ description: 'Existing active user with PATIENT role' })
  @ValidateIf((dto: CreatePatientDto) => !dto.phone)
  @IsUUID('4')
  userId?: string;

  @ApiPropertyOptional({ example: '+251911234567' })
  @ValidateIf((dto: CreatePatientDto) => !dto.userId)
  @IsString()
  @IsNotEmpty()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @ValidateIf((dto: CreatePatientDto) => !dto.userId)
  @IsString()
  @MinLength(2)
  firstName?: string;

  @ApiPropertyOptional()
  @ValidateIf((dto: CreatePatientDto) => !dto.userId)
  @IsString()
  @MinLength(2)
  lastName?: string;

  @ApiPropertyOptional({ example: 'MR-2026-0001' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  medicalRecordNumber?: string;

  @ApiPropertyOptional({ example: '1990-04-12' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'female' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  gender?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  emergencyContactName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  emergencyContactPhone?: string;
}
