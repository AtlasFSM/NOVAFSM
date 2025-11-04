import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsObject, IsOptional, IsNumber, IsString } from 'class-validator';

export class SubmitFormResponseDto {
  @ApiProperty({
    description: 'Form template ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  templateId: string;

  @ApiPropertyOptional({
    description: 'Form assignment ID if responding to assignment',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  assignmentId?: string;

  @ApiProperty({
    description: 'Field responses as key-value pairs',
    example: { field_001: 'Answer 1', field_002: 5, field_003: true },
  })
  @IsObject()
  responses: Record<string, any>;

  @ApiPropertyOptional({
    description: 'GPS latitude',
    example: 45.5017,
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'GPS longitude',
    example: -73.5673,
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Device information',
    example: { platform: 'iOS', version: '16.5', model: 'iPhone 14' },
  })
  @IsOptional()
  @IsObject()
  deviceInfo?: Record<string, any>;
}

export class AssignFormDto {
  @ApiProperty({
    description: 'Form template ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  templateId: string;

  @ApiProperty({
    description: 'Assignment type',
    example: 'JOB',
  })
  @IsString()
  assignedType: string;

  @ApiPropertyOptional({
    description: 'Entity ID to assign to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional({
    description: 'Job ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  jobId?: string;

  @ApiPropertyOptional({
    description: 'Due date',
    example: '2025-01-20T00:00:00Z',
  })
  @IsOptional()
  dueDate?: string;
}
