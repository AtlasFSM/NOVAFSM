import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class ApproveQuoteDto {
  @ApiProperty({
    required: false,
    description: 'Approval notes or comments',
    example: 'Approved for execution. Customer signed contract.'
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
