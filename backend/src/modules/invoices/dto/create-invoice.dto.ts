import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsUUID,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsDateString,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

class InvoiceLineDto {
  @ApiPropertyOptional({ description: 'Line item SKU' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ description: 'Line item description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Quantity', example: 1.0 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ description: 'Unit of measure', example: 'EA' })
  @IsString()
  unit: string;

  @ApiProperty({ description: 'Unit price', example: 100.0 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ description: 'Discounts applied', example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discounts?: number;

  @ApiPropertyOptional({ description: 'Tax details', type: 'array' })
  @IsOptional()
  @IsArray()
  taxes?: Array<{ code: string; rate: number; amount: number }>;

  @ApiProperty({ description: 'Line total amount', example: 100.0 })
  @IsNumber()
  @Min(0)
  amount: number;
}

export class CreateInvoiceDto {
  @ApiProperty({
    description: 'Invoice status',
    enum: ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'],
  })
  @IsEnum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'])
  status: string;

  @ApiProperty({ description: 'Currency code', enum: ['CAD', 'USD'], default: 'CAD' })
  @IsEnum(['CAD', 'USD'])
  currency: string;

  @ApiProperty({ description: 'Customer ID' })
  @IsUUID()
  customerId: string;

  @ApiPropertyOptional({ description: 'Job ID (if invoice is for a job)' })
  @IsOptional()
  @IsUUID()
  jobId?: string;

  @ApiPropertyOptional({ description: 'Quote ID (if invoice is from a quote)' })
  @IsOptional()
  @IsUUID()
  quoteId?: string;

  @ApiProperty({ description: 'Subtotal amount', example: 100.0 })
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiProperty({ description: 'Tax total amount', example: 13.0 })
  @IsNumber()
  @Min(0)
  taxTotal: number;

  @ApiProperty({ description: 'Total amount (subtotal + tax)', example: 113.0 })
  @IsNumber()
  @Min(0)
  total: number;

  @ApiProperty({ description: 'Invoice line items', type: [InvoiceLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineDto)
  lines: InvoiceLineDto[];

  @ApiPropertyOptional({ description: 'Invoice notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Terms and conditions' })
  @IsOptional()
  @IsString()
  termsConditions?: string;

  @ApiPropertyOptional({ description: 'Issue date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  issuedAt?: string;

  @ApiPropertyOptional({ description: 'Due date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @ApiPropertyOptional({ description: 'Paid date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  paidAt?: string;
}
