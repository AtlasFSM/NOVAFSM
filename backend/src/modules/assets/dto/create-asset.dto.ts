import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsDateString,
  IsNumber,
  IsObject,
  Min,
} from 'class-validator';

export enum AssetCategory {
  HEAVY_EQUIPMENT = 'HEAVY_EQUIPMENT',
  VEHICLE = 'VEHICLE',
  TOOL = 'TOOL',
  MODULE = 'MODULE',
  TRAILER = 'TRAILER',
  OTHER = 'OTHER',
}

export enum AssetStatus {
  AVAILABLE = 'AVAILABLE',
  IN_USE = 'IN_USE',
  MAINTENANCE = 'MAINTENANCE',
  RETIRED = 'RETIRED',
}

export enum AssignedToType {
  JOB = 'JOB',
  SITE = 'SITE',
  TECHNICIAN = 'TECHNICIAN',
  CUSTOMER = 'CUSTOMER',
}

export class CreateAssetDto {
  @ApiProperty({
    enum: AssetCategory,
    description: 'Asset category',
    example: AssetCategory.HEAVY_EQUIPMENT,
  })
  @IsEnum(AssetCategory)
  category: AssetCategory;

  @ApiProperty({
    description: 'Asset name',
    example: 'Excavator CAT 320',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Serial number',
    example: 'SN-CAT-320-2024-001',
  })
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @ApiPropertyOptional({
    description: 'Model',
    example: 'CAT 320 GC',
  })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({
    description: 'Vendor/Manufacturer',
    example: 'Caterpillar',
  })
  @IsOptional()
  @IsString()
  vendor?: string;

  @ApiPropertyOptional({
    description: 'Purchase date',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @ApiPropertyOptional({
    description: 'Purchase cost',
    example: 250000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  purchaseCost?: number;

  @ApiPropertyOptional({
    description: 'Warranty expiration date',
    example: '2027-01-15',
  })
  @IsOptional()
  @IsDateString()
  warrantyExpires?: string;

  @ApiPropertyOptional({
    description: 'Hourly rental rate',
    example: 250,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @ApiPropertyOptional({
    description: 'Daily rental rate',
    example: 2000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  dailyRate?: number;

  @ApiPropertyOptional({
    description: 'Technical specifications',
    example: { weight: '20000kg', engine: 'C4.4 ACERT', power: '121hp' },
  })
  @IsOptional()
  @IsObject()
  specifications?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'QR Code for asset tracking',
    example: 'QR-ASSET-001',
  })
  @IsOptional()
  @IsString()
  qrCode?: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Requires special operator license',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
