import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsOptional, IsString, Min, IsNotEmpty } from 'class-validator';

export class CreateInventoryUsageDto {
  @ApiProperty({ description: 'Job ID' })
  @IsUUID()
  @IsNotEmpty()
  jobId: string;

  @ApiProperty({ description: 'Inventory item ID' })
  @IsUUID()
  @IsNotEmpty()
  itemId: string;

  @ApiProperty({ description: 'Quantity used', example: 2.5 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({ description: 'Usage notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
