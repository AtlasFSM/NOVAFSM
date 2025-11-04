import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsIn, IsBoolean, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryPriceListDto {
  @ApiProperty({ example: 'ACTIVE', enum: ['ACTIVE', 'ARCHIVED'], required: false })
  @IsOptional()
  @IsIn(['ACTIVE', 'ARCHIVED'])
  status?: string;

  @ApiProperty({ example: 'CAD', enum: ['CAD', 'USD'], required: false })
  @IsOptional()
  @IsIn(['CAD', 'USD'])
  currency?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isDefault?: boolean;

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
