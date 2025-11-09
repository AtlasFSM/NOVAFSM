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

// Filter parameters
export interface DashboardFilterParams {
  dateRangePreset?: 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR' | 'CUSTOM';
  startDate?: string;
  endDate?: string;
  customerIds?: string[];
  technicianIds?: string[];
  comparePreviousPeriod?: boolean;
}

// API functions
async function fetchDashboardStats(params?: DashboardFilterParams): Promise<DashboardStats> {
  const response = await apiClient.get('/dashboard/stats', { params });
  return response.data;
}

async function fetchDashboardCharts(params?: DashboardFilterParams): Promise<DashboardCharts> {
  const response = await apiClient.get('/dashboard/charts', { params });
  return response.data;
}

// React Query hooks
export function useDashboardStats(filters?: DashboardFilterParams) {
  return useQuery({
    queryKey: ['dashboard', 'stats', filters],
    queryFn: () => fetchDashboardStats(filters),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useDashboardCharts(filters?: DashboardFilterParams) {
  return useQuery({
    queryKey: ['dashboard', 'charts', filters],
    queryFn: () => fetchDashboardCharts(filters),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
