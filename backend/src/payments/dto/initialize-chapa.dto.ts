import { ApiProperty, ApiPropertyOptional } from '../../common/decorators/swagger.shim';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class InitializeChapaDto {
  @ApiProperty()
  @IsUUID('4')
  clinicId!: string;

  @ApiProperty()
  @IsUUID('4')
  patientId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  appointmentId?: string;

  @ApiProperty({ example: 850 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(1000000)
  amount!: number;

  @ApiPropertyOptional({ example: 'https://clinicflow.et/patient/payments' })
  @IsOptional()
  @IsString()
  returnUrl?: string;

  @ApiPropertyOptional({ example: 'https://api.clinicflow.et/api/v1/payments/chapa/webhook' })
  @IsOptional()
  @IsString()
  callbackUrl?: string;

  @ApiPropertyOptional({ example: 'Clinical Consultation Fee settlement' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
