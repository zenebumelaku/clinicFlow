import { ApiProperty, ApiPropertyOptional } from '../../common/decorators/swagger.shim';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateClinicDto {
  @ApiProperty({ example: 'Addis Health Center', description: 'Legal clinic name' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'Clinic name is required' })
  @MinLength(2, { message: 'Clinic name must be at least 2 characters' })
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({ example: 'addis-health-center' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsOptional()
  @IsString()
  @MaxLength(180)
  slug?: string;

  @ApiProperty({ example: '+251111234567' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'Clinic phone number is required' })
  phone!: string;

  @ApiPropertyOptional({ example: 'info@addishealth.et' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid clinic email address' })
  email?: string;

  @ApiPropertyOptional({ example: 'Bole Road, Addis Ababa' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({ example: 'Addis Ababa' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'Addis Ababa' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  region?: string;

  @ApiPropertyOptional({ example: 'MOH-CLN-0001' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(80)
  licenseNumber?: string;

  @ApiPropertyOptional({ example: 'https://cdn.ClinicFlow.et/logos/addis.png' })
  @IsOptional()
  @IsUrl({}, { message: 'logoUrl must be a valid URL' })
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'Multi-specialty outpatient clinic' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
