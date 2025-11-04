import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsUUID, IsNotEmpty } from 'class-validator';

export class PresignUploadDto {
  @ApiProperty({ description: 'Entity type', enum: ['job', 'invoice', 'quote', 'customer', 'expense'] })
  @IsEnum(['job', 'invoice', 'quote', 'customer', 'expense'])
  @IsNotEmpty()
  entity: string;

  @ApiProperty({ description: 'Entity ID' })
  @IsUUID()
  @IsNotEmpty()
  entityId: string;

  @ApiProperty({ description: 'File name' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ description: 'Content type/MIME type', example: 'image/jpeg' })
  @IsString()
  @IsNotEmpty()
  contentType: string;
}
