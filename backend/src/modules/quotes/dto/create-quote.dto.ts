import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsIn,
  IsDateString,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateQuoteLineDto } from './quote-line.dto';

export class CreateQuoteDto {
  @ApiProperty({
    description: 'Customer ID',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  customerId: string;

  @ApiProperty({
    required: false,
    description: 'Site ID if quote is for a specific location',
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
    example:
      'Complete installation of new HVAC system including all necessary ductwork and electrical connections',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    required: false,
    description: 'Quote currency',
    enum: ['CAD', 'USD'],
    default: 'CAD',
  })
  @IsOptional()
  @IsIn(['CAD', 'USD'])
  currency?: string = 'CAD';

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
    example: 'Customer requested expedited timeline',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    required: false,
    description: 'Terms and conditions text',
    example: 'Payment due within 30 days. 50% deposit required before work begins.',
  })
  @IsOptional()
  @IsString()
  termsConditions?: string;

  @ApiProperty({
    description: 'Quote line items',
    type: [CreateQuoteLineDto],
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateQuoteLineDto)
  lines: CreateQuoteLineDto[];
}
