'use client';

import { useState } from 'react';
import {
  Users,
  Briefcase,
  DollarSign,
  FileText,
  TrendingUp,
  TrendingDown,
  Clock,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  useDashboardStats,
  useDashboardCharts,
  type RecentActivity,
  type DashboardFilterParams,
} from '@/hooks/use-dashboard';
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/utils';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

// KPI Card Component
interface KpiCardProps {
  title: string;
  value: string;
  change?: number;
  previousValue?: number;
  icon: React.ReactNode;
  description?: string;
  loading?: boolean;
  alert?: boolean;
}

function KpiCard({ title, value, change, previousValue, icon, description, loading, alert }: KpiCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={alert ? 'border-orange-500' : ''}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {alert && <AlertCircle className="h-4 w-4 text-orange-500" />}
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            {change > 0 ? (
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
            ) : change < 0 ? (
              <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
            ) : null}
            <span className={change > 0 ? 'text-green-500' : change < 0 ? 'text-red-500' : ''}>
              {formatPercentage(change)}
            </span>
            <span className="ml-1">from previous period</span>
          </div>
        )}
        {previousValue !== undefined && (
          <p className="text-xs text-muted-foreground mt-1">
            Previous: {formatNumber(previousValue)}
          </p>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

// Recent Activity Item Component
function ActivityItem({ activity }: { activity: RecentActivity }) {
  const getActivityIcon = () => {
    switch (activity.type) {
      case 'quote':
        return <FileText className="h-4 w-4" />;
      case 'job':
        return <Briefcase className="h-4 w-4" />;
      case 'invoice':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = () => {
    if (!activity.status) return null;

    const statusMap: Record<string, { variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive'; label: string }> = {
      pending: { variant: 'warning', label: 'Pending' },
      approved: { variant: 'success', label: 'Approved' },
      in_progress: { variant: 'default', label: 'In Progress' },
      completed: { variant: 'success', label: 'Completed' },
      sent: { variant: 'secondary', label: 'Sent' },
      draft: { variant: 'secondary', label: 'Draft' },
    };

    const status = statusMap[activity.status.toLowerCase()] || { variant: 'secondary', label: activity.status };

    return <Badge variant={status.variant}>{status.label}</Badge>;
  };

  return (
    <div className="flex items-start space-x-4 py-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
        {getActivityIcon()}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium leading-none">{activity.title}</p>
          {getStatusBadge()}
        </div>
        <p className="text-sm text-muted-foreground">{activity.description}</p>
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}

// Main Enhanced Dashboard Page
export default function DashboardPage() {
  const { toast } = useToast();

  // Filter state
  const [dateRange, setDateRange] = useState<string>('LAST_30_DAYS');
  const [compareMode, setCompareMode] = useState(false);
  const [filters, setFilters] = useState<DashboardFilterParams>({
    dateRangePreset: 'LAST_30_DAYS',
    comparePreviousPeriod: false,
  });

  // Data hooks
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useDashboardStats(filters);
  const { data: charts, isLoading: chartsLoading, refetch: refetchCharts } = useDashboardCharts(filters);

  // Handle filter changes
  const handleDateRangeChange = (value: string) => {
    setDateRange(value);
    setFilters({
      ...filters,
      dateRangePreset: value as any,
    });
  };

  const handleCompareModeToggle = (checked: boolean) => {
    setCompareMode(checked);
    setFilters({
      ...filters,
      comparePreviousPeriod: checked,
    });
  };

  const handleRefresh = () => {
    refetchStats();
    refetchCharts();
    toast({
      title: 'Dashboard refreshed',
      description: 'Data has been updated successfully.',
    });
  };

  const handleExport = async (format: 'CSV' | 'EXCEL' | 'PDF' | 'JSON') => {
    try {
      toast({
        title: 'Exporting...',
        description: `Preparing ${format} export`,
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/dashboard/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          format,
          dataTypes: ['stats', 'charts'],
        }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get the blob and download it
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const fileExtensions: Record<string, string> = {
        CSV: 'csv',
        EXCEL: 'xlsx',
        PDF: 'pdf',
        JSON: 'json',
      };

      a.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.${fileExtensions[format]}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Export ready',
        description: `Dashboard exported to ${format} successfully.`,
      });
    } catch (error: any) {
      toast({
        title: 'Export failed',
        description: error.message || 'Failed to export dashboard',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive business intelligence and analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('CSV')}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('EXCEL')}>
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('PDF')}>
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('JSON')}>
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filters Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="date-range" className="text-sm">Date Range:</Label>
              <Select value={dateRange} onValueChange={handleDateRangeChange}>
                <SelectTrigger id="date-range" className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAY">Today</SelectItem>
                  <SelectItem value="YESTERDAY">Yesterday</SelectItem>
                  <SelectItem value="LAST_7_DAYS">Last 7 Days</SelectItem>
                  <SelectItem value="LAST_30_DAYS">Last 30 Days</SelectItem>
                  <SelectItem value="LAST_90_DAYS">Last 90 Days</SelectItem>
                  <SelectItem value="THIS_MONTH">This Month</SelectItem>
                  <SelectItem value="LAST_MONTH">Last Month</SelectItem>
                  <SelectItem value="THIS_QUARTER">This Quarter</SelectItem>
                  <SelectItem value="THIS_YEAR">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="compare-mode"
                checked={compareMode}
                onCheckedChange={handleCompareModeToggle}
              />
              <Label htmlFor="compare-mode" className="text-sm">
                Compare with previous period
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Customers"
          value={stats ? formatNumber(stats.totalCustomers.count) : '0'}
          change={stats?.totalCustomers.growth}
          previousValue={stats?.totalCustomers.previousValue}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          loading={statsLoading}
        />
        <KpiCard
          title="Active Jobs"
          value={stats ? formatNumber(stats.activeJobs.count) : '0'}
          change={stats?.activeJobs.growth}
          previousValue={stats?.activeJobs.previousValue}
          icon={<Briefcase className="h-4 w-4 text-muted-foreground" />}
          description={
            stats
              ? `${stats.activeJobs.byStatus.inProgress} in progress, ${stats.activeJobs.byStatus.scheduled} scheduled`
              : undefined
          }
          alert={stats && stats.activeJobs.overdue ? stats.activeJobs.overdue > 0 : false}
          loading={statsLoading}
        />
        <KpiCard
          title="Revenue This Period"
          value={
            stats
              ? formatCurrency(
                  stats.revenueThisMonth.amount,
                  stats.revenueThisMonth.currency
                )
              : '$0'
          }
          change={stats?.revenueThisMonth.growth}
          previousValue={stats?.revenueThisMonth.previousAmount}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          loading={statsLoading}
        />
        <KpiCard
          title="Pending Quotes"
          value={stats ? formatNumber(stats.pendingQuotes.count) : '0'}
          change={stats?.pendingQuotes.growth}
          previousValue={stats?.pendingQuotes.previousValue}
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
          description="Awaiting customer response"
          loading={statsLoading}
        />
      </div>

      {/* Additional KPIs Row */}
      {stats && (stats.avgJobCompletionTime || stats.activeTechnicians) && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.activeTechnicians && (
            <KpiCard
              title="Active Technicians"
              value={formatNumber(stats.activeTechnicians.count)}
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
              loading={statsLoading}
            />
          )}
          {stats.avgJobCompletionTime && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Completion Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.avgJobCompletionTime.toFixed(1)}h
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Average hours to complete jobs
                </p>
              </CardContent>
            </Card>
          )}
          {stats.activeJobs.overdue !== undefined && stats.activeJobs.overdue > 0 && (
            <Card className="border-orange-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue Jobs</CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">
                  {stats.activeJobs.overdue}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Require immediate attention
                </p>
              </CardContent>
            </Card>
          )}
          {stats.activeJobs.dueToday !== undefined && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Due Today</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.activeJobs.dueToday}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Jobs scheduled for today
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Jobs by Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Jobs by Status</CardTitle>
            <CardDescription>Current job distribution across all statuses</CardDescription>
          </CardHeader>
          <CardContent>
            {chartsLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : charts?.jobsByStatus ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={charts.jobsByStatus}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="status"
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                  />
                  <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {charts.jobsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Revenue over time with paid/outstanding breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {chartsLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : charts?.revenueTrend ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={charts.revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="month"
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                    formatter={(value: number) => [formatCurrency(value), '']}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                    name="Total Revenue"
                  />
                  {charts.revenueTrend[0]?.paid !== undefined && (
                    <Line
                      type="monotone"
                      dataKey="paid"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: '#10b981' }}
                      name="Paid"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates on quotes, jobs, and invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {chartsLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start space-x-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : charts?.recentActivity && charts.recentActivity.length > 0 ? (
            <div className="divide-y">
              {charts.recentActivity.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              No recent activity
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
