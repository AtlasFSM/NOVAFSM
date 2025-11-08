import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('users')
@Controller('users')
@ApiBearerAuth('JWT')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Get all users (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          users: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              tenantId: '123e4567-e89b-12d3-a456-426614174001',
              email: 'john.doe@example.com',
              firstName: 'John',
              lastName: 'Doe',
              phone: '+1-555-0123',
              role: 'TECHNICIAN',
              status: 'ACTIVE',
              mfaEnabled: false,
              lastLoginAt: '2024-01-15T10:30:00.000Z',
              lastLoginIp: '192.168.1.1',
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-15T10:30:00.000Z',
            },
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 50,
            totalPages: 5,
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.usersService.findAll(page, limit, user.tenantId);
  }

  @Get(':id')
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          tenantId: '123e4567-e89b-12d3-a456-426614174001',
          email: 'john.doe@example.com',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1-555-0123',
          role: 'TECHNICIAN',
          status: 'ACTIVE',
          mfaEnabled: false,
          lastLoginAt: '2024-01-15T10:30:00.000Z',
          lastLoginIp: '192.168.1.1',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.usersService.findOne(id, user.tenantId);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    schema: {
      example: {
        success: true,
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          tenantId: '123e4567-e89b-12d3-a456-426614174001',
          email: 'john.doe@example.com',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1-555-0123',
          role: 'TECHNICIAN',
          status: 'ACTIVE',
          mfaEnabled: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        message: 'User created successfully',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 409, description: 'Conflict - User already exists' })
  async create(@Body() dto: CreateUserDto, @CurrentUser() user: CurrentUserPayload) {
    return this.usersService.create(dto, user.tenantId);
  }

  @Put(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    schema: {
      example: {
        success: true,
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          tenantId: '123e4567-e89b-12d3-a456-426614174001',
          email: 'john.doe@example.com',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1-555-0123',
          role: 'TECHNICIAN',
          status: 'ACTIVE',
          mfaEnabled: false,
          lastLoginAt: '2024-01-15T10:30:00.000Z',
          lastLoginIp: '192.168.1.1',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-16T14:20:00.000Z',
        },
        message: 'User updated successfully',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Conflict - Email already exists' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.usersService.update(id, dto, user.tenantId);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
    schema: {
      example: {
        success: true,
        message: 'User deleted successfully',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async delete(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.usersService.delete(id, user.tenantId);
  }

  @Post('change-password')
  @ApiOperation({ summary: 'Change own password' })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    schema: {
      example: {
        success: true,
        message: 'Password changed successfully',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid password' })
  @ApiResponse({ status: 401, description: 'Unauthorized or incorrect current password' })
  async changePassword(@Body() dto: ChangePasswordDto, @CurrentUser() user: CurrentUserPayload) {
    return this.usersService.changePassword(user.userId, dto, user.tenantId);
  }

  @Post(':id/reset-password')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Reset user password (admin only)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    schema: {
      example: {
        success: true,
        message: 'Password reset successfully',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid password' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resetPassword(
    @Param('id') id: string,
    @Body('newPassword') newPassword: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.usersService.resetPassword(id, newPassword, user.tenantId);
  }
}
