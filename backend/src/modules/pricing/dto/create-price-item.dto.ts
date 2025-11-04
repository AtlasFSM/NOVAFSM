import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsBoolean, IsNumber, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePriceItemDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  priceListId: string;

  @ApiProperty({ example: 'SVC-001' })
  @IsString()
  sku: string;

  @ApiProperty({ example: 'HVAC Service Call' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Standard HVAC service call', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'HR', enum: ['EA', 'HR', 'KM'], default: 'EA' })
  @IsOptional()
  @IsIn(['EA', 'HR', 'KM'])
  unit?: string;

  @ApiProperty({ example: 125.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  defaultRate: number;

  @ApiProperty({ example: 'GST', required: false })
  @IsOptional()
  @IsString()
  taxCode?: string;

  @ApiProperty({ example: true, default: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ example: 'Labor', required: false })
  @IsOptional()
  @IsString()
  category?: string;
}
