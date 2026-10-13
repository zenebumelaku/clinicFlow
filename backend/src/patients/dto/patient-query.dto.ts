import { ApiProperty } from '../../common/decorators/swagger.shim';
import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class PatientQueryDto extends PaginationQueryDto {
  @ApiProperty({ description: 'Clinic tenant scope' })
  @IsUUID('4')
  clinicId!: string;

  @IsOptional()
  @IsIn(['male', 'female'])
  gender?: string;
}
