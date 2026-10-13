import { PartialType } from '../../common/decorators/swagger.shim';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '../../common/decorators/swagger.shim';
import { CreateClinicDto } from './create-clinic.dto';

export class UpdateClinicDto extends PartialType(CreateClinicDto) {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
