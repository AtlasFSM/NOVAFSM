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

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['reports-revenue', dateRange],
    queryFn: async () => {
      // Mock data - in production, this would call the backend API
      return generateMockRevenueData(dateRange);
    },
  });

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['reports-jobs', dateRange],
    queryFn: async () => {
      return generateMockJobsData(dateRange);
    },
  });

  const { data: technicianData, isLoading: technicianLoading } = useQuery({
    queryKey: ['reports-technicians', dateRange],
    queryFn: async () => {
      return generateMockTechnicianData();
    },
  });

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

// Mock data generators
function generateMockRevenueData(range: DateRange) {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
  const trend = Array.from({ length: Math.min(days, 30) }, (_, i) => ({
    date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    revenue: Math.random() * 5000 + 2000,
    invoiced: Math.random() * 4000 + 1500,
  }));

  return {
    totalRevenue: 127500,
    activeCustomers: 48,
    avgJobValue: 2656,
    trend,
    byServiceType: [
      { name: 'Installation', value: 45000 },
      { name: 'Repair', value: 35000 },
      { name: 'Maintenance', value: 28000 },
      { name: 'Inspection', value: 19500 },
    ],
    topCustomers: [
      { name: 'Acme Corporation', jobs: 15, revenue: 28500, percentage: 22.4 },
      { name: 'TechStart Inc', jobs: 12, revenue: 19800, percentage: 15.5 },
      { name: 'BuildCo Ltd', jobs: 10, revenue: 16200, percentage: 12.7 },
      { name: 'Metro Services', jobs: 8, revenue: 12400, percentage: 9.7 },
      { name: 'Global Systems', jobs: 7, revenue: 10100, percentage: 7.9 },
    ],
  };
}

function generateMockJobsData(range: DateRange) {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
  const trend = Array.from({ length: Math.min(days, 30) }, (_, i) => ({
    date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    completed: Math.floor(Math.random() * 10) + 3,
    scheduled: Math.floor(Math.random() * 8) + 2,
  }));

  return {
    totalJobs: 156,
    trend,
    byStatus: [
      { name: 'SCHEDULED', value: 32 },
      { name: 'IN_PROGRESS', value: 18 },
      { name: 'COMPLETED', value: 102 },
      { name: 'CANCELLED', value: 4 },
    ],
    avgCompletionTime: [
      { type: 'Installation', hours: 6.5 },
      { type: 'Repair', hours: 3.2 },
      { type: 'Maintenance', hours: 2.1 },
      { type: 'Inspection', hours: 1.5 },
    ],
  };
}

function generateMockTechnicianData() {
  return {
    performance: [
      { name: 'John Smith', jobs: 45, revenue: 285 },
      { name: 'Sarah Johnson', jobs: 38, revenue: 242 },
      { name: 'Mike Davis', jobs: 32, revenue: 198 },
      { name: 'Emily Wilson', jobs: 28, revenue: 176 },
      { name: 'David Brown', jobs: 13, revenue: 82 },
    ],
    utilization: [
      { name: 'John Smith', rate: 87 },
      { name: 'Sarah Johnson', rate: 82 },
      { name: 'Mike Davis', rate: 76 },
      { name: 'Emily Wilson', rate: 71 },
      { name: 'David Brown', rate: 45 },
    ],
    satisfaction: [
      { name: 'John Smith', rating: 4.8, reviews: 42 },
      { name: 'Sarah Johnson', rating: 4.9, reviews: 38 },
      { name: 'Mike Davis', rating: 4.6, reviews: 31 },
      { name: 'Emily Wilson', rating: 4.7, reviews: 26 },
      { name: 'David Brown', rating: 4.5, reviews: 12 },
    ],
  };
}
