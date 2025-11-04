'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Calendar, User, Clock } from 'lucide-react';
import Link from 'next/link';

interface ScheduledJob {
  id: string;
  number: string;
  title: string;
  customerId: string;
  customer?: {
    id: string;
    name: string;
  };
  status: string;
  priority: string;
  scheduledStart: string;
  scheduledEnd: string;
  assignedTechnicianId?: string;
  assignedTechnician?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTechnician, setSelectedTechnician] = useState<string>('all');

  // Get start and end of current week
  const getWeekRange = (date: Date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay()); // Sunday
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6); // Saturday
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  const { start: weekStart, end: weekEnd } = getWeekRange(currentDate);

  const { data: scheduleData, isLoading } = useQuery({
    queryKey: ['schedule', weekStart.toISOString(), weekEnd.toISOString(), selectedTechnician],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: weekStart.toISOString(),
        endDate: weekEnd.toISOString(),
      });
      if (selectedTechnician && selectedTechnician !== 'all') {
        params.append('technicianId', selectedTechnician);
      }
      const response = await apiClient.post('/api/v1/schedule', Object.fromEntries(params));
      return response.data;
    },
  });

  const { data: techniciansData } = useQuery({
    queryKey: ['technicians'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/users?role=TECHNICIAN');
      return response.data;
    },
  });

  const jobs: ScheduledJob[] = scheduleData?.jobs || [];
  const technicians = techniciansData || [];

  const previousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    return day;
  });

  // Group jobs by date
  const jobsByDate = new Map<string, ScheduledJob[]>();
  jobs.forEach((job) => {
    const jobDate = new Date(job.scheduledStart);
    const dateKey = jobDate.toISOString().split('T')[0];
    if (!jobsByDate.has(dateKey)) {
      jobsByDate.set(dateKey, []);
    }
    jobsByDate.get(dateKey)!.push(job);
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'border-l-red-500 bg-red-50';
      case 'HIGH':
        return 'border-l-orange-500 bg-orange-50';
      case 'MEDIUM':
        return 'border-l-blue-500 bg-blue-50';
      case 'LOW':
        return 'border-l-gray-500 bg-gray-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
          <p className="text-gray-600 mt-1">View and manage job schedules</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={previousWeek}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={nextWeek}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Today
                </Button>
              </div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} -{' '}
                {weekEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </CardTitle>
            </div>

            <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Technicians" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Technicians</SelectItem>
                {technicians.map((tech: any) => (
                  <SelectItem key={tech.id} value={tech.id}>
                    {tech.firstName} {tech.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading schedule...</p>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-4">
              {weekDays.map((day) => {
                const dateKey = day.toISOString().split('T')[0];
                const dayJobs = jobsByDate.get(dateKey) || [];
                const isToday =
                  day.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={dateKey}
                    className={`border rounded-lg min-h-[400px] ${
                      isToday ? 'border-blue-500 border-2' : ''
                    }`}
                  >
                    {/* Day Header */}
                    <div
                      className={`p-3 border-b text-center ${
                        isToday ? 'bg-blue-50' : 'bg-gray-50'
                      }`}
                    >
                      <div className="text-sm font-medium text-gray-600">
                        {day.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div
                        className={`text-2xl font-bold ${
                          isToday ? 'text-blue-600' : 'text-gray-900'
                        }`}
                      >
                        {day.getDate()}
                      </div>
                    </div>

                    {/* Jobs */}
                    <div className="p-2 space-y-2">
                      {dayJobs.length === 0 ? (
                        <p className="text-center text-gray-400 text-sm py-4">No jobs</p>
                      ) : (
                        dayJobs
                          .sort(
                            (a, b) =>
                              new Date(a.scheduledStart).getTime() -
                              new Date(b.scheduledStart).getTime()
                          )
                          .map((job) => (
                            <Link
                              key={job.id}
                              href={`/dashboard/jobs/${job.id}`}
                              className={`block p-2 rounded border-l-4 hover:shadow-md transition-shadow ${getPriorityColor(
                                job.priority
                              )}`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-start justify-between gap-1">
                                  <p className="text-xs font-medium truncate">{job.number}</p>
                                  {job.priority === 'URGENT' && (
                                    <Badge variant="destructive" className="text-xs px-1 py-0">
                                      !
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm font-semibold line-clamp-2">{job.title}</p>
                                {job.customer && (
                                  <p className="text-xs text-gray-600 truncate">
                                    {job.customer.name}
                                  </p>
                                )}
                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {new Date(job.scheduledStart).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                                {job.assignedTechnician && (
                                  <div className="flex items-center gap-1 text-xs text-gray-600">
                                    <User className="h-3 w-3" />
                                    <span className="truncate">
                                      {job.assignedTechnician.firstName}{' '}
                                      {job.assignedTechnician.lastName}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </Link>
                          ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Urgent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {jobs.filter((j) => j.priority === 'URGENT').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {jobs.filter((j) => j.status === 'IN_PROGRESS').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {jobs.filter((j) => j.status === 'COMPLETED').length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
