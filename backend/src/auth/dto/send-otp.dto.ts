import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { OtpPurpose } from '@prisma/client';

export class SendOtpDto {
  @ApiProperty({
    example: '+251911234567',
    description: 'Phone number or email address to receive the OTP',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'Identifier (phone number or email) is required' })
  identifier!: string;

  @ApiPropertyOptional({
    enum: OtpPurpose,
    default: OtpPurpose.LOGIN,
    description: 'Purpose of the OTP code',
  })
  @IsOptional()
  @IsEnum(OtpPurpose, { message: 'Purpose must be a valid OtpPurpose value' })
  purpose?: OtpPurpose;
}
