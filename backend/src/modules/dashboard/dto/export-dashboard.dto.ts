import { IsEnum, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ExportFormat {
  CSV = 'CSV',
  EXCEL = 'EXCEL',
  PDF = 'PDF',
  JSON = 'JSON',
}

export enum ExportDataType {
  STATS = 'STATS',
  CHARTS = 'CHARTS',
  TECHNICIAN_PERFORMANCE = 'TECHNICIAN_PERFORMANCE',
  CUSTOMER_ANALYTICS = 'CUSTOMER_ANALYTICS',
  REVENUE_TREND = 'REVENUE_TREND',
  JOB_COMPLETION = 'JOB_COMPLETION',
  FULL_REPORT = 'FULL_REPORT',
}

export class ExportDashboardDto {
  @ApiProperty({ enum: ExportFormat })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiProperty({ enum: ExportDataType, isArray: true })
  @IsArray()
  @IsEnum(ExportDataType, { each: true })
  dataTypes: ExportDataType[];

  @ApiPropertyOptional({ description: 'Include comparison data' })
  @IsOptional()
  includeComparison?: boolean;

  @ApiPropertyOptional({ description: 'Include charts as images (PDF only)' })
  @IsOptional()
  includeCharts?: boolean;
}
