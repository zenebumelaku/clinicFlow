import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DoctorAvailabilityStatus } from '@prisma/client';
import { UserResponseDto } from '../../auth/dto/auth-response.dto';
import { StaffResponseDto } from '../../staff/dto/staff-response.dto';

export class DoctorResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  clinicId!: string;

  @ApiProperty()
  staffMemberId!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty({ example: 'Cardiology' })
  specialization!: string;

  @ApiProperty()
  licenseNumber!: string;

  @ApiPropertyOptional({ nullable: true })
  bio?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 800 })
  consultationFee?: number | null;

  @ApiProperty({ enum: DoctorAvailabilityStatus })
  availabilityStatus!: DoctorAvailabilityStatus;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiPropertyOptional({ type: () => UserResponseDto })
  user?: UserResponseDto;

  @ApiPropertyOptional({ type: () => StaffResponseDto })
  staffMember?: StaffResponseDto;
}
