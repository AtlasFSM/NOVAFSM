import { IsUUID, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckAvailabilityDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  technicianId: string;

  @ApiProperty({ example: '2024-01-15T09:00:00Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-01-15T17:00:00Z' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174999' })
  @IsUUID()
  @IsOptional()
  excludeJobId?: string;
}
