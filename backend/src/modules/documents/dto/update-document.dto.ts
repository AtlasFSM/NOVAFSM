import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class UpdateDocumentDto {
  @ApiPropertyOptional({
    description: 'Document description',
    example: 'Updated description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Virtual folder path',
    example: '/projects/2024/site-b',
  })
  @IsOptional()
  @IsString()
  virtualPath?: string;

  @ApiPropertyOptional({
    description: 'Tags',
    example: ['updated', 'reviewed'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Whether document is public',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
