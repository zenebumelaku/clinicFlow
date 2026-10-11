import { ApiProperty } from '@nestjs/swagger';
import { DoctorAvailabilityStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateDoctorAvailabilityDto {
  @ApiProperty({ enum: DoctorAvailabilityStatus, example: DoctorAvailabilityStatus.AVAILABLE })
  @IsEnum(DoctorAvailabilityStatus, { message: 'Invalid doctor availability status' })
  @IsNotEmpty()
  availabilityStatus!: DoctorAvailabilityStatus;
}
