import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { AssignAssetDto, UnassignAssetDto, MaintenanceLogDto } from './dto/assign-asset.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Assets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post()
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Create a new asset' })
  @ApiResponse({ status: 201, description: 'Asset created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Request() req: any, @Body() dto: CreateAssetDto) {
    return this.assetsService.create(req.user.tenantId, dto);
  }

  @Get()
  @Roles('ADMIN', 'DISPATCHER', 'TECHNICIAN')
  @ApiOperation({ summary: 'Get all assets' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'assignedToType', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'Assets retrieved successfully' })
  async findAll(@Request() req: any, @Query() query: any) {
    return this.assetsService.findAll(req.user.tenantId, query);
  }

  @Get('available')
  @Roles('ADMIN', 'DISPATCHER', 'TECHNICIAN')
  @ApiOperation({ summary: 'Get available assets' })
  @ApiQuery({ name: 'category', required: false })
  @ApiResponse({ status: 200, description: 'Available assets retrieved' })
  async getAvailableAssets(@Request() req: any, @Query('category') category?: string) {
    return this.assetsService.getAvailableAssets(req.user.tenantId, category);
  }

  @Get(':id')
  @Roles('ADMIN', 'DISPATCHER', 'TECHNICIAN')
  @ApiOperation({ summary: 'Get asset by ID' })
  @ApiResponse({ status: 200, description: 'Asset retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.assetsService.findOne(req.user.tenantId, id);
  }

  @Put(':id')
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Update asset' })
  @ApiResponse({ status: 200, description: 'Asset updated successfully' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateAssetDto) {
    return this.assetsService.update(req.user.tenantId, id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete asset' })
  @ApiResponse({ status: 200, description: 'Asset deleted successfully' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete asset in use' })
  async remove(@Request() req: any, @Param('id') id: string) {
    return this.assetsService.remove(req.user.tenantId, id);
  }

  @Post(':id/assign')
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Assign asset to job, site, technician, or customer' })
  @ApiResponse({ status: 200, description: 'Asset assigned successfully' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  @ApiResponse({ status: 400, description: 'Cannot assign asset' })
  async assign(@Request() req: any, @Param('id') id: string, @Body() dto: AssignAssetDto) {
    return this.assetsService.assign(req.user.tenantId, id, dto);
  }

  @Post(':id/unassign')
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Unassign asset and mark as available' })
  @ApiResponse({ status: 200, description: 'Asset unassigned successfully' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async unassign(@Request() req: any, @Param('id') id: string, @Body() dto?: UnassignAssetDto) {
    return this.assetsService.unassign(req.user.tenantId, id, dto);
  }

  @Post(':id/maintenance')
  @Roles('ADMIN', 'DISPATCHER', 'TECHNICIAN')
  @ApiOperation({ summary: 'Add maintenance log entry' })
  @ApiResponse({ status: 200, description: 'Maintenance log added successfully' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async addMaintenanceLog(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: MaintenanceLogDto,
  ) {
    return this.assetsService.addMaintenanceLog(req.user.tenantId, id, dto);
  }
}
