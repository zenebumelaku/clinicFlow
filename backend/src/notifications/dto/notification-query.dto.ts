import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class NotificationQueryDto extends PaginationQueryDto {
  @ApiProperty({ description: 'Clinic tenant scope' })
  @IsUUID('4')
  clinicId!: string;

  @ApiProperty({ required: false, description: 'Return only unread notifications' })
  @IsOptional()
  @Transform(({ value }) =>
    value === true || value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  unreadOnly?: boolean;
}
