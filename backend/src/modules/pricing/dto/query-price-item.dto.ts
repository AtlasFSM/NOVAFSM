import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryPriceItemDto {
  @ApiProperty({ example: 'Labor', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiProperty({ example: 'SVC', required: false, description: 'Search by SKU (partial match)' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ example: 1, default: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({ example: 20, default: 20, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 20;
}
