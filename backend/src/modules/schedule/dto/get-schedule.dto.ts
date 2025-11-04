import { IsDateString, IsOptional, IsUUID, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetScheduleDto {
  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-01-31T23:59:59Z' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsOptional()
  technicianId?: string;

  @ApiPropertyOptional({ example: ['SCHEDULED', 'IN_PROGRESS'] })
  @IsArray()
  @IsOptional()
  status?: string[];
}
