import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// Types for dashboard data
export interface DashboardStats {
  totalCustomers: {
    count: number;
    growth: number;
  };
  activeJobs: {
    count: number;
    byStatus: {
      scheduled: number;
      inProgress: number;
      completed: number;
      cancelled: number;
    };
  };
  revenueThisMonth: {
    amount: number;
    currency: string;
    growth: number;
  };
  pendingQuotes: {
    count: number;
  };
}

export interface JobsByStatus {
  status: string;
  count: number;
  color: string;
}

export interface RevenueTrend {
  month: string;
  revenue: number;
}

export interface RecentActivity {
  id: string;
  type: 'quote' | 'job' | 'invoice';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
}

export interface DashboardCharts {
  jobsByStatus: JobsByStatus[];
  revenueTrend: RevenueTrend[];
  recentActivity: RecentActivity[];
}

// API functions
async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    const data = await apiClient.get<DashboardStats>('/api/v1/dashboard/stats');
    return data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return mock data as fallback
    return {
      totalCustomers: {
        count: 248,
        growth: 12.5,
      },
      activeJobs: {
        count: 45,
        byStatus: {
          scheduled: 12,
          inProgress: 18,
          completed: 10,
          cancelled: 5,
        },
      },
      revenueThisMonth: {
        amount: 125000,
        currency: 'USD',
        growth: 8.3,
      },
      pendingQuotes: {
        count: 23,
      },
    };
  }
}

async function fetchDashboardCharts(): Promise<DashboardCharts> {
  try {
    const data = await apiClient.get<DashboardCharts>('/api/v1/dashboard/charts');
    return data;
  } catch (error) {
    console.error('Error fetching dashboard charts:', error);
    // Return mock data as fallback
    return {
      jobsByStatus: [
        { status: 'Scheduled', count: 12, color: '#3b82f6' },
        { status: 'In Progress', count: 18, color: '#f59e0b' },
        { status: 'Completed', count: 10, color: '#10b981' },
        { status: 'Cancelled', count: 5, color: '#ef4444' },
      ],
      revenueTrend: [
        { month: 'Jun', revenue: 98000 },
        { month: 'Jul', revenue: 105000 },
        { month: 'Aug', revenue: 112000 },
        { month: 'Sep', revenue: 118000 },
        { month: 'Oct', revenue: 115000 },
        { month: 'Nov', revenue: 125000 },
      ],
      recentActivity: [
        {
          id: '1',
          type: 'quote',
          title: 'Quote #1234',
          description: 'New quote created for ABC Corp',
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          status: 'pending',
        },
        {
          id: '2',
          type: 'job',
          title: 'Job #5678',
          description: 'Job started for XYZ Inc',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          status: 'in_progress',
        },
        {
          id: '3',
          type: 'job',
          title: 'Job #5677',
          description: 'Job completed for Acme Ltd',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          status: 'completed',
        },
        {
          id: '4',
          type: 'invoice',
          title: 'Invoice #9876',
          description: 'Invoice sent to Tech Solutions',
          timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          status: 'sent',
        },
        {
          id: '5',
          type: 'quote',
          title: 'Quote #1233',
          description: 'Quote approved by Global Services',
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          status: 'approved',
        },
      ],
    };
  }
}

// React Query hooks
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: fetchDashboardStats,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useDashboardCharts() {
  return useQuery({
    queryKey: ['dashboard', 'charts'],
    queryFn: fetchDashboardCharts,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
