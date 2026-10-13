import { ApiProperty, ApiPropertyOptional } from '../../common/decorators/swagger.shim';
import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty()
  @IsUUID('4')
  clinicId!: string;

  @ApiProperty()
  @IsUUID('4')
  patientId!: string;

  @ApiProperty()
  @IsUUID('4')
  doctorId!: string;

  @ApiProperty({ example: '2026-10-10T09:00:00.000Z' })
  @IsDateString()
  startsAt!: string;

  @ApiProperty({ example: '2026-10-10T09:30:00.000Z' })
  @IsDateString()
  endsAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  notes?: string;
}
