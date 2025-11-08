import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, IsIn, IsBoolean } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePassword123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

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
  })
  @IsIn(['SUPER_ADMIN', 'ADMIN', 'DISPATCHER', 'TECHNICIAN', 'CUSTOMER'])
  role: string;

  @ApiProperty({
    example: 'ACTIVE',
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
    default: 'ACTIVE',
    required: false,
  })
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
  status?: string;

  @ApiProperty({ example: false, default: false, required: false })
  @IsOptional()
  @IsBoolean()
  mfaEnabled?: boolean;
}
