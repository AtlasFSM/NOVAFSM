import { IsOptional, IsDateString, IsEnum, IsArray, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum DateRangePreset {
  TODAY = 'TODAY',
  YESTERDAY = 'YESTERDAY',
  LAST_7_DAYS = 'LAST_7_DAYS',
  LAST_30_DAYS = 'LAST_30_DAYS',
  LAST_90_DAYS = 'LAST_90_DAYS',
  THIS_MONTH = 'THIS_MONTH',
  LAST_MONTH = 'LAST_MONTH',
  THIS_QUARTER = 'THIS_QUARTER',
  LAST_QUARTER = 'LAST_QUARTER',
  THIS_YEAR = 'THIS_YEAR',
  LAST_YEAR = 'LAST_YEAR',
  CUSTOM = 'CUSTOM',
}

export enum MetricType {
  REVENUE = 'REVENUE',
  JOBS = 'JOBS',
  CUSTOMERS = 'CUSTOMERS',
  QUOTES = 'QUOTES',
  INVOICES = 'INVOICES',
  TECHNICIANS = 'TECHNICIANS',
  INVENTORY = 'INVENTORY',
  TIME_TRACKING = 'TIME_TRACKING',
}

export class DashboardFilterDto {
  @ApiPropertyOptional({ enum: DateRangePreset, description: 'Predefined date range' })
  @IsOptional()
  @IsEnum(DateRangePreset)
  dateRangePreset?: DateRangePreset;

  @ApiPropertyOptional({ description: 'Start date for custom range (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for custom range (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter by customer IDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  customerIds?: string[];

  @ApiPropertyOptional({ description: 'Filter by technician IDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  technicianIds?: string[];

  @ApiPropertyOptional({ description: 'Filter by site IDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  siteIds?: string[];

  @ApiPropertyOptional({ description: 'Filter by job statuses', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  jobStatuses?: string[];

  @ApiPropertyOptional({ description: 'Compare with previous period' })
  @IsOptional()
  comparePreviousPeriod?: boolean;

  @ApiPropertyOptional({ enum: MetricType, isArray: true, description: 'Specific metrics to include' })
  @IsOptional()
  @IsArray()
  @IsEnum(MetricType, { each: true })
  metrics?: MetricType[];
}
