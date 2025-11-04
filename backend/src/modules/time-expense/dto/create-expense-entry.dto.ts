import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsUUID, IsOptional, IsNumber, IsDateString, Min, IsNotEmpty } from 'class-validator';

export class CreateExpenseEntryDto {
  @ApiPropertyOptional({ description: 'Job ID (optional for general expenses)' })
  @IsOptional()
  @IsUUID()
  jobId?: string;

  @ApiProperty({ description: 'Expense type', enum: ['MILEAGE', 'MATERIALS', 'MEALS', 'OTHER'] })
  @IsEnum(['MILEAGE', 'MATERIALS', 'MEALS', 'OTHER'])
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: 'Expense amount', example: 50.0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Currency code', enum: ['CAD', 'USD'], default: 'CAD' })
  @IsEnum(['CAD', 'USD'])
  currency: string;

  @ApiProperty({ description: 'Expense description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'Receipt URL' })
  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @ApiProperty({ description: 'Expense date (ISO 8601)' })
  @IsDateString()
  @IsNotEmpty()
  expenseDate: string;
}
