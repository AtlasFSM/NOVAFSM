import { Controller, Get, Post, Body, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ScheduleService } from './schedule.service';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { GetScheduleDto } from './dto/get-schedule.dto';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('schedule')
@Controller('schedule')
@UseGuards(RolesGuard)
@ApiBearerAuth('JWT')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post()
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Get schedule for date range' })
  @ApiResponse({ status: 200, description: 'Schedule retrieved successfully' })
  async getSchedule(@CurrentUser() user: CurrentUserPayload, @Body() dto: GetScheduleDto) {
    return this.scheduleService.getSchedule(user.tenantId, dto);
  }

  @Post('check-availability')
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Check technician availability for time period' })
  @ApiResponse({ status: 200, description: 'Availability check completed' })
  async checkAvailability(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CheckAvailabilityDto,
  ) {
    return this.scheduleService.checkAvailability(user.tenantId, dto);
  }

  @Get('available-technicians')
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Find available technicians for a time slot' })
  @ApiResponse({ status: 200, description: 'Available technicians retrieved' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiQuery({ name: 'excludeJobId', required: false, type: String })
  async findAvailableTechnicians(
    @CurrentUser() user: CurrentUserPayload,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('excludeJobId') excludeJobId?: string,
  ) {
    return this.scheduleService.findAvailableTechnicians(
      user.tenantId,
      startDate,
      endDate,
      excludeJobId,
    );
  }

  @Get('technician/:id/utilization')
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Get technician utilization for date range' })
  @ApiResponse({ status: 200, description: 'Utilization data retrieved' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  async getTechnicianUtilization(
    @CurrentUser() user: CurrentUserPayload,
    @Query('id', ParseUUIDPipe) technicianId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.scheduleService.getTechnicianUtilization(
      user.tenantId,
      technicianId,
      startDate,
      endDate,
    );
  }

  @Get('calendar/:technicianId')
  @Roles('ADMIN', 'DISPATCHER', 'TECHNICIAN')
  @ApiOperation({ summary: 'Get calendar view for a technician on a specific date' })
  @ApiResponse({ status: 200, description: 'Calendar view retrieved' })
  @ApiQuery({ name: 'date', required: true, type: String })
  async getCalendarView(
    @CurrentUser() user: CurrentUserPayload,
    @Query('technicianId', ParseUUIDPipe) technicianId: string,
    @Query('date') date: string,
  ) {
    return this.scheduleService.getCalendarView(user.tenantId, technicianId, date);
  }

  @Get('suggest-timeslot')
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Suggest optimal time slot for a job' })
  @ApiResponse({ status: 200, description: 'Time slot suggestions retrieved' })
  @ApiQuery({ name: 'technicianId', required: true, type: String })
  @ApiQuery({ name: 'duration', required: true, type: Number, description: 'Duration in hours' })
  @ApiQuery({ name: 'preferredDate', required: true, type: String })
  async suggestTimeSlot(
    @CurrentUser() user: CurrentUserPayload,
    @Query('technicianId', ParseUUIDPipe) technicianId: string,
    @Query('duration') duration: number,
    @Query('preferredDate') preferredDate: string,
  ) {
    return this.scheduleService.suggestTimeSlot(
      user.tenantId,
      technicianId,
      duration,
      preferredDate,
    );
  }
}
