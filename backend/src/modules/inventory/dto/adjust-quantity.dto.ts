import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class AdjustQuantityDto {
  @ApiProperty({ description: 'Adjustment amount (positive or negative)' })
  @IsNumber()
  adjustment: number;

  @ApiPropertyOptional({ description: 'Reason for adjustment' })
  @IsOptional()
  @IsString()
  reason?: string;
}
