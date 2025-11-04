import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsArray, ValidateNested, IsObject, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export enum FormFieldType {
  TEXT = 'TEXT',
  TEXTAREA = 'TEXTAREA',
  NUMBER = 'NUMBER',
  CHECKBOX = 'CHECKBOX',
  RADIO = 'RADIO',
  DROPDOWN = 'DROPDOWN',
  DATE = 'DATE',
  SIGNATURE = 'SIGNATURE',
  PHOTO = 'PHOTO',
  GPS = 'GPS',
  RATING = 'RATING',
}

export enum FormCategory {
  INSPECTION = 'INSPECTION',
  SAFETY = 'SAFETY',
  AUDIT = 'AUDIT',
  CHECKLIST = 'CHECKLIST',
  SURVEY = 'SURVEY',
  MAINTENANCE = 'MAINTENANCE',
  OTHER = 'OTHER',
}

export class FormFieldDto {
  @ApiProperty({
    description: 'Unique field ID',
    example: 'field_001',
  })
  @IsString()
  id: string;

  @ApiProperty({
    enum: FormFieldType,
    description: 'Field type',
    example: FormFieldType.TEXT,
  })
  @IsEnum(FormFieldType)
  type: FormFieldType;

  @ApiProperty({
    description: 'Field label',
    example: 'Equipment Serial Number',
  })
  @IsString()
  label: string;

  @ApiPropertyOptional({
    description: 'Field description/help text',
    example: 'Enter the serial number from the equipment label',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Is field required',
    example: true,
  })
  @IsBoolean()
  required: boolean;

  @ApiPropertyOptional({
    description: 'Field options (for dropdown, radio, checkbox)',
    example: ['Option 1', 'Option 2', 'Option 3'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  options?: string[];

  @ApiPropertyOptional({
    description: 'Default value',
    example: 'N/A',
  })
  @IsOptional()
  defaultValue?: any;

  @ApiPropertyOptional({
    description: 'Validation rules',
    example: { min: 0, max: 100, pattern: '^[A-Z0-9]+$' },
  })
  @IsOptional()
  @IsObject()
  validation?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Conditional logic',
    example: { showIf: { field_id: 'field_000', equals: 'yes' } },
  })
  @IsOptional()
  @IsObject()
  conditional?: Record<string, any>;

  @ApiProperty({
    description: 'Field order',
    example: 1,
  })
  order: number;
}

export class CreateFormTemplateDto {
  @ApiProperty({
    description: 'Form template name',
    example: 'Daily Safety Inspection',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Form description',
    example: 'Daily safety inspection checklist for construction sites',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: FormCategory,
    description: 'Form category',
    example: FormCategory.SAFETY,
  })
  @IsEnum(FormCategory)
  category: FormCategory;

  @ApiProperty({
    description: 'Form fields',
    type: [FormFieldDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormFieldDto)
  fields: FormFieldDto[];

  @ApiPropertyOptional({
    description: 'Form-level settings',
    example: { allowMultipleSubmissions: false, requireGPS: true },
  })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}
