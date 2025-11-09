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
  ApiQuery,
} from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomersDto } from './dto/query-customers.dto';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('customers')
@ApiBearerAuth('JWT')
@Controller('customers')
@UseGuards(RolesGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Get all customers with pagination and search' })
  @ApiResponse({ status: 200, description: 'Customers retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: QueryCustomersDto,
  ) {
    return this.customersService.findAll(user.tenantId, query);
  }

  @Get('search')
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Search customers by name, email, or phone' })
  @ApiQuery({ name: 'q', required: true, description: 'Search term' })
  @ApiResponse({ status: 200, description: 'Search results retrieved' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async search(
    @CurrentUser() user: CurrentUserPayload,
    @Query('q') searchTerm: string,
  ) {
    return this.customersService.search(user.tenantId, searchTerm);
  }

  @Get('export')
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Export customers to CSV' })
  @ApiResponse({ status: 200, description: 'Customers exported successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async exportCustomers(@CurrentUser() user: CurrentUserPayload) {
    return this.customersService.exportCustomers(user.tenantId);
  }

  @Post('import')
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Import customers from CSV' })
  @ApiResponse({ status: 201, description: 'Import completed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid CSV format' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async importCustomers(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { csvContent: string },
  ) {
    return this.customersService.importCustomers(user.tenantId, body.csvContent);
  }

  @Get(':id')
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Get customer by ID' })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  @ApiResponse({ status: 200, description: 'Customer retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.customersService.findOne(user.tenantId, id);
  }

  @Post()
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateCustomerDto,
  ) {
    return this.customersService.create(user.tenantId, dto);
  }

  @Put(':id')
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Update a customer' })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  @ApiResponse({ status: 200, description: 'Customer updated successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Delete a customer' })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  @ApiResponse({ status: 200, description: 'Customer deleted successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete customer with related records' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async delete(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.customersService.delete(user.tenantId, id);
  }
}
