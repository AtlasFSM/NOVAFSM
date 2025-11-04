import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, IsIn, IsDateString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryQuotesDto {
  @ApiProperty({
    required: false,
    description: 'Page number',
    default: 1,
    minimum: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    required: false,
    description: 'Items per page',
    default: 20,
    minimum: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiProperty({
    required: false,
    enum: ['DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED'],
    description: 'Filter by quote status'
  })
  @IsOptional()
  @IsIn(['DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED'])
  status?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by customer ID',
    format: 'uuid'
  })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by date from (ISO 8601)',
    example: '2025-01-01'
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by date to (ISO 8601)',
    example: '2025-12-31'
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiProperty({
    required: false,
    description: 'Search in quote number, title, or description'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    required: false,
    description: 'Sort field',
    enum: ['createdAt', 'number', 'total', 'validUntil'],
    default: 'createdAt'
  })
  @IsOptional()
  @IsIn(['createdAt', 'number', 'total', 'validUntil'])
  sortBy?: string = 'createdAt';

  @ApiProperty({
    required: false,
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc'
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
