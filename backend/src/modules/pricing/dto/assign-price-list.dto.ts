import { IsString, IsOptional, IsArray, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignPriceListToCustomersDto {
  @ApiProperty({ description: 'Customer IDs to assign', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  customerIds: string[];

  @ApiPropertyOptional({ description: 'Assignment notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UnassignPriceListFromCustomersDto {
  @ApiProperty({ description: 'Customer IDs to unassign', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  customerIds: string[];
}
