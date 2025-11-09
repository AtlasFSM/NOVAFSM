import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Res,
  UseGuards,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AnalyticsService } from './analytics.service';
import { ExportService } from './export.service';
import {
  DashboardFilterDto,
  DashboardStatsDto,
  DashboardChartsDto,
  ExportDashboardDto,
} from './dto';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('api/v1/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly exportService: ExportService,
  ) {}

  @Get('stats')
  @Roles('ADMIN', 'MANAGER', 'USER')
  @ApiOperation({ summary: 'Get dashboard statistics and KPIs' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard statistics retrieved successfully',
    type: DashboardStatsDto,
  })
  async getStats(
    @CurrentUser() user: any,
    @Query() filter: DashboardFilterDto,
  ): Promise<DashboardStatsDto> {
    this.logger.log(`Getting dashboard stats for tenant ${user.tenantId}`);
    return this.analyticsService.getDashboardStats(user.tenantId, filter);
  }

  @Get('charts')
  @Roles('ADMIN', 'MANAGER', 'USER')
  @ApiOperation({ summary: 'Get dashboard charts and visualizations data' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard charts data retrieved successfully',
    type: DashboardChartsDto,
  })
  async getCharts(
    @CurrentUser() user: any,
    @Query() filter: DashboardFilterDto,
  ): Promise<DashboardChartsDto> {
    this.logger.log(`Getting dashboard charts for tenant ${user.tenantId}`);
    return this.analyticsService.getDashboardCharts(user.tenantId, filter);
  }

  @Get('technicians/performance')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get technician performance metrics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Technician performance data retrieved successfully',
  })
  async getTechnicianPerformance(
    @CurrentUser() user: any,
    @Query() filter: DashboardFilterDto,
  ) {
    this.logger.log(`Getting technician performance for tenant ${user.tenantId}`);

    const { startDate, endDate } = this.calculateDateRange(filter);

    return this.analyticsService.getTechnicianPerformance(
      user.tenantId,
      startDate,
      endDate,
      filter,
    );
  }

  @Get('customers/analytics')
  @Roles('ADMIN', 'MANAGER', 'USER')
  @ApiOperation({ summary: 'Get customer analytics and top customers' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer analytics retrieved successfully',
  })
  async getCustomerAnalytics(
    @CurrentUser() user: any,
    @Query() filter: DashboardFilterDto,
    @Query('limit') limit?: number,
  ) {
    this.logger.log(`Getting customer analytics for tenant ${user.tenantId}`);

    const { startDate, endDate } = this.calculateDateRange(filter);

    return this.analyticsService.getTopCustomers(
      user.tenantId,
      startDate,
      endDate,
      limit || 10,
    );
  }

  @Get('jobs/completion-trend')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get job completion trend over time' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Job completion trend retrieved successfully',
  })
  async getJobCompletionTrend(
    @CurrentUser() user: any,
    @Query() filter: DashboardFilterDto,
  ) {
    this.logger.log(`Getting job completion trend for tenant ${user.tenantId}`);

    const { startDate, endDate } = this.calculateDateRange(filter);

    return this.analyticsService.getJobCompletionTrend(
      user.tenantId,
      startDate,
      endDate,
    );
  }

  @Post('export')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Export dashboard data in various formats' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard data exported successfully',
  })
  async exportDashboard(
    @CurrentUser() user: any,
    @Query() filter: DashboardFilterDto,
    @Body() exportDto: ExportDashboardDto,
    @Res() res: Response,
  ) {
    this.logger.log(`Exporting dashboard data for tenant ${user.tenantId} in format ${exportDto.format}`);

    const data = await this.analyticsService.getDashboardStats(user.tenantId, filter);
    const charts = await this.analyticsService.getDashboardCharts(user.tenantId, filter);

    const result = await this.exportService.exportDashboard(
      { stats: data, charts },
      exportDto,
    );

    // Set appropriate headers based on format
    const contentTypes = {
      CSV: 'text/csv',
      EXCEL: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      PDF: 'application/pdf',
      JSON: 'application/json',
    };

    const fileExtensions = {
      CSV: 'csv',
      EXCEL: 'xlsx',
      PDF: 'pdf',
      JSON: 'json',
    };

    res.setHeader('Content-Type', contentTypes[exportDto.format]);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=dashboard-export-${Date.now()}.${fileExtensions[exportDto.format]}`,
    );

    return res.send(result);
  }

  /**
   * Helper method to calculate date range from filter
   */
  private calculateDateRange(filter: DashboardFilterDto): { startDate: Date; endDate: Date } {
    // Reuse the same logic as AnalyticsService
    // This is a simplified version - you could also inject and use AnalyticsService
    const now = new Date();
    const startDate = filter.startDate ? new Date(filter.startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const endDate = filter.endDate ? new Date(filter.endDate) : now;
    return { startDate, endDate };
  }
}
