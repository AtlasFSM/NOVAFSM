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
  ParseBoolPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { InventoryUsageService } from './inventory-usage.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { AdjustQuantityDto } from './dto/adjust-quantity.dto';
import { CreateInventoryUsageDto } from './dto/create-inventory-usage.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('inventory')
@Controller('inventory')
@UseGuards(RolesGuard)
@ApiBearerAuth('JWT')
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly usageService: InventoryUsageService,
  ) {}

  @Get()
  @Roles('ADMIN', 'DISPATCHER', 'TECHNICIAN')
  @ApiOperation({ summary: 'Get all inventory items with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Inventory items retrieved successfully' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(
    @Query('skip', new ParseIntPipe({ optional: true })) skip?: number,
    @Query('take', new ParseIntPipe({ optional: true })) take?: number,
    @Query('category') category?: string,
    @Query('isActive', new ParseBoolPipe({ optional: true })) isActive?: boolean,
    @Query('search') search?: string,
  ) {
    return this.inventoryService.findAll({
      skip,
      take,
      category,
      isActive,
      search,
    });
  }

  @Get(':id')
  @Roles('ADMIN', 'DISPATCHER', 'TECHNICIAN')
  @ApiOperation({ summary: 'Get inventory item by ID' })
  @ApiResponse({ status: 200, description: 'Inventory item retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Create new inventory item' })
  @ApiResponse({ status: 201, description: 'Inventory item created successfully' })
  @ApiResponse({ status: 409, description: 'SKU already exists' })
  async create(@Body() dto: CreateInventoryItemDto) {
    return this.inventoryService.create(dto);
  }

  @Put(':id')
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Update inventory item' })
  @ApiResponse({ status: 200, description: 'Inventory item updated successfully' })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInventoryItemDto,
  ) {
    return this.inventoryService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Delete inventory item' })
  @ApiResponse({ status: 200, description: 'Inventory item deleted successfully' })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete item with usage history' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.delete(id);
  }

  @Post(':id/adjust')
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Adjust inventory quantity' })
  @ApiResponse({ status: 200, description: 'Quantity adjusted successfully' })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  @ApiResponse({ status: 400, description: 'Invalid adjustment' })
  async adjustQuantity(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdjustQuantityDto,
  ) {
    return this.inventoryService.adjustQuantity(id, dto);
  }

  @Get('usage/job/:jobId')
  @Roles('ADMIN', 'DISPATCHER', 'TECHNICIAN')
  @ApiOperation({ summary: 'Get inventory usage for a job' })
  @ApiResponse({ status: 200, description: 'Usage records retrieved successfully' })
  async findUsageByJob(@Param('jobId', ParseUUIDPipe) jobId: string) {
    return this.usageService.findByJob(jobId);
  }

  @Post('usage')
  @Roles('ADMIN', 'DISPATCHER', 'TECHNICIAN')
  @ApiOperation({ summary: 'Record inventory usage' })
  @ApiResponse({ status: 201, description: 'Usage recorded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or insufficient quantity' })
  async createUsage(@Body() dto: CreateInventoryUsageDto) {
    return this.usageService.create(dto);
  }
}
