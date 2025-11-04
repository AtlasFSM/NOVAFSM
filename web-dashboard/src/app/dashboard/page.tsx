'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  Users,
  Briefcase,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

export default function DashboardHomePage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Mock data - replace with real API calls
      return {
        totalRevenue: 127500,
        totalCustomers: 48,
        activeJobs: 23,
        pendingQuotes: 12,
        revenueGrowth: 12.5,
        customerGrowth: 8.2,
        jobsGrowth: 15.3,
        quotesGrowth: -5.2,
      };
    },
  });

  const { data: recentJobs } = useQuery({
    queryKey: ['recent-jobs'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/jobs?limit=5&sortBy=updatedAt&order=DESC');
      return response.data;
    },
  });

  const { data: recentQuotes } = useQuery({
    queryKey: ['recent-quotes'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/quotes?limit=5&sortBy=updatedAt&order=DESC');
      return response.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/jobs/new">
            <Briefcase className="h-4 w-4 mr-2" />
            Create Job
          </Link>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats?.totalRevenue || 0, 'CAD')}
          change={stats?.revenueGrowth || 0}
          icon={DollarSign}
          trend="up"
        />
        <StatCard
          title="Total Customers"
          value={stats?.totalCustomers || 0}
          change={stats?.customerGrowth || 0}
          icon={Users}
          trend="up"
        />
        <StatCard
          title="Active Jobs"
          value={stats?.activeJobs || 0}
          change={stats?.jobsGrowth || 0}
          icon={Briefcase}
          trend="up"
        />
        <StatCard
          title="Pending Quotes"
          value={stats?.pendingQuotes || 0}
          change={stats?.quotesGrowth || 0}
          icon={FileText}
          trend={stats?.quotesGrowth && stats.quotesGrowth > 0 ? 'up' : 'down'}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Jobs</CardTitle>
              <CardDescription>Latest job updates</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/jobs">
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentJobs?.data && recentJobs.data.length > 0 ? (
              <div className="space-y-4">
                {recentJobs.data.slice(0, 5).map((job: any) => (
                  <div key={job.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${getStatusColor(job.status)}`} />
                      <div>
                        <Link
                          href={`/dashboard/jobs/${job.id}`}
                          className="font-medium hover:text-blue-600"
                        >
                          {job.number}
                        </Link>
                        <p className="text-sm text-gray-600">{job.title}</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {getStatusLabel(job.status)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">No recent jobs</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Quotes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Quotes</CardTitle>
              <CardDescription>Latest quote activity</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/quotes">
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentQuotes?.data && recentQuotes.data.length > 0 ? (
              <div className="space-y-4">
                {recentQuotes.data.slice(0, 5).map((quote: any) => (
                  <div key={quote.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${getQuoteStatusColor(quote.status)}`} />
                      <div>
                        <Link
                          href={`/dashboard/quotes/${quote.id}`}
                          className="font-medium hover:text-blue-600"
                        >
                          {quote.number}
                        </Link>
                        <p className="text-sm text-gray-600">{quote.customer?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatCurrency(quote.total, quote.currency)}
                      </p>
                      <span className="text-xs text-gray-500">
                        {getQuoteStatusLabel(quote.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">No recent quotes</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-24 flex-col" asChild>
              <Link href="/dashboard/quotes/new">
                <FileText className="h-6 w-6 mb-2" />
                New Quote
              </Link>
            </Button>
            <Button variant="outline" className="h-24 flex-col" asChild>
              <Link href="/dashboard/jobs/new">
                <Briefcase className="h-6 w-6 mb-2" />
                New Job
              </Link>
            </Button>
            <Button variant="outline" className="h-24 flex-col" asChild>
              <Link href="/dashboard/customers/new">
                <Users className="h-6 w-6 mb-2" />
                New Customer
              </Link>
            </Button>
            <Button variant="outline" className="h-24 flex-col" asChild>
              <Link href="/dashboard/schedule">
                <Clock className="h-6 w-6 mb-2" />
                View Schedule
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  change: number;
  icon: any;
  trend: 'up' | 'down';
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <Icon className="h-4 w-4 text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className={`text-xs flex items-center mt-1 ${
          trend === 'up' ? 'text-green-600' : 'text-red-600'
        }`}>
          <TrendingUp className={`h-3 w-3 mr-1 ${trend === 'down' ? 'rotate-180' : ''}`} />
          {Math.abs(change)}% from last month
        </p>
      </CardContent>
    </Card>
  );
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    SCHEDULED: 'bg-blue-500',
    IN_PROGRESS: 'bg-yellow-500',
    COMPLETED: 'bg-green-500',
    CANCELLED: 'bg-gray-400',
  };
  return colors[status] || 'bg-gray-400';
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    SCHEDULED: 'Scheduled',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  };
  return labels[status] || status;
}

function getQuoteStatusColor(status: string): string {
  const colors: Record<string, string> = {
    DRAFT: 'bg-gray-400',
    SENT: 'bg-blue-500',
    APPROVED: 'bg-green-500',
    REJECTED: 'bg-red-500',
    EXPIRED: 'bg-gray-400',
  };
  return colors[status] || 'bg-gray-400';
}

function getQuoteStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: 'Draft',
    SENT: 'Sent',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    EXPIRED: 'Expired',
  };
  return labels[status] || status;
}
