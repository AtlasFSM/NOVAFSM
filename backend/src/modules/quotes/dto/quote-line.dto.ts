import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsUUID, Min, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQuoteLineDto {
  @ApiProperty({
    required: false,
    description: 'Reference to PriceItem ID if applicable',
    format: 'uuid'
  })
  @IsOptional()
  @IsUUID()
  itemId?: string;

  @ApiProperty({
    required: false,
    description: 'SKU/product code',
    example: 'SVC-001'
  })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({
    description: 'Line item description',
    example: 'HVAC Installation Service'
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Quantity',
    example: 2.5,
    minimum: 0
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  quantity: number;

  @ApiProperty({
    required: false,
    description: 'Unit of measure',
    example: 'HR',
    default: 'EA'
  })
  @IsOptional()
  @IsString()
  unit?: string = 'EA';

  @ApiProperty({
    description: 'Unit price',
    example: 150.00,
    minimum: 0
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice: number;

  @ApiProperty({
    required: false,
    description: 'Total discounts applied to this line',
    example: 25.00,
    default: 0
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discounts?: number = 0;

  @ApiProperty({
    required: false,
    description: 'Sort order for display',
    example: 0,
    default: 0
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort?: number = 0;
}

export class UpdateQuoteLineDto {
  @ApiProperty({
    required: false,
    description: 'Reference to PriceItem ID if applicable',
    format: 'uuid'
  })
  @IsOptional()
  @IsUUID()
  itemId?: string;

  @ApiProperty({
    required: false,
    description: 'SKU/product code',
    example: 'SVC-001'
  })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({
    required: false,
    description: 'Line item description',
    example: 'HVAC Installation Service'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    required: false,
    description: 'Quantity',
    example: 2.5,
    minimum: 0
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  quantity?: number;

  @ApiProperty({
    required: false,
    description: 'Unit of measure',
    example: 'HR'
  })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({
    required: false,
    description: 'Unit price',
    example: 150.00,
    minimum: 0
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice?: number;

  @ApiProperty({
    required: false,
    description: 'Total discounts applied to this line',
    example: 25.00
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discounts?: number;

  @ApiProperty({
    required: false,
    description: 'Sort order for display',
    example: 0
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort?: number;
}
