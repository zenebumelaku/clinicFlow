import { ApiProperty, ApiPropertyOptional } from '../../common/decorators/swagger.shim';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePaymentDto {
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

  @ApiProperty({ example: 1200 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(9999999999.99)
  amount!: number;

  @ApiPropertyOptional({ example: 'ETB', default: 'ETB' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  currency = 'ETB';

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @ApiPropertyOptional({ enum: PaymentStatus, default: PaymentStatus.COMPLETED })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
