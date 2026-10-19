import { ApiProperty, ApiPropertyOptional } from '../../common/decorators/swagger.shim';
import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

export class RegisterDoctorDto {
  @ApiProperty({
    example: '+251911345678',
    description: 'Unique phone number for the doctor account',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  phone!: string;

  @ApiPropertyOptional({
    example: 'doctor.hana@ClinicFlow.et',
    description: 'Email address for communication and login',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @ApiProperty({
    example: 'DoctorPass2026!',
    description: 'Account password (minimum 6 characters)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password!: string;

  @ApiProperty({
    example: 'Hana',
    description: 'First name',
  })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  @MinLength(2, { message: 'First name must be at least 2 characters' })
  firstName!: string;

  @ApiProperty({
    example: 'Tesfaye',
    description: 'Last name',
  })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  @MinLength(2, { message: 'Last name must be at least 2 characters' })
  lastName!: string;

  @ApiProperty({
    example: 'Internal Medicine',
    description: 'Medical specialization',
  })
  @IsString()
  @IsNotEmpty({ message: 'Specialization is required' })
  specialization!: string;

  @ApiProperty({
    example: 'MD-ETH-98214',
    description: 'Medical practice license number issued by regulatory authority',
  })
  @IsString()
  @IsNotEmpty({ message: 'License number is required' })
  licenseNumber!: string;

  @ApiPropertyOptional({
    example: 950,
    description: 'Consultation fee in ETB',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  consultationFee?: number;

  @ApiPropertyOptional({
    example:
      'Consultant Internist with 12+ years experience in chronic care and cardiology triage.',
    description: 'Doctor bio or profile statement',
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    example: 'c64a4b12-9c3a-4ef8-8219-c4dae16ef90e',
    description: 'Clinic ID to associate with (defaults to primary active clinic if not provided)',
  })
  @IsOptional()
  @IsUUID('4', { message: 'clinicId must be a valid UUID v4' })
  clinicId?: string;
}
