import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RejectQuoteDto {
  @ApiProperty({
    description: 'Reason for rejection',
    example: 'Customer found a better price elsewhere',
  })
  @IsString()
  reason: string;
}
