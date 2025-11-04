import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsIn,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BillingAddressDto {
  @ApiProperty({ example: '123 Billing St', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'Toronto', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: 'ON', required: false })
  @IsOptional()
  @IsString()
  provinceState?: string;

  @ApiProperty({ example: 'M5V 1A1', required: false })
  @IsOptional()
  @IsString()
  postalZip?: string;

  @ApiProperty({ example: 'CA', required: false })
  @IsOptional()
  @IsIn(['CA', 'US'])
  country?: string;
}

export class CreateCustomerDto {
  @ApiProperty({ example: 'Acme Corporation' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'contact@acme.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+1-416-555-1234', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: '123 Main Street', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'Toronto', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: 'ON', required: false })
  @IsOptional()
  @IsString()
  provinceState?: string;

  @ApiProperty({ example: 'M5V 1A1', required: false })
  @IsOptional()
  @IsString()
  postalZip?: string;

  @ApiProperty({ example: 'CA', default: 'CA', enum: ['CA', 'US'] })
  @IsOptional()
  @IsIn(['CA', 'US'])
  country?: string;

  @ApiProperty({ example: 43.651070, required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ example: -79.347015, required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({ example: 'ACTIVE', default: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'ARCHIVED'])
  status?: string;

  @ApiProperty({ example: ['VIP', 'Commercial'], required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ type: BillingAddressDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => BillingAddressDto)
  billingAddress?: BillingAddressDto;

  @ApiProperty({ example: 'Important customer notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
