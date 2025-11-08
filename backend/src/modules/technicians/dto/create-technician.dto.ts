import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  IsObject,
  IsEnum,
} from 'class-validator';

export class CreateTechnicianDto {
  @ApiProperty({
    description: 'User ID associated with this technician',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  userId: string;

  @ApiPropertyOptional({
    description: 'Array of skill tags',
    example: ['HVAC', 'Electrical', 'Plumbing'],
    type: [String],
  })
  @IsArray()
  @IsOptional()
  skills?: string[];

  @ApiPropertyOptional({
    description: 'Array of certifications',
    example: ['Red Seal HVAC', 'Electrical License'],
    type: [String],
  })
  @IsArray()
  @IsOptional()
  certifications?: string[];

  @ApiPropertyOptional({
    description: 'Weekly availability pattern',
    example: {
      monday: { start: '08:00', end: '17:00' },
      tuesday: { start: '08:00', end: '17:00' },
    },
  })
  @IsObject()
  @IsOptional()
  availability?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Current location of technician',
    example: { lat: 49.2827, lng: -123.1207, timestamp: '2024-11-08T10:00:00Z' },
  })
  @IsObject()
  @IsOptional()
  currentLocation?: {
    lat: number;
    lng: number;
    timestamp: string;
  };

  @ApiPropertyOptional({
    description: 'Technician status',
    example: 'AVAILABLE',
    enum: ['AVAILABLE', 'ON_JOB', 'OFF_DUTY'],
  })
  @IsEnum(['AVAILABLE', 'ON_JOB', 'OFF_DUTY'])
  @IsOptional()
  status?: string;
}
