import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, Matches } from 'class-validator';

export enum ReportRange {
  TODAY = 'today',
  LAST_7_DAYS = '7d',
  LAST_30_DAYS = '30d',
  CUSTOM = 'custom',
}

export class ReportQueryDto {
  @ApiProperty({ description: 'Clinic tenant scope' })
  @IsUUID('4')
  clinicId!: string;

  @ApiPropertyOptional({ enum: ReportRange, default: ReportRange.TODAY })
  @IsOptional()
  @IsEnum(ReportRange)
  range = ReportRange.TODAY;

  @ApiPropertyOptional({ example: '2026-10-01', description: 'Required with range=custom' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-10-09',
    description: 'Inclusive end date for range=custom',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endDate?: string;
}
