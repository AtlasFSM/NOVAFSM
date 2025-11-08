import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('organizations')
@Controller('organizations')
@UseGuards(RolesGuard)
@ApiBearerAuth('JWT')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all organizations with pagination' })
  @ApiResponse({ status: 200, description: 'Organizations retrieved successfully' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] })
  async findAll(
    @Query('skip', new ParseIntPipe({ optional: true })) skip?: number,
    @Query('take', new ParseIntPipe({ optional: true })) take?: number,
    @Query('status') status?: string,
  ) {
    return this.organizationsService.findAll({ skip, take, status });
  }

  @Get(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get organization by ID' })
  @ApiResponse({ status: 200, description: 'Organization retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.findOne(id);
  }

  @Get(':id/stats')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get organization statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async getStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.getStats(id);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create new organization' })
  @ApiResponse({ status: 201, description: 'Organization created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  async create(@Body() dto: CreateOrganizationDto) {
    return this.organizationsService.create(dto);
  }

  @Put(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update organization' })
  @ApiResponse({ status: 200, description: 'Organization updated successfully' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateOrganizationDto) {
    return this.organizationsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete organization' })
  @ApiResponse({ status: 200, description: 'Organization deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete organization with existing data' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.delete(id);
  }
}
