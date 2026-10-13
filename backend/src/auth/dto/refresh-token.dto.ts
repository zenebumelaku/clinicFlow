import { ApiProperty } from '../../common/decorators/swagger.shim';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'd9b7367c336b3f71c48ef2013b860641...',
    description: 'Valid, unexpired refresh token string',
  })
  @IsString()
  @IsNotEmpty({ message: 'refreshToken is required' })
  refreshToken!: string;
}
