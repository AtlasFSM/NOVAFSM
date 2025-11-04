import { IsString, IsUUID, IsOptional, IsBoolean, IsNumber, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSiteDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ example: 'Main Office' })
  @IsString()
  name: string;

  @ApiProperty({ example: '456 Oak Avenue' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'Vancouver' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'BC' })
  @IsString()
  province: string;

  @ApiProperty({ example: 'V6B 2M9' })
  @IsString()
  postalCode: string;

  @ApiPropertyOptional({ example: 'Canada' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ example: 49.2827 })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ example: -123.1207 })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({ example: 'Jane Smith' })
  @IsString()
  @IsOptional()
  contactName?: string;

  @ApiPropertyOptional({ example: '+1-604-555-0200' })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional({ example: 'jane.smith@example.com' })
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @ApiPropertyOptional({ example: 'Gate code: 1234' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}
