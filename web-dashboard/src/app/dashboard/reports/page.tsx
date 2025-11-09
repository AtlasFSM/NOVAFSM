'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Download, TrendingUp, DollarSign, Users, Briefcase, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

type DateRange = '7d' | '30d' | '90d' | '1y';

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  // Convert date range to preset
  const getDateRangePreset = (range: DateRange) => {
    switch (range) {
      case '7d':
        return 'LAST_7_DAYS';
      case '30d':
        return 'LAST_30_DAYS';
      case '90d':
        return 'LAST_90_DAYS';
      case '1y':
        return 'THIS_YEAR';
      default:
        return 'LAST_30_DAYS';
    }
  };

  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', dateRange],
    queryFn: async () => {
      const response = await apiClient.post('/api/v1/dashboard/stats', {
        dateRangePreset: getDateRangePreset(dateRange),
        comparePreviousPeriod: true,
      });
      return response.data;
    },
  });

  const { data: dashboardCharts, isLoading: chartsLoading } = useQuery({
    queryKey: ['dashboard-charts', dateRange],
    queryFn: async () => {
      const response = await apiClient.post('/api/v1/dashboard/charts', {
        dateRangePreset: getDateRangePreset(dateRange),
      });
      return response.data;
    },
  });

  const { data: jobCompletionTrend, isLoading: trendLoading } = useQuery({
    queryKey: ['job-completion-trend', dateRange],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/dashboard/job-completion-trend', {
        params: {
          dateRangePreset: getDateRangePreset(dateRange),
        },
      });
      return response.data;
    },
  });

  // Transform backend data to match chart formats
  const revenueData = dashboardCharts ? {
    totalRevenue: dashboardStats?.revenueThisMonth?.amount || 0,
    activeCustomers: dashboardStats?.totalCustomers?.count || 0,
    avgJobValue: dashboardCharts.topCustomers?.[0]?.avgJobValue || 0,
    trend: dashboardCharts.revenueTrend || [],
    byServiceType: [], // TODO: Add service type breakdown to backend
    topCustomers: (dashboardCharts.topCustomers || []).map((c: any, idx: number) => ({
      name: c.name,
      jobs: c.jobsCount,
      revenue: c.totalRevenue,
      percentage: idx === 0 ? 100 : 0, // Calculate from total
    })).slice(0, 5),
  } : null;

  const jobsData = dashboardCharts ? {
    totalJobs: dashboardStats?.activeJobs?.count || 0,
    trend: (jobCompletionTrend || []).map((t: any) => ({
      date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      completed: t.completed || 0,
      scheduled: t.scheduled || 0,
    })),
    byStatus: (dashboardCharts.jobsByStatus || []).map((j: any) => ({
      name: j.status,
      value: j.count,
    })),
    avgCompletionTime: [], // TODO: Add job type breakdown to backend
  } : null;

  const technicianData = dashboardCharts ? {
    performance: (dashboardCharts.technicianPerformance || []).map((t: any) => ({
      name: t.name,
      jobs: t.jobsCompleted,
      revenue: Math.round(t.revenue / 100), // Scale for chart
    })),
    utilization: (dashboardCharts.technicianPerformance || []).map((t: any) => ({
      name: t.name,
      rate: Math.round(t.utilizationRate),
    })),
    satisfaction: (dashboardCharts.technicianPerformance || []).map((t: any) => ({
      name: t.name,
      rating: t.customerRating,
      reviews: t.jobsCompleted,
    })),
  } : null;

  const isLoading = statsLoading || chartsLoading || trendLoading;

  const handleExport = (format: 'csv' | 'pdf') => {
    // In production, this would trigger export via backend API
    alert(`Exporting reports as ${format.toUpperCase()}...`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Insights into your business performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Revenue"
          value={formatCurrency(revenueData?.totalRevenue || 0, 'CAD')}
          change="+12.5%"
          trend="up"
          icon={DollarSign}
        />
        <KPICard
          title="Jobs Completed"
          value={jobsData?.totalJobs || 0}
          change="+8.2%"
          trend="up"
          icon={Briefcase}
        />
        <KPICard
          title="Active Customers"
          value={revenueData?.activeCustomers || 0}
          change="+5.7%"
          trend="up"
          icon={Users}
        />
        <KPICard
          title="Avg. Job Value"
          value={formatCurrency(revenueData?.avgJobValue || 0, 'CAD')}
          change="-2.1%"
          trend="down"
          icon={TrendingUp}
        />
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="technicians">Technicians</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Daily revenue over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={revenueData?.trend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value, 'CAD')} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Revenue"
                  />
                  <Line
                    type="monotone"
                    dataKey="invoiced"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Invoiced"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Service Type</CardTitle>
                <CardDescription>Breakdown by service category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={revenueData?.byServiceType || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {(revenueData?.byServiceType || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value, 'CAD')} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Customers</CardTitle>
                <CardDescription>Highest revenue contributors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(revenueData?.topCustomers || []).map((customer, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 text-blue-700 font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-gray-500">{customer.jobs} jobs</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatCurrency(customer.revenue, 'CAD')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {customer.percentage}% of total
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Completion Trend</CardTitle>
              <CardDescription>Number of jobs completed per day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={jobsData?.trend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" fill="#10b981" name="Completed" />
                  <Bar dataKey="scheduled" fill="#3b82f6" name="Scheduled" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Status Distribution</CardTitle>
                <CardDescription>Current job statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={jobsData?.byStatus || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {(jobsData?.byStatus || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Completion Time</CardTitle>
                <CardDescription>By job type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(jobsData?.avgCompletionTime || []).map((item, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{item.type}</span>
                        <span className="text-sm text-gray-600">{item.hours} hours</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(item.hours / 8) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="technicians" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Technician Performance</CardTitle>
              <CardDescription>Jobs completed and revenue generated</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={technicianData?.performance || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="jobs" fill="#3b82f6" name="Jobs Completed" />
                  <Bar dataKey="revenue" fill="#10b981" name="Revenue (100s)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Utilization Rate</CardTitle>
                <CardDescription>Percentage of time on billable work</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(technicianData?.utilization || []).map((tech, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{tech.name}</span>
                        <span className="text-sm text-gray-600">{tech.rate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            tech.rate >= 80
                              ? 'bg-green-600'
                              : tech.rate >= 60
                              ? 'bg-yellow-600'
                              : 'bg-red-600'
                          }`}
                          style={{ width: `${tech.rate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Satisfaction</CardTitle>
                <CardDescription>Average rating by technician</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(technicianData?.satisfaction || []).map((tech, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{tech.name}</div>
                        <div className="text-sm text-gray-500">{tech.reviews} reviews</div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-lg ${
                              i < Math.floor(tech.rating)
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                        <span className="ml-2 text-sm font-semibold">{tech.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KPICard({
  title,
  value,
  change,
  trend,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down';
  icon: any;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <Icon className="h-4 w-4 text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className={`text-xs ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {change} from last period
        </p>
      </CardContent>
    </Card>
  );
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: '#3b82f6',
  IN_PROGRESS: '#f59e0b',
  COMPLETED: '#10b981',
  CANCELLED: '#6b7280',
};

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
  const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};
