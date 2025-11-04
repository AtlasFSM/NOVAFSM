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
import { TimeEntriesService } from './time-entries.service';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { UpdateTimeEntryDto } from './dto/update-time-entry.dto';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('time-entries')
@Controller('time-entries')
@UseGuards(RolesGuard)
@ApiBearerAuth('JWT')
export class TimeEntriesController {
  constructor(private readonly timeEntriesService: TimeEntriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all time entries with filters' })
  @ApiResponse({ status: 200, description: 'Time entries retrieved successfully' })
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
    return this.timeEntriesService.findAll({
      skip,
      take,
      userId,
      jobId,
      startDate,
      endDate,
    });
  }

  @Get('duration')
  @ApiOperation({ summary: 'Calculate total duration for time entries' })
  @ApiResponse({ status: 200, description: 'Duration calculated successfully' })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'jobId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async calculateDuration(
    @Query('userId') userId?: string,
    @Query('jobId') jobId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.timeEntriesService.calculateDuration({
      userId,
      jobId,
      startDate,
      endDate,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get time entry by ID' })
  @ApiResponse({ status: 200, description: 'Time entry retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Time entry not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.timeEntriesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new time entry' })
  @ApiResponse({ status: 201, description: 'Time entry created successfully' })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateTimeEntryDto,
  ) {
    return this.timeEntriesService.create(user.userId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update time entry' })
  @ApiResponse({ status: 200, description: 'Time entry updated successfully' })
  @ApiResponse({ status: 404, description: 'Time entry not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only update own entries' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateTimeEntryDto,
  ) {
    return this.timeEntriesService.update(id, user.userId, user.role, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete time entry' })
  @ApiResponse({ status: 200, description: 'Time entry deleted successfully' })
  @ApiResponse({ status: 404, description: 'Time entry not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only delete own entries' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.timeEntriesService.delete(id, user.userId, user.role);
  }
}
