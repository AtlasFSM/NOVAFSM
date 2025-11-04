import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean, Min, IsNotEmpty } from 'class-validator';

export class CreateInventoryItemDto {
  @ApiProperty({ description: 'SKU/Part number' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({ description: 'Item name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Item description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: 'Unit of measure', default: 'EA', example: 'EA' })
  @IsString()
  unit: string;

  @ApiProperty({ description: 'Quantity on hand', example: 100 })
  @IsNumber()
  @Min(0)
  qtyOnHand: number;

  @ApiProperty({ description: 'Quantity reserved', example: 0 })
  @IsNumber()
  @Min(0)
  qtyReserved: number;

  @ApiPropertyOptional({ description: 'Reorder point', example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reorderPoint?: number;

  @ApiPropertyOptional({ description: 'Storage location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Unit cost', example: 25.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @ApiProperty({ description: 'Is item active', default: true })
  @IsBoolean()
  isActive: boolean;
}
