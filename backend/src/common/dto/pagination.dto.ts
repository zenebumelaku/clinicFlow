import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100, description: 'Items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Sort by field name' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DESC, description: 'Sort direction' })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder: SortOrder = SortOrder.DESC;

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}

export class PaginationMetaDto {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;

  constructor(total: number, page: number, limit: number) {
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit) || 1;
    this.hasNextPage = page < this.totalPages;
    this.hasPreviousPage = page > 1;
  }
}

export class PaginatedResponseDto<T> {
  data: T[];
  meta: PaginationMetaDto;

  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data;
    this.meta = new PaginationMetaDto(total, page, limit);
  }
}
