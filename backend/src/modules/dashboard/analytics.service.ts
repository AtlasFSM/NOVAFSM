import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  DashboardFilterDto,
  DateRangePreset,
  DashboardStatsDto,
  DashboardChartsDto,
  TechnicianPerformance,
  CustomerAnalytics,
  JobsByStatusChart,
  RevenueTrendChart,
  RecentActivity,
  JobCompletionTrend,
  RevenueByCustomerSegment,
  InventoryMetrics,
} from './dto';
import { startOfDay, endOfDay, subDays, subMonths, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, format, eachMonthOfInterval } from 'date-fns';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate date range from filter
   */
  private calculateDateRange(filter: DashboardFilterDto): { startDate: Date; endDate: Date } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = endOfDay(now);

    if (filter.dateRangePreset === DateRangePreset.CUSTOM && filter.startDate && filter.endDate) {
      return {
        startDate: startOfDay(new Date(filter.startDate)),
        endDate: endOfDay(new Date(filter.endDate)),
      };
    }

    switch (filter.dateRangePreset) {
      case DateRangePreset.TODAY:
        startDate = startOfDay(now);
        break;
      case DateRangePreset.YESTERDAY:
        startDate = startOfDay(subDays(now, 1));
        endDate = endOfDay(subDays(now, 1));
        break;
      case DateRangePreset.LAST_7_DAYS:
        startDate = startOfDay(subDays(now, 7));
        break;
      case DateRangePreset.LAST_30_DAYS:
        startDate = startOfDay(subDays(now, 30));
        break;
      case DateRangePreset.LAST_90_DAYS:
        startDate = startOfDay(subDays(now, 90));
        break;
      case DateRangePreset.THIS_MONTH:
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case DateRangePreset.LAST_MONTH:
        const lastMonth = subMonths(now, 1);
        startDate = startOfMonth(lastMonth);
        endDate = endOfMonth(lastMonth);
        break;
      case DateRangePreset.THIS_QUARTER:
        startDate = startOfQuarter(now);
        endDate = endOfQuarter(now);
        break;
      case DateRangePreset.LAST_QUARTER:
        const lastQuarter = subMonths(now, 3);
        startDate = startOfQuarter(lastQuarter);
        endDate = endOfQuarter(lastQuarter);
        break;
      case DateRangePreset.THIS_YEAR:
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      case DateRangePreset.LAST_YEAR:
        const lastYear = new Date(now.getFullYear() - 1, 0, 1);
        startDate = startOfYear(lastYear);
        endDate = endOfYear(lastYear);
        break;
      default:
        // Default to last 30 days
        startDate = startOfDay(subDays(now, 30));
    }

    return { startDate, endDate };
  }

  /**
   * Calculate previous period for comparison
   */
  private calculatePreviousPeriod(startDate: Date, endDate: Date): { prevStartDate: Date; prevEndDate: Date } {
    const duration = endDate.getTime() - startDate.getTime();
    const prevEndDate = new Date(startDate.getTime() - 1);
    const prevStartDate = new Date(prevEndDate.getTime() - duration);
    return { prevStartDate, prevEndDate };
  }

  /**
   * Build WHERE clause from filter
   */
  private buildWhereClause(filter: DashboardFilterDto, tenantId: string, dateField: string = 'createdAt') {
    const { startDate, endDate } = this.calculateDateRange(filter);

    const where: any = {
      tenantId,
      [dateField]: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (filter.customerIds && filter.customerIds.length > 0) {
      where.customerId = { in: filter.customerIds };
    }

    if (filter.siteIds && filter.siteIds.length > 0) {
      where.siteId = { in: filter.siteIds };
    }

    return where;
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(tenantId: string, filter: DashboardFilterDto): Promise<DashboardStatsDto> {
    this.logger.log(`Fetching dashboard stats for tenant ${tenantId}`);

    const { startDate, endDate } = this.calculateDateRange(filter);
    const { prevStartDate, prevEndDate } = filter.comparePreviousPeriod
      ? this.calculatePreviousPeriod(startDate, endDate)
      : { prevStartDate: null, prevEndDate: null };

    // Parallel queries for better performance
    const [
      totalCustomers,
      prevTotalCustomers,
      activeJobs,
      prevActiveJobs,
      jobsByStatus,
      revenue,
      prevRevenue,
      pendingQuotes,
      prevPendingQuotes,
      activeTechnicians,
      avgJobTime,
      overdueJobs,
      dueTodayJobs,
    ] = await Promise.all([
      // Total customers in period
      this.prisma.customer.count({
        where: {
          tenantId,
          createdAt: { lte: endDate },
          status: 'ACTIVE',
        },
      }),

      // Previous period customers
      filter.comparePreviousPeriod && prevEndDate
        ? this.prisma.customer.count({
            where: {
              tenantId,
              createdAt: { lte: prevEndDate },
              status: 'ACTIVE',
            },
          })
        : Promise.resolve(0),

      // Active jobs in period
      this.prisma.job.count({
        where: {
          tenantId,
          createdAt: { gte: startDate, lte: endDate },
          status: { in: ['SCHEDULED', 'IN_PROGRESS', 'ON_HOLD'] },
        },
      }),

      // Previous period active jobs
      filter.comparePreviousPeriod && prevStartDate && prevEndDate
        ? this.prisma.job.count({
            where: {
              tenantId,
              createdAt: { gte: prevStartDate, lte: prevEndDate },
              status: { in: ['SCHEDULED', 'IN_PROGRESS', 'ON_HOLD'] },
            },
          })
        : Promise.resolve(0),

      // Jobs by status
      this.prisma.job.groupBy({
        by: ['status'],
        where: {
          tenantId,
          createdAt: { gte: startDate, lte: endDate },
        },
        _count: { id: true },
      }),

      // Revenue from invoices
      this.prisma.invoice.aggregate({
        where: {
          tenantId,
          invoiceDate: { gte: startDate, lte: endDate },
          status: { in: ['SENT', 'PAID'] },
        },
        _sum: { total: true },
      }),

      // Previous period revenue
      filter.comparePreviousPeriod && prevStartDate && prevEndDate
        ? this.prisma.invoice.aggregate({
            where: {
              tenantId,
              invoiceDate: { gte: prevStartDate, lte: prevEndDate },
              status: { in: ['SENT', 'PAID'] },
            },
            _sum: { total: true },
          })
        : Promise.resolve({ _sum: { total: 0 } }),

      // Pending quotes
      this.prisma.quote.count({
        where: {
          tenantId,
          status: 'SENT',
          validUntil: { gte: new Date() },
        },
      }),

      // Previous pending quotes
      filter.comparePreviousPeriod && prevStartDate && prevEndDate
        ? this.prisma.quote.count({
            where: {
              tenantId,
              status: 'SENT',
              createdAt: { gte: prevStartDate, lte: prevEndDate },
            },
          })
        : Promise.resolve(0),

      // Active technicians
      this.prisma.user.count({
        where: {
          tenantId,
          role: { in: ['TECHNICIAN', 'MANAGER'] },
          createdAt: { lte: endDate },
        },
      }),

      // Average job completion time
      this.prisma.$queryRaw<Array<{ avg: number }>>`
        SELECT AVG(EXTRACT(EPOCH FROM (j."completedAt" - j."scheduledStart")) / 3600)::numeric as avg
        FROM "Job" j
        WHERE j."tenantId" = ${tenantId}
          AND j."status" = 'COMPLETED'
          AND j."completedAt" IS NOT NULL
          AND j."scheduledStart" IS NOT NULL
          AND j."createdAt" >= ${startDate}
          AND j."createdAt" <= ${endDate}
      `,

      // Overdue jobs
      this.prisma.job.count({
        where: {
          tenantId,
          status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
          scheduledEnd: { lt: new Date() },
        },
      }),

      // Jobs due today
      this.prisma.job.count({
        where: {
          tenantId,
          status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
          scheduledStart: {
            gte: startOfDay(new Date()),
            lte: endOfDay(new Date()),
          },
        },
      }),
    ]);

    // Calculate job status breakdown
    const jobStatusMap = {
      scheduled: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
      onHold: 0,
      draft: 0,
    };

    jobsByStatus.forEach((item) => {
      const status = item.status.toLowerCase();
      if (status === 'scheduled') jobStatusMap.scheduled = item._count.id;
      else if (status === 'in_progress') jobStatusMap.inProgress = item._count.id;
      else if (status === 'completed') jobStatusMap.completed = item._count.id;
      else if (status === 'cancelled') jobStatusMap.cancelled = item._count.id;
      else if (status === 'on_hold') jobStatusMap.onHold = item._count.id;
      else if (status === 'draft') jobStatusMap.draft = item._count.id;
    });

    // Calculate growth percentages
    const customerGrowth = prevTotalCustomers > 0
      ? ((totalCustomers - prevTotalCustomers) / prevTotalCustomers) * 100
      : 0;

    const jobGrowth = prevActiveJobs > 0
      ? ((activeJobs - prevActiveJobs) / prevActiveJobs) * 100
      : 0;

    const revenueAmount = revenue._sum.total?.toNumber() || 0;
    const prevRevenueAmount = prevRevenue._sum.total?.toNumber() || 0;
    const revenueGrowth = prevRevenueAmount > 0
      ? ((revenueAmount - prevRevenueAmount) / prevRevenueAmount) * 100
      : 0;

    const quoteGrowth = prevPendingQuotes > 0
      ? ((pendingQuotes - prevPendingQuotes) / prevPendingQuotes) * 100
      : 0;

    return {
      totalCustomers: {
        count: totalCustomers,
        growth: filter.comparePreviousPeriod ? customerGrowth : undefined,
        previousValue: filter.comparePreviousPeriod ? prevTotalCustomers : undefined,
      },
      activeJobs: {
        count: activeJobs,
        growth: filter.comparePreviousPeriod ? jobGrowth : undefined,
        previousValue: filter.comparePreviousPeriod ? prevActiveJobs : undefined,
        byStatus: jobStatusMap,
        overdue: overdueJobs,
        dueToday: dueTodayJobs,
      },
      revenueThisMonth: {
        amount: revenueAmount,
        currency: 'USD',
        growth: filter.comparePreviousPeriod ? revenueGrowth : undefined,
        previousAmount: filter.comparePreviousPeriod ? prevRevenueAmount : undefined,
      },
      pendingQuotes: {
        count: pendingQuotes,
        growth: filter.comparePreviousPeriod ? quoteGrowth : undefined,
        previousValue: filter.comparePreviousPeriod ? prevPendingQuotes : undefined,
      },
      activeTechnicians: {
        count: activeTechnicians,
      },
      avgJobCompletionTime: avgJobTime[0]?.avg ? Number(avgJobTime[0].avg.toFixed(2)) : undefined,
    };
  }

  /**
   * Get dashboard charts data
   */
  async getDashboardCharts(tenantId: string, filter: DashboardFilterDto): Promise<DashboardChartsDto> {
    this.logger.log(`Fetching dashboard charts for tenant ${tenantId}`);

    const { startDate, endDate } = this.calculateDateRange(filter);

    const [
      jobsByStatus,
      revenueTrend,
      recentActivity,
      technicianPerformance,
      topCustomers,
    ] = await Promise.all([
      this.getJobsByStatus(tenantId, startDate, endDate),
      this.getRevenueTrend(tenantId, startDate, endDate),
      this.getRecentActivity(tenantId, 10),
      this.getTechnicianPerformance(tenantId, startDate, endDate, filter),
      this.getTopCustomers(tenantId, startDate, endDate, 10),
    ]);

    return {
      jobsByStatus,
      revenueTrend,
      recentActivity,
      technicianPerformance,
      topCustomers,
    };
  }

  /**
   * Get jobs by status chart data
   */
  private async getJobsByStatus(tenantId: string, startDate: Date, endDate: Date): Promise<JobsByStatusChart[]> {
    const jobsByStatus = await this.prisma.job.groupBy({
      by: ['status'],
      where: {
        tenantId,
        createdAt: { gte: startDate, lte: endDate },
      },
      _count: { id: true },
    });

    const statusColors: Record<string, string> = {
      DRAFT: '#6b7280',
      SCHEDULED: '#3b82f6',
      IN_PROGRESS: '#f59e0b',
      ON_HOLD: '#8b5cf6',
      COMPLETED: '#10b981',
      CANCELLED: '#ef4444',
    };

    const total = jobsByStatus.reduce((sum, item) => sum + item._count.id, 0);

    return jobsByStatus.map((item) => ({
      status: item.status,
      count: item._count.id,
      color: statusColors[item.status] || '#6b7280',
      percentage: total > 0 ? (item._count.id / total) * 100 : 0,
    }));
  }

  /**
   * Get revenue trend chart data
   */
  private async getRevenueTrend(tenantId: string, startDate: Date, endDate: Date): Promise<RevenueTrendChart[]> {
    // Get monthly revenue for the period
    const months = eachMonthOfInterval({ start: startDate, end: endDate });

    const revenueData = await Promise.all(
      months.map(async (monthStart) => {
        const monthEnd = endOfMonth(monthStart);

        const [invoicedTotal, paidTotal] = await Promise.all([
          this.prisma.invoice.aggregate({
            where: {
              tenantId,
              invoiceDate: { gte: monthStart, lte: monthEnd },
              status: { in: ['SENT', 'PAID'] },
            },
            _sum: { total: true },
          }),
          this.prisma.invoice.aggregate({
            where: {
              tenantId,
              invoiceDate: { gte: monthStart, lte: monthEnd },
              status: 'PAID',
            },
            _sum: { amountPaid: true },
          }),
        ]);

        const invoiced = invoicedTotal._sum.total?.toNumber() || 0;
        const paid = paidTotal._sum.amountPaid?.toNumber() || 0;

        return {
          month: format(monthStart, 'MMM'),
          revenue: invoiced,
          invoiced,
          paid,
          outstanding: invoiced - paid,
        };
      })
    );

    return revenueData;
  }

  /**
   * Get recent activity
   */
  private async getRecentActivity(tenantId: string, limit: number = 10): Promise<RecentActivity[]> {
    const [quotes, jobs, invoices] = await Promise.all([
      this.prisma.quote.findMany({
        where: { tenantId },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        include: { customer: true },
      }),
      this.prisma.job.findMany({
        where: { tenantId },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        include: { customer: true },
      }),
      this.prisma.invoice.findMany({
        where: { tenantId },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        include: { customer: true },
      }),
    ]);

    const activities: RecentActivity[] = [
      ...quotes.map(q => ({
        id: q.id,
        type: 'quote' as const,
        title: `Quote ${q.number}`,
        description: `Quote for ${q.customer.name}`,
        timestamp: q.updatedAt.toISOString(),
        status: q.status.toLowerCase(),
      })),
      ...jobs.map(j => ({
        id: j.id,
        type: 'job' as const,
        title: `Job ${j.number}`,
        description: `${j.title} - ${j.customer.name}`,
        timestamp: j.updatedAt.toISOString(),
        status: j.status.toLowerCase(),
      })),
      ...invoices.map(i => ({
        id: i.id,
        type: 'invoice' as const,
        title: `Invoice ${i.number}`,
        description: `Invoice for ${i.customer.name}`,
        timestamp: i.updatedAt.toISOString(),
        status: i.status.toLowerCase(),
      })),
    ];

    // Sort by timestamp and take top N
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Get technician performance metrics
   */
  async getTechnicianPerformance(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    filter: DashboardFilterDto,
  ): Promise<TechnicianPerformance[]> {
    const technicianIds = filter.technicianIds;

    const technicians = await this.prisma.user.findMany({
      where: {
        tenantId,
        role: { in: ['TECHNICIAN', 'MANAGER'] },
        ...(technicianIds && technicianIds.length > 0 ? { id: { in: technicianIds } } : {}),
      },
    });

    const performanceData = await Promise.all(
      technicians.map(async (tech) => {
        const [jobsCompleted, avgTime, revenue, timeEntries, ratings] = await Promise.all([
          this.prisma.job.count({
            where: {
              tenantId,
              assignedToId: tech.id,
              status: 'COMPLETED',
              completedAt: { gte: startDate, lte: endDate },
            },
          }),
          this.prisma.$queryRaw<Array<{ avg: number }>>`
            SELECT AVG(EXTRACT(EPOCH FROM (j."completedAt" - j."scheduledStart")) / 3600)::numeric as avg
            FROM "Job" j
            WHERE j."tenantId" = ${tenantId}
              AND j."assignedToId" = ${tech.id}
              AND j."status" = 'COMPLETED'
              AND j."completedAt" IS NOT NULL
              AND j."scheduledStart" IS NOT NULL
              AND j."completedAt" >= ${startDate}
              AND j."completedAt" <= ${endDate}
          `,
          this.prisma.invoice.aggregate({
            where: {
              tenantId,
              job: {
                assignedToId: tech.id,
                completedAt: { gte: startDate, lte: endDate },
              },
            },
            _sum: { total: true },
          }),
          // Get time entries for utilization calculation
          this.prisma.timeEntry.aggregate({
            where: {
              tenantId,
              userId: tech.id,
              type: 'WORK',
              startTime: { gte: startDate, lte: endDate },
            },
            _sum: { duration: true },
          }),
          // Get average customer ratings from form responses
          this.prisma.formResponse.aggregate({
            where: {
              tenantId,
              status: 'SUBMITTED',
              submittedAt: { gte: startDate, lte: endDate },
              assignment: {
                job: {
                  assignedToId: tech.id,
                },
              },
              score: { not: null },
            },
            _avg: { score: true },
          }),
        ]);

        // Calculate utilization rate
        // Total available minutes = number of days × 8 hours/day × 60 min/hour
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const workDays = Math.max(1, Math.floor(daysDiff * 5 / 7)); // Assume 5-day work week
        const availableMinutes = workDays * 8 * 60; // 8-hour work day
        const workedMinutes = timeEntries._sum.duration || 0;
        const utilizationRate = availableMinutes > 0 ? (workedMinutes / availableMinutes) * 100 : 0;

        // Customer rating from form scores (typically 1-5 or 1-10 scale)
        const customerRating = ratings._avg.score || 0;

        return {
          technicianId: tech.id,
          name: tech.name,
          jobsCompleted,
          avgCompletionTime: avgTime[0]?.avg ? Number(avgTime[0].avg.toFixed(2)) : 0,
          utilizationRate: Number(utilizationRate.toFixed(2)),
          customerRating: Number(customerRating.toFixed(2)),
          revenue: revenue._sum.total?.toNumber() || 0,
        };
      })
    );

    return performanceData.sort((a, b) => b.jobsCompleted - a.jobsCompleted);
  }

  /**
   * Get top customers analytics
   */
  async getTopCustomers(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 10,
  ): Promise<CustomerAnalytics[]> {
    const customers = await this.prisma.customer.findMany({
      where: {
        tenantId,
        jobs: {
          some: {
            createdAt: { gte: startDate, lte: endDate },
          },
        },
      },
      include: {
        _count: {
          select: { jobs: true },
        },
        jobs: {
          where: {
            createdAt: { gte: startDate, lte: endDate },
          },
          include: {
            invoices: {
              select: {
                total: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    const customerAnalytics: CustomerAnalytics[] = customers.map((customer) => {
      const totalRevenue = customer.jobs.reduce((sum, job) => {
        const jobRevenue = job.invoices.reduce((jobSum, inv) => jobSum + inv.total.toNumber(), 0);
        return sum + jobRevenue;
      }, 0);

      const jobsCount = customer.jobs.length;
      const avgJobValue = jobsCount > 0 ? totalRevenue / jobsCount : 0;
      const lastJob = customer.jobs[0];

      return {
        customerId: customer.id,
        name: customer.name,
        totalRevenue,
        jobsCount,
        avgJobValue,
        lastJobDate: lastJob?.createdAt.toISOString() || '',
        lifetimeValue: totalRevenue,
      };
    });

    return customerAnalytics
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);
  }

  /**
   * Get job completion trend
   */
  async getJobCompletionTrend(tenantId: string, startDate: Date, endDate: Date): Promise<JobCompletionTrend[]> {
    // Get daily job completion data
    const dailyData = await this.prisma.$queryRaw<Array<{
      date: Date;
      completed: bigint;
      scheduled: bigint;
      cancelled: bigint;
    }>>`
      SELECT
        DATE(j."createdAt") as date,
        COUNT(*) FILTER (WHERE j."status" = 'COMPLETED') as completed,
        COUNT(*) FILTER (WHERE j."status" = 'SCHEDULED') as scheduled,
        COUNT(*) FILTER (WHERE j."status" = 'CANCELLED') as cancelled
      FROM "Job" j
      WHERE j."tenantId" = ${tenantId}
        AND j."createdAt" >= ${startDate}
        AND j."createdAt" <= ${endDate}
      GROUP BY DATE(j."createdAt")
      ORDER BY DATE(j."createdAt")
    `;

    return dailyData.map((item) => ({
      date: format(new Date(item.date), 'yyyy-MM-dd'),
      completed: Number(item.completed),
      scheduled: Number(item.scheduled),
      cancelled: Number(item.cancelled),
    }));
  }
}
