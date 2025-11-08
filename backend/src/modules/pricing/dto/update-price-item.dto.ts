import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsBoolean, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePriceItemDto {
  @ApiProperty({ example: 'SVC-001', required: false })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ example: 'HVAC Service Call', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'Standard HVAC service call', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'HR', enum: ['EA', 'HR', 'KM'], required: false })
  @IsOptional()
  @IsIn(['EA', 'HR', 'KM'])
  unit?: string;

  @ApiProperty({ example: 125.0, required: false })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  defaultRate?: number;

  @ApiProperty({ example: 'GST', required: false })
  @IsOptional()
  @IsString()
  taxCode?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ example: 'Labor', required: false })
  @IsOptional()
  @IsString()
  category?: string;
}
