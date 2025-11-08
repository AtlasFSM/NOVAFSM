import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsIn, IsBoolean } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: 'john.doe@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'John', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: '+1-555-0123', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    example: 'TECHNICIAN',
    enum: ['SUPER_ADMIN', 'ADMIN', 'DISPATCHER', 'TECHNICIAN', 'CUSTOMER'],
    description: 'User role',
    required: false,
  })
  @IsOptional()
  @IsIn(['SUPER_ADMIN', 'ADMIN', 'DISPATCHER', 'TECHNICIAN', 'CUSTOMER'])
  role?: string;

  @ApiProperty({
    example: 'ACTIVE',
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
    required: false,
  })
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
  status?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  mfaEnabled?: boolean;
}
