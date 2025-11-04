import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsIn,
  IsNumber,
  IsUUID,
} from 'class-validator';

export class CreateSiteDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ example: 'Main Office', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: '456 Service Rd' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'Mississauga', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: 'ON', required: false })
  @IsOptional()
  @IsString()
  provinceState?: string;

  @ApiProperty({ example: 'L5B 1M5', required: false })
  @IsOptional()
  @IsString()
  postalZip?: string;

  @ApiProperty({ example: 'CA', default: 'CA', enum: ['CA', 'US'] })
  @IsOptional()
  @IsIn(['CA', 'US'])
  country?: string;

  @ApiProperty({ example: 43.589045, required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ example: -79.644120, required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({ example: 'Site-specific notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
