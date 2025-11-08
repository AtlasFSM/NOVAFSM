import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { TechniciansService } from './technicians.service';
import { CreateTechnicianDto } from './dto/create-technician.dto';
import { UpdateTechnicianDto } from './dto/update-technician.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../common/decorators/current-user.decorator';

@ApiTags('technicians')
@Controller('technicians')
@ApiBearerAuth('JWT')
export class TechniciansController {
  constructor(private readonly techniciansService: TechniciansService) {}

  @Get()
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Get all technicians' })
  @ApiResponse({
    status: 200,
    description: 'Technicians retrieved successfully',
    schema: {
      example: {
        success: true,
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            tenantId: '123e4567-e89b-12d3-a456-426614174001',
            userId: '123e4567-e89b-12d3-a456-426614174002',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '+1-555-0123',
            skills: ['HVAC', 'Electrical', 'Plumbing'],
            certifications: ['Red Seal HVAC', 'Electrical License'],
            availability: {
              monday: { start: '08:00', end: '17:00' },
              tuesday: { start: '08:00', end: '17:00' },
            },
            currentLocation: {
              lat: 49.2827,
              lng: -123.1207,
              timestamp: '2024-11-08T10:00:00Z',
            },
            status: 'AVAILABLE',
            activeJobsCount: 2,
            completedJobsCount: 145,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-11-08T10:00:00.000Z',
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.techniciansService.findAll(user.tenantId);
  }

  @Get(':id')
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Get a technician by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Technician retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Technician not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.techniciansService.findOne(id, user.tenantId);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new technician' })
  @ApiResponse({
    status: 201,
    description: 'Technician created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Conflict - Technician already exists' })
  async create(
    @Body() dto: CreateTechnicianDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.techniciansService.create(dto, user.tenantId);
  }

  @Put(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update a technician' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Technician updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Technician not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTechnicianDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.techniciansService.update(id, dto, user.tenantId);
  }

  @Patch(':id/status')
  @Roles('ADMIN', 'DISPATCHER', 'TECHNICIAN')
  @ApiOperation({ summary: 'Update technician status' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Technician status updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Technician not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.techniciansService.updateStatus(id, dto, user.tenantId);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a technician' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Technician deleted successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - Technician has active jobs' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Technician not found' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.techniciansService.delete(id, user.tenantId);
  }
}
