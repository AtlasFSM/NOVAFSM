import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Headers,
  BadRequestException,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiHeader,
} from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { ScheduleService } from './schedule.service';
import { JobsGateway } from './jobs-gateway';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { AssignJobDto } from './dto/assign-job.dto';
import { QueryJobsDto } from './dto/query-jobs.dto';
import { StartJobDto } from './dto/start-job.dto';
import { CompleteJobDto } from './dto/complete-job.dto';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

/**
 * Jobs/Work Orders Controller
 * REST API endpoints for job management
 */
@ApiTags('jobs')
@ApiBearerAuth('JWT')
@Controller('jobs')
@UseGuards(RolesGuard)
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly scheduleService: ScheduleService,
    private readonly jobsGateway: JobsGateway,
  ) {}

  /**
   * GET /jobs - List all jobs with filters
   */
  @Get()
  @Roles('ADMIN', 'DISPATCHER', 'TECHNICIAN')
  @ApiOperation({ summary: 'List all jobs with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Jobs retrieved successfully' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by job status' })
  @ApiQuery({ name: 'assignedTechnicianId', required: false, description: 'Filter by technician' })
  @ApiQuery({ name: 'customerId', required: false, description: 'Filter by customer' })
  @ApiQuery({ name: 'from', required: false, description: 'Filter jobs from this date' })
  @ApiQuery({ name: 'to', required: false, description: 'Filter jobs to this date' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20)' })
  async findAll(@Query() query: QueryJobsDto, @CurrentUser() user: CurrentUserPayload) {
    // If technician, only show their own jobs
    if (user.role === 'TECHNICIAN') {
      query.assignedTechnicianId = user.userId;
    }

    return this.jobsService.findAll(query);
  }

  /**
   * GET /jobs/:id - Get job details
   */
  @Get(':id')
  @Roles('ADMIN', 'DISPATCHER', 'TECHNICIAN')
  @ApiOperation({ summary: 'Get job details by ID' })
  @ApiResponse({ status: 200, description: 'Job retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiParam({ name: 'id', description: 'Job UUID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserPayload) {
    const job = await this.jobsService.findOne(id);

    // Technicians can only view their own jobs
    if (user.role === 'TECHNICIAN' && job.assignedTechnicianId !== user.userId) {
      throw new BadRequestException('You can only view jobs assigned to you');
    }

    return job;
  }

  /**
   * POST /jobs - Create a new job
   */
  @Post()
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Create a new job' })
  @ApiResponse({ status: 201, description: 'Job created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Customer or quote not found' })
  @ApiResponse({ status: 409, description: 'Schedule conflict' })
  async create(@Body() dto: CreateJobDto, @CurrentUser() user: CurrentUserPayload) {
    const job = await this.jobsService.create(dto, user.tenantId);

    // Emit WebSocket event if technician was assigned
    if (job.assignedTechnicianId) {
      this.jobsGateway.emitJobAssigned(job, user.tenantId, job.assignedTechnicianId);
    }

    return job;
  }

  /**
   * PATCH /jobs/:id - Update a job
   */
  @Patch(':id')
  @Roles('ADMIN', 'DISPATCHER', 'TECHNICIAN')
  @ApiOperation({ summary: 'Update job details (with optimistic locking)' })
  @ApiResponse({ status: 200, description: 'Job updated successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiResponse({ status: 409, description: 'Version conflict or schedule conflict' })
  @ApiParam({ name: 'id', description: 'Job UUID' })
  @ApiHeader({
    name: 'If-Match',
    description: 'Current version for optimistic locking',
    required: true,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateJobDto,
    @Headers('if-match') ifMatch: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!ifMatch) {
      throw new BadRequestException('If-Match header is required for optimistic locking');
    }

    const version = parseInt(ifMatch, 10);
    if (isNaN(version)) {
      throw new BadRequestException('If-Match header must be a valid version number');
    }

    // Get current job to check ownership
    const currentJob = await this.jobsService.findOne(id);

    // Technicians can only update their own jobs
    if (user.role === 'TECHNICIAN') {
      if (currentJob.assignedTechnicianId !== user.userId) {
        throw new BadRequestException('You can only update jobs assigned to you');
      }

      // Technicians cannot change certain fields
      delete dto.assignedTechnicianId;
      delete dto.customerId;
      delete dto.siteId;
    }

    const oldStatus = currentJob.status;
    const updatedJob = await this.jobsService.update(id, dto, version);

    // Emit WebSocket events
    if (dto.status && dto.status !== oldStatus) {
      this.jobsGateway.emitJobStatusChanged(
        updatedJob,
        user.tenantId,
        oldStatus,
        updatedJob.status,
        updatedJob.assignedTechnicianId || undefined,
      );
    } else {
      this.jobsGateway.emitJobUpdated(
        updatedJob,
        user.tenantId,
        updatedJob.assignedTechnicianId || undefined,
      );
    }

    return updatedJob;
  }

  /**
   * DELETE /jobs/:id - Delete a job
   */
  @Delete(':id')
  @Roles('ADMIN', 'DISPATCHER')
  @ApiOperation({ summary: 'Delete a job' })
  @ApiResponse({ status: 200, description: 'Job deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete completed jobs' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiParam({ name: 'id', description: 'Job UUID' })
  async delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserPayload) {
    const job = await this.jobsService.findOne(id);
    const result = await this.jobsService.delete(id);

    // Emit WebSocket event
    this.jobsGateway.emitJobDeleted(job.id, job.number, user.tenantId);

    return result;
  }

  /**
   * POST /jobs/:id/assign - Assign technician to job
   */
  @Post(':id/assign')
  @Roles('ADMIN', 'DISPATCHER')
  @HttpCode(200)
  @ApiOperation({ summary: 'Assign a technician to a job' })
  @ApiResponse({ status: 200, description: 'Technician assigned successfully' })
  @ApiResponse({ status: 404, description: 'Job or technician not found' })
  @ApiResponse({ status: 409, description: 'Schedule conflict' })
  @ApiParam({ name: 'id', description: 'Job UUID' })
  async assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignJobDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const job = await this.jobsService.assign(id, dto);

    // Emit WebSocket event
    this.jobsGateway.emitJobAssigned(job, user.tenantId, dto.technicianId);

    return job;
  }

  /**
   * POST /jobs/:id/start - Start a job
   */
  @Post(':id/start')
  @Roles('TECHNICIAN', 'ADMIN', 'DISPATCHER')
  @HttpCode(200)
  @ApiOperation({ summary: 'Start a job (change status to IN_PROGRESS)' })
  @ApiResponse({ status: 200, description: 'Job started successfully' })
  @ApiResponse({ status: 400, description: 'Invalid job status' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiParam({ name: 'id', description: 'Job UUID' })
  async start(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: StartJobDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const currentJob = await this.jobsService.findOne(id);

    // Technicians can only start their own jobs
    if (user.role === 'TECHNICIAN' && currentJob.assignedTechnicianId !== user.userId) {
      throw new BadRequestException('You can only start jobs assigned to you');
    }

    const oldStatus = currentJob.status;
    const job = await this.jobsService.start(id, dto);

    // Emit WebSocket event
    this.jobsGateway.emitJobStatusChanged(
      job,
      user.tenantId,
      oldStatus,
      job.status,
      job.assignedTechnicianId || undefined,
    );

    return job;
  }

  /**
   * POST /jobs/:id/complete - Complete a job
   */
  @Post(':id/complete')
  @Roles('TECHNICIAN', 'ADMIN', 'DISPATCHER')
  @HttpCode(200)
  @ApiOperation({ summary: 'Complete a job (change status to COMPLETED)' })
  @ApiResponse({ status: 200, description: 'Job completed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid job status' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiParam({ name: 'id', description: 'Job UUID' })
  async complete(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteJobDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const currentJob = await this.jobsService.findOne(id);

    // Technicians can only complete their own jobs
    if (user.role === 'TECHNICIAN' && currentJob.assignedTechnicianId !== user.userId) {
      throw new BadRequestException('You can only complete jobs assigned to you');
    }

    const oldStatus = currentJob.status;
    const job = await this.jobsService.complete(id, dto);

    // Emit WebSocket event
    this.jobsGateway.emitJobStatusChanged(
      job,
      user.tenantId,
      oldStatus,
      job.status,
      job.assignedTechnicianId || undefined,
    );

    return job;
  }

  /**
   * POST /jobs/:id/cancel - Cancel a job
   */
  @Post(':id/cancel')
  @Roles('ADMIN', 'DISPATCHER')
  @HttpCode(200)
  @ApiOperation({ summary: 'Cancel a job' })
  @ApiResponse({ status: 200, description: 'Job cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Cannot cancel completed jobs' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiParam({ name: 'id', description: 'Job UUID' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { reason?: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const currentJob = await this.jobsService.findOne(id);
    const oldStatus = currentJob.status;
    const job = await this.jobsService.cancel(id, body.reason);

    // Emit WebSocket event
    this.jobsGateway.emitJobStatusChanged(
      job,
      user.tenantId,
      oldStatus,
      job.status,
      job.assignedTechnicianId || undefined,
    );

    return job;
  }

  /**
   * GET /jobs/schedule - Get technician schedule (calendar view)
   * This route must be declared BEFORE the :id route to avoid conflicts
   */
  @Get('schedule')
  @Roles('ADMIN', 'DISPATCHER', 'TECHNICIAN')
  @ApiOperation({ summary: 'Get technician schedule with conflict detection' })
  @ApiResponse({ status: 200, description: 'Schedule retrieved successfully' })
  @ApiQuery({
    name: 'techId',
    required: false,
    description: 'Technician ID (required for admin/dispatcher)',
  })
  @ApiQuery({ name: 'from', required: true, description: 'Start date (ISO 8601)' })
  @ApiQuery({ name: 'to', required: true, description: 'End date (ISO 8601)' })
  async getSchedule(
    @Query('techId') techId: string | undefined,
    @Query('from') from: string,
    @Query('to') to: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!from || !to) {
      throw new BadRequestException('from and to query parameters are required');
    }

    // Technicians can only view their own schedule
    let technicianId = techId;
    if (user.role === 'TECHNICIAN') {
      technicianId = user.userId;
    }

    if (!technicianId) {
      throw new BadRequestException('techId query parameter is required for admin/dispatcher');
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      throw new BadRequestException('Invalid date format. Use ISO 8601 format.');
    }

    return this.scheduleService.getSchedule(technicianId, fromDate, toDate);
  }
}
