'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Clock, DollarSign, Calendar, Download } from 'lucide-react';
import { format } from 'date-fns';

interface TimeEntry {
  id: string;
  jobId: string;
  jobNumber: string;
  technicianId: string;
  technicianName: string;
  startTime: string;
  endTime: string | null;
  duration: number;
  notes?: string;
  billable: boolean;
  hourlyRate?: number;
  createdAt: string;
}

interface Expense {
  id: string;
  jobId: string;
  jobNumber: string;
  technicianId: string;
  technicianName: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  receiptUrl?: string;
  billable: boolean;
  approved: boolean;
  createdAt: string;
}

export default function TimeExpensePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [activeTab, setActiveTab] = useState('time');

  const { data: timeEntriesData, isLoading: timeLoading } = useQuery({
    queryKey: ['time-entries', searchQuery, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);
      const response = await apiClient.get(`/api/v1/time-entries?${params.toString()}`);
      return response;
    },
  });

  const { data: expensesData, isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses', searchQuery, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);
      const response = await apiClient.get(`/api/v1/expenses?${params.toString()}`);
      return response;
    },
  });

  const timeEntries = timeEntriesData?.data || [];
  const expenses = expensesData?.data || [];

  const totalHours = timeEntries.reduce((sum: number, entry: TimeEntry) =>
    sum + (entry.duration || 0) / 3600, 0
  );

  const totalExpenses = expenses.reduce((sum: number, expense: Expense) =>
    sum + expense.amount, 0
  );

  const billableHours = timeEntries
    .filter((e: TimeEntry) => e.billable)
    .reduce((sum: number, entry: TimeEntry) => sum + (entry.duration || 0) / 3600, 0);

  const billableExpenses = expenses
    .filter((e: Expense) => e.billable)
    .reduce((sum: number, expense: Expense) => sum + expense.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Time & Expenses</h1>
          <p className="text-gray-600 mt-1">Track time entries and expenses across jobs</p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours.toFixed(2)} hrs</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Billable Hours</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{billableHours.toFixed(2)} hrs</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalExpenses.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Billable Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${billableExpenses.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Search by technician, job..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-40"
            />
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-40"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="time">Time Entries</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
            </TabsList>

            <TabsContent value="time" className="mt-4">
              {timeLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job</TableHead>
                      <TableHead>Technician</TableHead>
                      <TableHead>Start Time</TableHead>
                      <TableHead>End Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Billable</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeEntries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          No time entries found
                        </TableCell>
                      </TableRow>
                    ) : (
                      timeEntries.map((entry: TimeEntry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">{entry.jobNumber}</TableCell>
                          <TableCell>{entry.technicianName}</TableCell>
                          <TableCell>
                            {format(new Date(entry.startTime), 'MMM d, h:mm a')}
                          </TableCell>
                          <TableCell>
                            {entry.endTime
                              ? format(new Date(entry.endTime), 'MMM d, h:mm a')
                              : 'In Progress'}
                          </TableCell>
                          <TableCell>
                            {entry.duration ? `${(entry.duration / 3600).toFixed(2)} hrs` : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={entry.billable ? 'default' : 'secondary'}>
                              {entry.billable ? 'Billable' : 'Non-billable'}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {entry.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="expenses" className="mt-4">
              {expensesLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job</TableHead>
                      <TableHead>Technician</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          No expenses found
                        </TableCell>
                      </TableRow>
                    ) : (
                      expenses.map((expense: Expense) => (
                        <TableRow key={expense.id}>
                          <TableCell className="font-medium">{expense.jobNumber}</TableCell>
                          <TableCell>{expense.technicianName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{expense.category}</Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {expense.description}
                          </TableCell>
                          <TableCell>${expense.amount.toFixed(2)}</TableCell>
                          <TableCell>
                            {format(new Date(expense.date), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Badge variant={expense.billable ? 'default' : 'secondary'}>
                                {expense.billable ? 'Billable' : 'Non-billable'}
                              </Badge>
                              <Badge variant={expense.approved ? 'default' : 'outline'}>
                                {expense.approved ? 'Approved' : 'Pending'}
                              </Badge>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
