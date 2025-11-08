import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PriceListsService } from './price-lists.service';
import { CreatePriceListDto } from './dto/create-price-list.dto';
import { UpdatePriceListDto } from './dto/update-price-list.dto';
import { QueryPriceListDto } from './dto/query-price-list.dto';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('pricing/price-lists')
@Controller('pricing/price-lists')
@ApiBearerAuth('JWT')
@Roles('ADMIN', 'DISPATCHER')
export class PriceListsController {
  constructor(private readonly priceListsService: PriceListsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all price lists for tenant' })
  @ApiResponse({ status: 200, description: 'Price lists retrieved successfully' })
  async findAll(@CurrentUser() user: CurrentUserPayload, @Query() query: QueryPriceListDto) {
    return this.priceListsService.findAll(user.tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single price list by ID' })
  @ApiParam({ name: 'id', description: 'Price list ID' })
  @ApiResponse({ status: 200, description: 'Price list retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Price list not found' })
  async findOne(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.priceListsService.findOne(user.tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new price list' })
  @ApiResponse({ status: 201, description: 'Price list created successfully' })
  @ApiResponse({ status: 409, description: 'Price list name already exists' })
  async create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreatePriceListDto) {
    return this.priceListsService.create(user.tenantId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a price list' })
  @ApiParam({ name: 'id', description: 'Price list ID' })
  @ApiResponse({ status: 200, description: 'Price list updated successfully' })
  @ApiResponse({ status: 404, description: 'Price list not found' })
  @ApiResponse({ status: 409, description: 'Price list name already exists' })
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdatePriceListDto,
  ) {
    return this.priceListsService.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a price list' })
  @ApiParam({ name: 'id', description: 'Price list ID' })
  @ApiResponse({ status: 200, description: 'Price list deleted successfully' })
  @ApiResponse({ status: 404, description: 'Price list not found' })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete price list with items',
  })
  async delete(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.priceListsService.delete(user.tenantId, id);
  }

  @Patch(':id/set-default')
  @ApiOperation({ summary: 'Set a price list as the default' })
  @ApiParam({ name: 'id', description: 'Price list ID' })
  @ApiResponse({
    status: 200,
    description: 'Price list set as default successfully',
  })
  @ApiResponse({ status: 404, description: 'Price list not found' })
  @ApiResponse({
    status: 400,
    description: 'Cannot set archived price list as default',
  })
  async setDefault(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.priceListsService.setDefault(user.tenantId, id);
  }
}
