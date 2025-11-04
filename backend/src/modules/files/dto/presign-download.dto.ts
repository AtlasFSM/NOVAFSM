import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class PresignDownloadDto {
  @ApiProperty({ description: 'S3 object key' })
  @IsString()
  @IsNotEmpty()
  key: string;
}
