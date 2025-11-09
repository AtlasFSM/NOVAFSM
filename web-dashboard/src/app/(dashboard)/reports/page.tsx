'use client';

import { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  DollarSign,
  Users,
  Briefcase,
  Clock,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

type ReportType =
  | 'revenue'
  | 'jobs'
  | 'technicians'
  | 'customers'
  | 'inventory'
  | 'time'
  | 'invoices'
  | 'quotes';

type DateRange = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

interface ReportConfig {
  id: ReportType;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
}

const reportConfigs: ReportConfig[] = [
  {
    id: 'revenue',
    name: 'Revenue Report',
    description: 'Detailed revenue analysis by period, customer, and service type',
    icon: <DollarSign className="h-5 w-5" />,
    category: 'Financial',
  },
  {
    id: 'jobs',
    name: 'Jobs Report',
    description: 'Job statistics including completion rates, average duration, and status breakdown',
    icon: <Briefcase className="h-5 w-5" />,
    category: 'Operations',
  },
  {
    id: 'technicians',
    name: 'Technician Performance',
    description: 'Individual technician metrics, utilization rates, and job completion data',
    icon: <Users className="h-5 w-5" />,
    category: 'Operations',
  },
  {
    id: 'customers',
    name: 'Customer Analysis',
    description: 'Customer lifetime value, job frequency, and satisfaction metrics',
    icon: <Users className="h-5 w-5" />,
    category: 'Sales',
  },
  {
    id: 'inventory',
    name: 'Inventory Report',
    description: 'Stock levels, usage patterns, and reorder requirements',
    icon: <BarChart3 className="h-5 w-5" />,
    category: 'Inventory',
  },
  {
    id: 'time',
    name: 'Time & Expense Report',
    description: 'Time tracking, billable hours, and expense analysis by project',
    icon: <Clock className="h-5 w-5" />,
    category: 'Financial',
  },
  {
    id: 'invoices',
    name: 'Invoice Aging Report',
    description: 'Outstanding invoices, payment status, and aging analysis',
    icon: <FileText className="h-5 w-5" />,
    category: 'Financial',
  },
  {
    id: 'quotes',
    name: 'Quote Conversion Report',
    description: 'Quote-to-job conversion rates, win/loss analysis, and pipeline metrics',
    icon: <TrendingUp className="h-5 w-5" />,
    category: 'Sales',
  },
];

export default function ReportsPage() {
  const { toast } = useToast();
  const [selectedReport, setSelectedReport] = useState<ReportType | ''>('');
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [exportFormat, setExportFormat] = useState<'PDF' | 'CSV' | 'EXCEL'>('PDF');

  const handleGenerateReport = () => {
    if (!selectedReport) {
      toast({
        title: 'Please select a report',
        description: 'Choose a report type to generate',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Generating report...',
      description: `Creating ${reportConfigs.find((r) => r.id === selectedReport)?.name} for the selected period`,
    });

    // TODO: Implement actual report generation
    setTimeout(() => {
      toast({
        title: 'Report ready',
        description: `Your ${exportFormat} report has been generated successfully`,
      });
    }, 2000);
  };

  const groupedReports = reportConfigs.reduce((acc, report) => {
    if (!acc[report.category]) {
      acc[report.category] = [];
    }
    acc[report.category].push(report);
    return acc;
  }, {} as Record<string, ReportConfig[]>);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Generate comprehensive reports and analytics for your business
        </p>
      </div>

      {/* Report Generator */}
      <Card>
        <CardHeader>
          <CardTitle>Report Generator</CardTitle>
          <CardDescription>
            Select a report type, configure parameters, and generate your report
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {/* Report Selection */}
            <div className="grid gap-2">
              <Label htmlFor="report-type">Report Type</Label>
              <Select
                value={selectedReport}
                onValueChange={(value) => setSelectedReport(value as ReportType)}
              >
                <SelectTrigger id="report-type">
                  <SelectValue placeholder="Select a report type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(groupedReports).map(([category, reports]) => (
                    <div key={category}>
                      <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                        {category}
                      </div>
                      {reports.map((report) => (
                        <SelectItem key={report.id} value={report.id}>
                          {report.name}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
              {selectedReport && (
                <p className="text-sm text-muted-foreground">
                  {reportConfigs.find((r) => r.id === selectedReport)?.description}
                </p>
              )}
            </div>

            {/* Date Range */}
            <div className="grid gap-2">
              <Label htmlFor="date-range">Date Range</Label>
              <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
                <SelectTrigger id="date-range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Export Format */}
            <div className="grid gap-2">
              <Label htmlFor="export-format">Export Format</Label>
              <Select
                value={exportFormat}
                onValueChange={(value) => setExportFormat(value as 'PDF' | 'CSV' | 'EXCEL')}
              >
                <SelectTrigger id="export-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PDF">PDF Document</SelectItem>
                  <SelectItem value="CSV">CSV Spreadsheet</SelectItem>
                  <SelectItem value="EXCEL">Excel Workbook</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Generate Button */}
            <Button onClick={handleGenerateReport} className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Available Reports Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Available Reports</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reportConfigs.map((report) => (
            <Card
              key={report.id}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setSelectedReport(report.id)}
            >
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {report.icon}
                  </div>
                  <div>
                    <CardTitle className="text-base">{report.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{report.category}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{report.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Frequently used reports for quick access</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <Button variant="outline" className="justify-start">
              <Calendar className="mr-2 h-4 w-4" />
              Today's Jobs Summary
            </Button>
            <Button variant="outline" className="justify-start">
              <DollarSign className="mr-2 h-4 w-4" />
              This Month's Revenue
            </Button>
            <Button variant="outline" className="justify-start">
              <FileText className="mr-2 h-4 w-4" />
              Outstanding Invoices
            </Button>
            <Button variant="outline" className="justify-start">
              <TrendingUp className="mr-2 h-4 w-4" />
              Pending Quotes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
