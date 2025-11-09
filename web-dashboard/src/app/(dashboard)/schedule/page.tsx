'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, Users, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type ScheduleView = 'day' | 'week' | 'month';

export default function SchedulePage() {
  const [view, setView] = useState<ScheduleView>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTechnician, setSelectedTechnician] = useState<string>('all');

  // Mock data for demonstration - replace with actual API calls
  const mockTechnicians = [
    { id: '1', name: 'John Smith', availability: 85, jobsToday: 3 },
    { id: '2', name: 'Sarah Johnson', availability: 92, jobsToday: 2 },
    { id: '3', name: 'Mike Wilson', availability: 78, jobsToday: 4 },
    { id: '4', name: 'Emily Brown', availability: 95, jobsToday: 1 },
  ];

  const mockScheduleItems = [
    {
      id: '1',
      time: '09:00 AM',
      duration: '2h',
      technicianId: '1',
      technicianName: 'John Smith',
      jobNumber: 'JOB-2024-001234',
      customer: 'Acme Corp',
      location: 'Toronto, ON',
      status: 'SCHEDULED',
    },
    {
      id: '2',
      time: '11:30 AM',
      duration: '1.5h',
      technicianId: '2',
      technicianName: 'Sarah Johnson',
      jobNumber: 'JOB-2024-001235',
      customer: 'Global Industries',
      location: 'Mississauga, ON',
      status: 'IN_PROGRESS',
    },
    {
      id: '3',
      time: '02:00 PM',
      duration: '3h',
      technicianId: '1',
      technicianName: 'John Smith',
      jobNumber: 'JOB-2024-001236',
      customer: 'Tech Solutions',
      location: 'Brampton, ON',
      status: 'SCHEDULED',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredItems = selectedTechnician === 'all'
    ? mockScheduleItems
    : mockScheduleItems.filter((item) => item.technicianId === selectedTechnician);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
        <p className="text-muted-foreground">
          View and manage job schedules and technician assignments
        </p>
      </div>

      {/* Technicians Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {mockTechnicians.map((tech) => (
          <Card key={tech.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{tech.name}</CardTitle>
              <CardDescription className="text-xs">Technician</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Availability</span>
                  <span className="text-sm font-semibold">{tech.availability}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Jobs Today</span>
                  <Badge variant="secondary">{tech.jobsToday}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={view === 'day' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('day')}
          >
            Day
          </Button>
          <Button
            variant={view === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('week')}
          >
            Week
          </Button>
          <Button
            variant={view === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('month')}
          >
            Month
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by technician" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Technicians</SelectItem>
              {mockTechnicians.map((tech) => (
                <SelectItem key={tech.id} value={tech.id}>
                  {tech.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            {selectedDate.toLocaleDateString()}
          </Button>
        </div>
      </div>

      {/* Schedule View */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Schedule</CardTitle>
          <CardDescription>
            {filteredItems.length} job(s) scheduled
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredItems.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-muted-foreground">No jobs scheduled</p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-4 rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{item.time}</span>
                      <Badge variant="outline" className="text-xs">
                        {item.duration}
                      </Badge>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                    </div>

                    <div className="text-sm">
                      <span className="font-medium">{item.jobNumber}</span>
                      {' • '}
                      <span>{item.customer}</span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {item.technicianName}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {item.location}
                      </div>
                    </div>
                  </div>

                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Utilization Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87.5%</div>
            <p className="text-xs text-muted-foreground">Across all technicians</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Jobs Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockScheduleItems.length}</div>
            <p className="text-xs text-muted-foreground">For today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Available Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24h</div>
            <p className="text-xs text-muted-foreground">Total capacity remaining</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
