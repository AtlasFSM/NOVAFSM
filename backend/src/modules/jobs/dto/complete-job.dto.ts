import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsObject, IsString } from 'class-validator';

export class CompleteJobDto {
  @ApiPropertyOptional({
    description: 'Check-out location {lat: number, lng: number, timestamp: string}',
    example: { lat: 45.5017, lng: -73.5673, timestamp: '2025-01-15T14:30:00Z' },
  })
  @IsOptional()
  @IsObject()
  checkOutLocation?: {
    lat: number;
    lng: number;
    timestamp: string;
  };

  @ApiPropertyOptional({ description: 'Completion notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
