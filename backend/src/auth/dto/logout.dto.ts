import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class LogoutDto {
  @ApiPropertyOptional({
    example: 'd9b7367c336b3f71c48ef2013b860641...',
    description: 'Specific refresh token to revoke upon logout (revokes all if omitted)',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
