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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { PriceItemsService } from './price-items.service';
import { CreatePriceItemDto } from './dto/create-price-item.dto';
import { UpdatePriceItemDto } from './dto/update-price-item.dto';
import { QueryPriceItemDto } from './dto/query-price-item.dto';
import { BulkCreatePriceItemDto } from './dto/bulk-create-price-item.dto';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('pricing/price-items')
@Controller('pricing/price-items')
@ApiBearerAuth('JWT')
@Roles('ADMIN', 'DISPATCHER')
export class PriceItemsController {
  constructor(private readonly priceItemsService: PriceItemsService) {}

  @Get('price-list/:priceListId')
  @ApiOperation({ summary: 'Get all price items for a price list' })
  @ApiParam({ name: 'priceListId', description: 'Price list ID' })
  @ApiResponse({ status: 200, description: 'Price items retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Price list not found' })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Param('priceListId') priceListId: string,
    @Query() query: QueryPriceItemDto,
  ) {
    return this.priceItemsService.findAll(user.tenantId, priceListId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single price item by ID' })
  @ApiParam({ name: 'id', description: 'Price item ID' })
  @ApiResponse({ status: 200, description: 'Price item retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Price item not found' })
  async findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.priceItemsService.findOne(user.tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new price item' })
  @ApiResponse({ status: 201, description: 'Price item created successfully' })
  @ApiResponse({ status: 404, description: 'Price list not found' })
  @ApiResponse({
    status: 409,
    description: 'Price item SKU already exists in this price list',
  })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreatePriceItemDto,
  ) {
    return this.priceItemsService.create(user.tenantId, dto);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk create price items' })
  @ApiResponse({ status: 201, description: 'Price items created successfully' })
  @ApiResponse({ status: 404, description: 'One or more price lists not found' })
  @ApiResponse({
    status: 409,
    description: 'One or more SKUs already exist',
  })
  @ApiResponse({
    status: 400,
    description: 'Duplicate SKUs in request',
  })
  async bulkCreate(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: BulkCreatePriceItemDto,
  ) {
    return this.priceItemsService.bulkCreate(user.tenantId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a price item' })
  @ApiParam({ name: 'id', description: 'Price item ID' })
  @ApiResponse({ status: 200, description: 'Price item updated successfully' })
  @ApiResponse({ status: 404, description: 'Price item not found' })
  @ApiResponse({
    status: 409,
    description: 'Price item SKU already exists in this price list',
  })
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdatePriceItemDto,
  ) {
    return this.priceItemsService.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a price item' })
  @ApiParam({ name: 'id', description: 'Price item ID' })
  @ApiResponse({ status: 200, description: 'Price item deleted successfully' })
  @ApiResponse({ status: 404, description: 'Price item not found' })
  async delete(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.priceItemsService.delete(user.tenantId, id);
  }
}
