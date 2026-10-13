import { ApiProperty } from '../../common/decorators/swagger.shim';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: '+251911234567',
    description: 'User phone number or email address',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsString()
  @IsNotEmpty({ message: 'Identifier (phone or email) is required' })
  identifier!: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'Account password (minimum 6 characters)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password!: string;
}
