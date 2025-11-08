import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsIn,
  IsDateString,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateQuoteLineDto } from './quote-line.dto';

export class UpdateQuoteDto {
  @ApiProperty({
    required: false,
    description: 'Customer ID',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiProperty({
    required: false,
    description: 'Site ID',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  siteId?: string;

  @ApiProperty({
    required: false,
    description: 'Quote title/subject',
    example: 'HVAC System Installation',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    required: false,
    description: 'Detailed description of work',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    required: false,
    description: 'Quote currency',
    enum: ['CAD', 'USD'],
  })
  @IsOptional()
  @IsIn(['CAD', 'USD'])
  currency?: string;

  @ApiProperty({
    required: false,
    description: 'Valid until date (ISO 8601)',
    example: '2025-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiProperty({
    required: false,
    description: 'Internal notes (not visible to customer)',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    required: false,
    description: 'Terms and conditions text',
  })
  @IsOptional()
  @IsString()
  termsConditions?: string;

  @ApiProperty({
    required: false,
    description: 'Current version number for optimistic locking',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  version?: number;

  @ApiProperty({
    required: false,
    description: 'Updated quote line items (replaces all existing lines)',
    type: [CreateQuoteLineDto],
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuoteLineDto)
  lines?: CreateQuoteLineDto[];
}
