import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsBoolean } from 'class-validator';

export class UpdatePriceListDto {
  @ApiProperty({ example: 'Standard Pricing 2024', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'Default price list for all services', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'CAD', enum: ['CAD', 'USD'], required: false })
  @IsOptional()
  @IsIn(['CAD', 'USD'])
  currency?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiProperty({ example: 'ACTIVE', enum: ['ACTIVE', 'ARCHIVED'], required: false })
  @IsOptional()
  @IsIn(['ACTIVE', 'ARCHIVED'])
  status?: string;
}
