import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClinicResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: 'Addis Health Center' })
  name!: string;

  @ApiProperty({ example: 'addis-health-center' })
  slug!: string;

  @ApiPropertyOptional({ nullable: true })
  email?: string | null;

  @ApiProperty({ example: '+251111234567' })
  phone!: string;

  @ApiPropertyOptional({ nullable: true })
  address?: string | null;

  @ApiPropertyOptional({ nullable: true })
  city?: string | null;

  @ApiPropertyOptional({ nullable: true })
  region?: string | null;

  @ApiPropertyOptional({ nullable: true })
  licenseNumber?: string | null;

  @ApiPropertyOptional({ nullable: true })
  logoUrl?: string | null;

  @ApiPropertyOptional({ nullable: true })
  description?: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
