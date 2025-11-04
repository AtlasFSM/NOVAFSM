import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsDateString } from 'class-validator';

export class AssignJobDto {
  @ApiProperty({ description: 'Technician user ID to assign' })
  @IsUUID()
  technicianId: string;

  @ApiPropertyOptional({ description: 'Scheduled start time (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  scheduledStart?: string;

  @ApiPropertyOptional({ description: 'Scheduled end time (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  scheduledEnd?: string;
}
