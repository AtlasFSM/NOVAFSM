import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsArray, IsBoolean, IsEnum } from 'class-validator';

export enum DocumentEntityType {
  CUSTOMER = 'CUSTOMER',
  SITE = 'SITE',
  JOB = 'JOB',
  QUOTE = 'QUOTE',
  INVOICE = 'INVOICE',
  ASSET = 'ASSET',
  OTHER = 'OTHER',
}

export class UploadDocumentDto {
  @ApiProperty({
    description: 'Original file name',
    example: 'invoice-2024-001.pdf',
  })
  @IsString()
  originalName: string;

  @ApiProperty({
    description: 'MIME type',
    example: 'application/pdf',
  })
  @IsString()
  mimeType: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 524288,
  })
  size: number;

  @ApiPropertyOptional({
    enum: DocumentEntityType,
    description: 'Type of entity this document is related to',
    example: DocumentEntityType.JOB,
  })
  @IsOptional()
  @IsEnum(DocumentEntityType)
  entityType?: DocumentEntityType;

  @ApiPropertyOptional({
    description: 'ID of the related entity',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiPropertyOptional({
    description: 'Virtual folder path',
    example: '/projects/2024/construction-site-a',
  })
  @IsOptional()
  @IsString()
  virtualPath?: string;

  @ApiPropertyOptional({
    description: 'Tags for categorization',
    example: ['invoice', 'paid', '2024'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Document description',
    example: 'Final invoice for project completion',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether document is public to customer',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class GetPresignedUrlDto {
  @ApiProperty({
    description: 'File name',
    example: 'document.pdf',
  })
  @IsString()
  fileName: string;

  @ApiProperty({
    description: 'MIME type',
    example: 'application/pdf',
  })
  @IsString()
  mimeType: string;

  @ApiPropertyOptional({
    description: 'File size in bytes',
    example: 1048576,
  })
  @IsOptional()
  size?: number;
}

export class CreateDocumentVersionDto {
  @ApiProperty({
    description: 'Parent document ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  parentId: string;

  @ApiProperty({
    description: 'New file name',
    example: 'document-v2.pdf',
  })
  @IsString()
  fileName: string;

  @ApiProperty({
    description: 'MIME type',
    example: 'application/pdf',
  })
  @IsString()
  mimeType: string;

  @ApiProperty({
    description: 'File size',
    example: 524288,
  })
  size: number;

  @ApiPropertyOptional({
    description: 'Version notes',
    example: 'Updated with client feedback',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
