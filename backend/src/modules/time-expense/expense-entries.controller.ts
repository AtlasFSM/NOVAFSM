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
import { ExpenseEntriesService } from './expense-entries.service';
import { CreateExpenseEntryDto } from './dto/create-expense-entry.dto';
import { UpdateExpenseEntryDto } from './dto/update-expense-entry.dto';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('expense-entries')
@Controller('expense-entries')
@UseGuards(RolesGuard)
@ApiBearerAuth('JWT')
export class ExpenseEntriesController {
  constructor(private readonly expenseEntriesService: ExpenseEntriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all expense entries with filters' })
  @ApiResponse({ status: 200, description: 'Expense entries retrieved successfully' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'jobId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async findAll(
    @Query('skip', new ParseIntPipe({ optional: true })) skip?: number,
    @Query('take', new ParseIntPipe({ optional: true })) take?: number,
    @Query('userId') userId?: string,
    @Query('jobId') jobId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.expenseEntriesService.findAll({
      skip,
      take,
      userId,
      jobId,
      startDate,
      endDate,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get expense entry by ID' })
  @ApiResponse({ status: 200, description: 'Expense entry retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Expense entry not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.expenseEntriesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new expense entry' })
  @ApiResponse({ status: 201, description: 'Expense entry created successfully' })
  async create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateExpenseEntryDto) {
    return this.expenseEntriesService.create(user.userId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update expense entry' })
  @ApiResponse({ status: 200, description: 'Expense entry updated successfully' })
  @ApiResponse({ status: 404, description: 'Expense entry not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only update own entries' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateExpenseEntryDto,
  ) {
    return this.expenseEntriesService.update(id, user.userId, user.role, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete expense entry' })
  @ApiResponse({ status: 200, description: 'Expense entry deleted successfully' })
  @ApiResponse({ status: 404, description: 'Expense entry not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only delete own entries' })
  async delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.expenseEntriesService.delete(id, user.userId, user.role);
  }
}
