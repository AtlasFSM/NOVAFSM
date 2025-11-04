import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePriceItemDto } from './create-price-item.dto';

export class BulkCreatePriceItemDto {
  @ApiProperty({
    type: [CreatePriceItemDto],
    example: [
      {
        priceListId: '550e8400-e29b-41d4-a716-446655440000',
        sku: 'SVC-001',
        name: 'HVAC Service Call',
        unit: 'HR',
        defaultRate: 125.00,
        category: 'Labor'
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePriceItemDto)
  items: CreatePriceItemDto[];
}
