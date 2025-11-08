import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsBoolean } from 'class-validator';

export class CreatePriceListDto {
  @ApiProperty({ example: 'Standard Pricing 2024' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Default price list for all services', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'CAD', enum: ['CAD', 'USD'], default: 'CAD' })
  @IsOptional()
  @IsIn(['CAD', 'USD'])
  currency?: string;

  @ApiProperty({ example: false, default: false, required: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiProperty({
    example: 'ACTIVE',
    enum: ['ACTIVE', 'ARCHIVED'],
    default: 'ACTIVE',
    required: false,
  })
  @IsOptional()
  @IsIn(['ACTIVE', 'ARCHIVED'])
  status?: string;
}
