import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsUUID, IsOptional, IsDateString, IsNotEmpty } from 'class-validator';

export class CreateTimeEntryDto {
  @ApiPropertyOptional({ description: 'Job ID (optional for general time entries)' })
  @IsOptional()
  @IsUUID()
  jobId?: string;

  @ApiProperty({ description: 'Entry type', enum: ['WORK', 'TRAVEL', 'BREAK'], default: 'WORK' })
  @IsEnum(['WORK', 'TRAVEL', 'BREAK'])
  type: string;

  @ApiProperty({ description: 'Start time (ISO 8601)' })
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiPropertyOptional({ description: 'End time (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
