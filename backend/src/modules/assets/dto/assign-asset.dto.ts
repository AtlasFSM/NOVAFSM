import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsUUID, IsOptional, IsDateString } from 'class-validator';
import { AssignedToType } from './create-asset.dto';

export class AssignAssetDto {
  @ApiProperty({
    enum: AssignedToType,
    description: 'Type of entity to assign to',
    example: AssignedToType.JOB,
  })
  @IsEnum(AssignedToType)
  assignedToType: AssignedToType;

  @ApiProperty({
    description: 'ID of the entity to assign to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  assignedToId: string;

  @ApiPropertyOptional({
    description: 'Expected return date',
    example: '2025-01-20',
  })
  @IsOptional()
  @IsDateString()
  expectedReturnDate?: string;
}

export class UnassignAssetDto {
  @ApiPropertyOptional({
    description: 'Notes about the unassignment',
    example: 'Equipment returned in good condition',
  })
  @IsOptional()
  notes?: string;
}

export class MaintenanceLogDto {
  @ApiProperty({
    description: 'Type of maintenance',
    example: 'Regular servicing',
  })
  type: string;

  @ApiProperty({
    description: 'Description of maintenance performed',
    example: 'Oil change and filter replacement',
  })
  description: string;

  @ApiPropertyOptional({
    description: 'Cost of maintenance',
    example: 450,
  })
  @IsOptional()
  cost?: number;

  @ApiPropertyOptional({
    description: 'Technician or company who performed maintenance',
    example: 'John Doe / ABC Maintenance Co.',
  })
  @IsOptional()
  performedBy?: string;
}
