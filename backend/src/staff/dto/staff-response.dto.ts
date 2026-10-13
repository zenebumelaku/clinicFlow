import { ApiProperty, ApiPropertyOptional } from '../../common/decorators/swagger.shim';
import { Role } from '@prisma/client';
import { UserResponseDto } from '../../auth/dto/auth-response.dto';

export class StaffResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  clinicId!: string;

  @ApiPropertyOptional({ nullable: true })
  branchId?: string | null;

  @ApiProperty()
  userId!: string;

  @ApiPropertyOptional({ nullable: true })
  jobTitle?: string | null;

  @ApiPropertyOptional({ nullable: true })
  employeeCode?: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  hiredAt!: Date;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ enum: Role })
  role!: Role;

  @ApiPropertyOptional({ type: () => UserResponseDto })
  user?: UserResponseDto;
}
