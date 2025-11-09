import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class JobsByStatusChart {
  @ApiProperty()
  status: string;

  @ApiProperty()
  count: number;

  @ApiProperty()
  color: string;

  @ApiPropertyOptional()
  percentage?: number;
}

export class RevenueTrendChart {
  @ApiProperty()
  month: string;

  @ApiProperty()
  revenue: number;

  @ApiPropertyOptional()
  invoiced?: number;

  @ApiPropertyOptional()
  paid?: number;

  @ApiPropertyOptional()
  outstanding?: number;
}

export class RecentActivity {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ['quote', 'job', 'invoice', 'customer', 'technician'] })
  type: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  timestamp: string;

  @ApiPropertyOptional()
  status?: string;

  @ApiPropertyOptional()
  userId?: string;

  @ApiPropertyOptional()
  userName?: string;
}

export class TechnicianPerformance {
  @ApiProperty()
  technicianId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  jobsCompleted: number;

  @ApiProperty()
  avgCompletionTime: number;

  @ApiProperty()
  utilizationRate: number;

  @ApiProperty()
  customerRating: number;

  @ApiPropertyOptional()
  revenue?: number;
}

export class CustomerAnalytics {
  @ApiProperty()
  customerId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  jobsCount: number;

  @ApiProperty()
  avgJobValue: number;

  @ApiProperty()
  lastJobDate: string;

  @ApiPropertyOptional()
  lifetimeValue?: number;
}

export class JobCompletionTrend {
  @ApiProperty()
  date: string;

  @ApiProperty()
  completed: number;

  @ApiProperty()
  scheduled: number;

  @ApiProperty()
  cancelled: number;
}

export class RevenueByCustomerSegment {
  @ApiProperty()
  segment: string;

  @ApiProperty()
  revenue: number;

  @ApiProperty()
  customerCount: number;

  @ApiProperty()
  avgRevenuePerCustomer: number;
}

export class InventoryMetrics {
  @ApiProperty()
  category: string;

  @ApiProperty()
  totalValue: number;

  @ApiProperty()
  itemCount: number;

  @ApiProperty()
  lowStockItems: number;
}

export class DashboardChartsDto {
  @ApiProperty({ type: [JobsByStatusChart] })
  jobsByStatus: JobsByStatusChart[];

  @ApiProperty({ type: [RevenueTrendChart] })
  revenueTrend: RevenueTrendChart[];

  @ApiProperty({ type: [RecentActivity] })
  recentActivity: RecentActivity[];

  @ApiPropertyOptional({ type: [TechnicianPerformance] })
  technicianPerformance?: TechnicianPerformance[];

  @ApiPropertyOptional({ type: [CustomerAnalytics] })
  topCustomers?: CustomerAnalytics[];

  @ApiPropertyOptional({ type: [JobCompletionTrend] })
  jobCompletionTrend?: JobCompletionTrend[];

  @ApiPropertyOptional({ type: [RevenueByCustomerSegment] })
  revenueBySegment?: RevenueByCustomerSegment[];

  @ApiPropertyOptional({ type: [InventoryMetrics] })
  inventoryMetrics?: InventoryMetrics[];
}
