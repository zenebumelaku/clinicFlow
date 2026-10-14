import { ApiProperty } from '../../common/decorators/swagger.shim';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: '+251911234567' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(254)
  identifier!: string;

  @ApiProperty({ example: '123456' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Matches(/^[0-9]{6}$/, { message: 'Code must be a 6-digit numeric code' })
  code!: string;

  @ApiProperty({ minLength: 8, example: 'A-secure-password-123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
