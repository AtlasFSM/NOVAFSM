import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsObject } from 'class-validator';

export class StartJobDto {
  @ApiPropertyOptional({
    description: 'Check-in location {lat: number, lng: number, timestamp: string}',
    example: { lat: 45.5017, lng: -73.5673, timestamp: '2025-01-15T10:30:00Z' },
  })
  @IsOptional()
  @IsObject()
  checkInLocation?: {
    lat: number;
    lng: number;
    timestamp: string;
  };
}
