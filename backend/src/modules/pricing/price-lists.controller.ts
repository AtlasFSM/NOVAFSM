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
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { PriceListsService } from './price-lists.service';
import { CreatePriceListDto } from './dto/create-price-list.dto';
import { UpdatePriceListDto } from './dto/update-price-list.dto';
import { QueryPriceListDto } from './dto/query-price-list.dto';
import { AssignPriceListToCustomersDto, UnassignPriceListFromCustomersDto } from './dto/assign-price-list.dto';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../common/decorators/current-user.decorator';
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
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: QueryPriceListDto,
  ) {
    return this.priceListsService.findAll(user.tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single price list by ID' })
  @ApiParam({ name: 'id', description: 'Price list ID' })
  @ApiResponse({ status: 200, description: 'Price list retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Price list not found' })
  async findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.priceListsService.findOne(user.tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new price list' })
  @ApiResponse({ status: 201, description: 'Price list created successfully' })
  @ApiResponse({ status: 409, description: 'Price list name already exists' })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreatePriceListDto,
  ) {
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
  async delete(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
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
  async setDefault(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.priceListsService.setDefault(user.tenantId, id);
  }

  @Post(':id/assign-customers')
  @ApiOperation({ summary: 'Assign a price list to specific customers' })
  @ApiParam({ name: 'id', description: 'Price list ID' })
  @ApiResponse({
    status: 200,
    description: 'Price list assigned to customers successfully',
  })
  @ApiResponse({ status: 404, description: 'Price list or customers not found' })
  @ApiResponse({
    status: 400,
    description: 'Cannot assign archived price list',
  })
  async assignToCustomers(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: AssignPriceListToCustomersDto,
  ) {
    return this.priceListsService.assignToCustomers(
      user.tenantId,
      id,
      user.userId,
      dto,
    );
  }

  @Post(':id/unassign-customers')
  @ApiOperation({ summary: 'Unassign a price list from specific customers' })
  @ApiParam({ name: 'id', description: 'Price list ID' })
  @ApiResponse({
    status: 200,
    description: 'Price list unassigned from customers successfully',
  })
  @ApiResponse({ status: 404, description: 'Price list not found' })
  async unassignFromCustomers(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UnassignPriceListFromCustomersDto,
  ) {
    return this.priceListsService.unassignFromCustomers(user.tenantId, id, dto);
  }

  @Get(':id/assigned-customers')
  @ApiOperation({ summary: 'Get all customers assigned to a price list' })
  @ApiParam({ name: 'id', description: 'Price list ID' })
  @ApiResponse({
    status: 200,
    description: 'Assigned customers retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Price list not found' })
  async getAssignedCustomers(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.priceListsService.getAssignedCustomers(user.tenantId, id);
  }

  @Get('customer/:customerId/price-lists')
  @ApiOperation({ summary: 'Get all price lists assigned to a customer' })
  @ApiParam({ name: 'customerId', description: 'Customer ID' })
  @ApiResponse({
    status: 200,
    description: 'Customer price lists retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async getCustomerPriceLists(
    @CurrentUser() user: CurrentUserPayload,
    @Param('customerId') customerId: string,
  ) {
    return this.priceListsService.getCustomerPriceLists(user.tenantId, customerId);
  }
}
