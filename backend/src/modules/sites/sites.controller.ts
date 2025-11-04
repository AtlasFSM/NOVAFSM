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
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SitesService } from './sites.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('sites')
@Controller('sites')
@UseGuards(RolesGuard)
@ApiBearerAuth('JWT')
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Get()
  @Roles('ADMIN', 'DISPATCHER', 'CUSTOMER')
  @ApiOperation({ summary: 'Get all sites with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Sites retrieved successfully' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'customerId', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query('skip', new ParseIntPipe({ optional: true })) skip?: number,
    @Query('take', new ParseIntPipe({ optional: true })) take?: number,
    @Query('customerId') customerId?: string,
    @Query('search') search?: string,
  ) {
    return this.sitesService.findAll(user.tenantId, {
      skip,
      take,
      customerId,
      search,
    });
  }

  @Get(':id')
  @Roles('ADMIN', 'DISPATCHER', 'TECHNICIAN', 'CUSTOMER')
  @ApiOperation({ summary: 'Get site by ID' })
  @ApiResponse({ status: 200, description: 'Site retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Site not found' })
  async findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.sitesService.findOne(user.tenantId, id);
  }

  @Post()
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Create new site for a customer' })
  @ApiResponse({ status: 201, description: 'Site created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateSiteDto,
  ) {
    return this.sitesService.create(user.tenantId, dto);
  }

  @Put(':id')
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Update site' })
  @ApiResponse({ status: 200, description: 'Site updated successfully' })
  @ApiResponse({ status: 404, description: 'Site not found' })
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSiteDto,
  ) {
    return this.sitesService.update(user.tenantId, id, dto);
  }

  @Patch(':id/set-primary')
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Set site as primary for customer' })
  @ApiResponse({ status: 200, description: 'Site set as primary successfully' })
  @ApiResponse({ status: 404, description: 'Site not found' })
  async setPrimary(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.sitesService.setPrimary(user.tenantId, id);
  }

  @Delete(':id')
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Delete site' })
  @ApiResponse({ status: 200, description: 'Site deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete site with associated jobs' })
  @ApiResponse({ status: 404, description: 'Site not found' })
  async delete(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.sitesService.delete(user.tenantId, id);
  }
}
