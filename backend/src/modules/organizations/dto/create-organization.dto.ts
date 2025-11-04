import { IsString, IsEmail, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Acme Field Services' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'CAD' })
  @IsString()
  @IsOptional()
  @IsIn(['CAD', 'USD'])
  currency?: string;

  @ApiPropertyOptional({ example: '123 Main Street' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Toronto' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'ON' })
  @IsString()
  @IsOptional()
  province?: string;

  @ApiPropertyOptional({ example: 'M5V 3A8' })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiPropertyOptional({ example: 'Canada' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ example: '+1-416-555-0100' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'contact@acme.ca' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'https://acme.ca' })
  @IsString()
  @IsOptional()
  website?: string;
}
