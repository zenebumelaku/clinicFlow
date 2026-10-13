import { ApiProperty, ApiPropertyOptional } from '../../common/decorators/swagger.shim';
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { OtpPurpose } from '@prisma/client';

export class VerifyOtpDto {
  @ApiProperty({
    example: '+251911234567',
    description: 'Phone number or email address that received the OTP',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'Identifier is required' })
  identifier!: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit numeric verification code',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Matches(/^[0-9]{6}$/, { message: 'Code must be a 6-digit numeric code' })
  code!: string;

  @ApiPropertyOptional({
    enum: OtpPurpose,
    default: OtpPurpose.LOGIN,
    description: 'Purpose of the OTP code',
  })
  @IsOptional()
  @IsEnum(OtpPurpose)
  purpose?: OtpPurpose;

  @ApiPropertyOptional({
    example: 'Abebe',
    description: 'First name (required if new user account is created upon OTP verification)',
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Kebede',
    description: 'Last name (required if new user account is created upon OTP verification)',
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    example: 'patient@mediflow.et',
    description: 'Optional email address for the user',
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}
