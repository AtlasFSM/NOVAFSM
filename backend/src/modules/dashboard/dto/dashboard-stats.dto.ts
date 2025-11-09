import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class KpiValue {
  @ApiProperty({ description: 'Current value' })
  count: number;

  @ApiPropertyOptional({ description: 'Percentage change from comparison period' })
  growth?: number;

  @ApiPropertyOptional({ description: 'Comparison period value' })
  previousValue?: number;
}

export class JobStatusBreakdown {
  @ApiProperty()
  scheduled: number;

  @ApiProperty()
  inProgress: number;

  @ApiProperty()
  completed: number;

  @ApiProperty()
  cancelled: number;

  @ApiProperty()
  onHold: number;

  @ApiProperty()
  draft: number;
}

export class ActiveJobsKpi extends KpiValue {
  @ApiProperty({ description: 'Breakdown by status' })
  byStatus: JobStatusBreakdown;

  @ApiPropertyOptional({ description: 'Jobs overdue' })
  overdue?: number;

  @ApiPropertyOptional({ description: 'Jobs due today' })
  dueToday?: number;
}

export class RevenueKpi {
  @ApiProperty({ description: 'Revenue amount' })
  amount: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiPropertyOptional({ description: 'Percentage change' })
  growth?: number;

  @ApiPropertyOptional({ description: 'Previous period amount' })
  previousAmount?: number;

  @ApiPropertyOptional({ description: 'Revenue from invoices' })
  fromInvoices?: number;

  @ApiPropertyOptional({ description: 'Revenue from quotes converted' })
  fromQuotes?: number;

  @ApiPropertyOptional({ description: 'Outstanding revenue' })
  outstanding?: number;
}

export class DashboardStatsDto {
  @ApiProperty({ description: 'Total customers KPI' })
  totalCustomers: KpiValue;

  @ApiProperty({ description: 'Active jobs KPI' })
  activeJobs: ActiveJobsKpi;

  @ApiProperty({ description: 'Revenue this period' })
  revenueThisMonth: RevenueKpi;

  @ApiProperty({ description: 'Pending quotes KPI' })
  pendingQuotes: KpiValue;

  @ApiPropertyOptional({ description: 'Active technicians' })
  activeTechnicians?: KpiValue;

  @ApiPropertyOptional({ description: 'Avg job completion time (hours)' })
  avgJobCompletionTime?: number;

  @ApiPropertyOptional({ description: 'Customer satisfaction score (1-5)' })
  customerSatisfaction?: number;

  @ApiPropertyOptional({ description: 'Technician utilization rate (%)' })
  technicianUtilization?: number;

  @ApiPropertyOptional({ description: 'First-time fix rate (%)' })
  firstTimeFix?: number;

  @ApiPropertyOptional({ description: 'Average response time (hours)' })
  avgResponseTime?: number;
}
