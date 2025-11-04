'use client';

import {
  Users,
  Briefcase,
  DollarSign,
  FileText,
  TrendingUp,
  TrendingDown,
  Clock,
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
import {
  useDashboardStats,
  useDashboardCharts,
  type RecentActivity,
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
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';

// KPI Card Component
interface KpiCardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  description?: string;
  loading?: boolean;
}

function KpiCard({ title, value, change, icon, description, loading }: KpiCardProps) {
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            {change > 0 ? (
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
            )}
            <span className={change > 0 ? 'text-green-500' : 'text-red-500'}>
              {formatPercentage(change)}
            </span>
            <span className="ml-1">from last month</span>
          </div>
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

    const statusMap: Record<string, { variant: 'default' | 'secondary' | 'success' | 'warning'; label: string }> = {
      pending: { variant: 'warning', label: 'Pending' },
      approved: { variant: 'success', label: 'Approved' },
      in_progress: { variant: 'default', label: 'In Progress' },
      completed: { variant: 'success', label: 'Completed' },
      sent: { variant: 'secondary', label: 'Sent' },
    };

    const status = statusMap[activity.status] || { variant: 'secondary', label: activity.status };

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

// Main Dashboard Page
export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: charts, isLoading: chartsLoading } = useDashboardCharts();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your business.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Customers"
          value={stats ? formatNumber(stats.totalCustomers.count) : '0'}
          change={stats?.totalCustomers.growth}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          loading={statsLoading}
        />
        <KpiCard
          title="Active Jobs"
          value={stats ? formatNumber(stats.activeJobs.count) : '0'}
          icon={<Briefcase className="h-4 w-4 text-muted-foreground" />}
          description={
            stats
              ? `${stats.activeJobs.byStatus.inProgress} in progress, ${stats.activeJobs.byStatus.scheduled} scheduled`
              : undefined
          }
          loading={statsLoading}
        />
        <KpiCard
          title="Revenue This Month"
          value={
            stats
              ? formatCurrency(
                  stats.revenueThisMonth.amount,
                  stats.revenueThisMonth.currency
                )
              : '$0'
          }
          change={stats?.revenueThisMonth.growth}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          loading={statsLoading}
        />
        <KpiCard
          title="Pending Quotes"
          value={stats ? formatNumber(stats.pendingQuotes.count) : '0'}
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
          description="Awaiting customer response"
          loading={statsLoading}
        />
      </div>

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
                      <rect key={`cell-${index}`} fill={entry.color} />
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
            <CardDescription>Revenue over the last 6 months</CardDescription>
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
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
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
