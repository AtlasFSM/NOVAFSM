import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { SitesService } from './sites.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('sites')
@ApiBearerAuth('JWT')
@Controller('sites')
@UseGuards(RolesGuard)
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Get()
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Get all sites for a customer' })
  @ApiQuery({ name: 'customerId', required: true, description: 'Customer UUID' })
  @ApiResponse({ status: 200, description: 'Sites retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll(@CurrentUser() user: CurrentUserPayload, @Query('customerId') customerId: string) {
    return this.sitesService.findAll(user.tenantId, customerId);
  }

  @Get(':id')
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Get site by ID' })
  @ApiParam({ name: 'id', description: 'Site UUID' })
  @ApiResponse({ status: 200, description: 'Site retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Site not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findOne(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.sitesService.findOne(user.tenantId, id);
  }

  @Post()
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Create a new site' })
  @ApiResponse({ status: 201, description: 'Site created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateSiteDto) {
    return this.sitesService.create(user.tenantId, dto);
  }

  @Put(':id')
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Update a site' })
  @ApiParam({ name: 'id', description: 'Site UUID' })
  @ApiResponse({ status: 200, description: 'Site updated successfully' })
  @ApiResponse({ status: 404, description: 'Site not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateSiteDto,
  ) {
    return this.sitesService.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Delete a site' })
  @ApiParam({ name: 'id', description: 'Site UUID' })
  @ApiResponse({ status: 200, description: 'Site deleted successfully' })
  @ApiResponse({ status: 404, description: 'Site not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete site with related records' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async delete(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.sitesService.delete(user.tenantId, id);
  }
}
