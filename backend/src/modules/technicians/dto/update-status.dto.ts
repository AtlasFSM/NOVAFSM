import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class UpdateStatusDto {
  @ApiProperty({
    description: 'Technician status',
    example: 'AVAILABLE',
    enum: ['AVAILABLE', 'ON_JOB', 'OFF_DUTY'],
  })
  @IsEnum(['AVAILABLE', 'ON_JOB', 'OFF_DUTY'])
  status: string;
}
