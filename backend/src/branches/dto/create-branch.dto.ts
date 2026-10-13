import { ApiProperty, ApiPropertyOptional } from '../../common/decorators/swagger.shim';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateBranchDto {
  @ApiProperty({ example: 'Bole Branch' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'Branch name is required' })
  @MinLength(2)
  @MaxLength(150)
  name!: string;

  @ApiProperty({ example: 'BOLE-01', description: 'Unique branch code within the clinic' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsString()
  @IsNotEmpty({ message: 'Branch code is required' })
  @MaxLength(40)
  code!: string;

  @ApiPropertyOptional({ example: '+251111111111' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'bole@addishealth.et' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Bole Atlas, Addis Ababa' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({ example: 'Addis Ababa' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;
}
