import { ApiProperty, ApiPropertyOptional } from '../../common/decorators/swagger.shim';
import { Role } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  id!: string;

  @ApiProperty({ example: '+251911234567' })
  phone!: string;

  @ApiPropertyOptional({ example: 'doctor@mediflow.et', nullable: true })
  email?: string | null;

  @ApiProperty({ example: 'Abebe' })
  firstName!: string;

  @ApiProperty({ example: 'Bekele' })
  lastName!: string;

  @ApiProperty({ enum: Role, example: Role.DOCTOR })
  role!: Role;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: '2026-10-08T19:30:00.000Z' })
  createdAt!: Date;
}

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Short-lived JWT Access Token',
  })
  accessToken!: string;

  @ApiProperty({
    example: 'd9b7367c336b3f71c48ef2013b860641042738210382...',
    description: 'Long-lived single-use Refresh Token',
  })
  refreshToken!: string;

  @ApiProperty({ example: '15m' })
  expiresIn!: string;

  @ApiProperty({ type: () => UserResponseDto })
  user!: UserResponseDto;
}

export class SendOtpResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'OTP sent successfully. Valid for 5 minutes.' })
  message!: string;

  @ApiProperty({ example: 60, description: 'Seconds to wait before requesting another OTP' })
  cooldownSeconds!: number;
}

export class MessageResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Logged out successfully' })
  message!: string;
}
