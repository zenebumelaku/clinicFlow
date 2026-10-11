import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateDoctorDto {
  @ApiPropertyOptional({ description: 'Existing staff member to promote/link as a doctor' })
  @IsOptional()
  @IsUUID('4')
  staffMemberId?: string;

  @ApiPropertyOptional({ description: 'Existing user to attach as a doctor' })
  @IsOptional()
  @IsUUID('4')
  userId?: string;

  @ApiPropertyOptional({ example: '+251922334455' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @ValidateIf((dto: CreateDoctorDto) => !dto.staffMemberId && !dto.userId)
  @IsString()
  @IsNotEmpty({ message: 'Phone is required when creating a new doctor user' })
  phone?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Hanna' })
  @ValidateIf((dto: CreateDoctorDto) => !dto.staffMemberId && !dto.userId)
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Tadesse' })
  @ValidateIf((dto: CreateDoctorDto) => !dto.staffMemberId && !dto.userId)
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  lastName?: string;

  @ApiPropertyOptional({ example: 'SecurePassword123!' })
  @ValidateIf((dto: CreateDoctorDto) => !dto.staffMemberId && !dto.userId)
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  branchId?: string;

  @ApiProperty({ example: 'Cardiology' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'Doctor specialization is required' })
  @MaxLength(120)
  specialization!: string;

  @ApiProperty({ example: 'FMHACA-DOC-1001' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsString()
  @IsNotEmpty({ message: 'Medical license number is required' })
  @MaxLength(80)
  licenseNumber!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @ApiPropertyOptional({ example: 800, description: 'Consultation fee in ETB' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  consultationFee?: number;

  @ApiPropertyOptional({ example: 'EMP-DOC-01' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  employeeCode?: string;

  @ApiPropertyOptional({ example: 'Consultant Cardiologist' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  jobTitle?: string;
}
