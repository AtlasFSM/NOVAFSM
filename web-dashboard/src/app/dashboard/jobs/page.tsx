'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KanbanBoard, KanbanColumn } from '@/components/kanban-board';
import { Plus, Calendar, User, MapPin, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Job {
  id: string;
  number: string;
  title: string;
  description?: string;
  status: 'DRAFT' | 'SCHEDULED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  customerId: string;
  customer?: {
    id: string;
    name: string;
  };
  assignedTechnicianId?: string;
  assignedTechnician?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  scheduledStart?: string;
  scheduledEnd?: string;
  createdAt: string;
  updatedAt: string;
}

export default function JobsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [view, setView] = useState<'kanban' | 'list'>('kanban');

  const { data: jobsData, isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/jobs');
      return response.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ jobId, status }: { jobId: string; status: string }) => {
      await apiClient.patch(`/api/v1/jobs/${jobId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const handleDragEnd = (itemId: string, fromColumn: string, toColumn: string) => {
    updateStatusMutation.mutate({ jobId: itemId, status: toColumn });
  };

  const jobs: Job[] = jobsData || [];

  // Group jobs by status for Kanban
  const kanbanColumns: KanbanColumn<Job>[] = [
    {
      id: 'SCHEDULED',
      title: 'Scheduled',
      items: jobs.filter((job) => job.status === 'SCHEDULED'),
    },
    {
      id: 'IN_PROGRESS',
      title: 'In Progress',
      items: jobs.filter((job) => job.status === 'IN_PROGRESS'),
    },
    {
      id: 'ON_HOLD',
      title: 'On Hold',
      items: jobs.filter((job) => job.status === 'ON_HOLD'),
    },
    {
      id: 'COMPLETED',
      title: 'Completed',
      items: jobs.filter((job) => job.status === 'COMPLETED'),
    },
  ];

  const renderJobCard = (job: Job) => (
    <Card
      className="p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => router.push(`/dashboard/jobs/${job.id}`)}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="font-medium text-sm">{job.number}</p>
            <h4 className="font-semibold mt-1">{job.title}</h4>
          </div>
          <Badge
            variant={
              job.priority === 'URGENT'
                ? 'destructive'
                : job.priority === 'HIGH'
                ? 'default'
                : 'secondary'
            }
            className="ml-2"
          >
            {job.priority}
          </Badge>
        </div>

        {job.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{job.description}</p>
        )}

        <div className="space-y-1 text-sm text-gray-600">
          {job.customer && (
            <div className="flex items-center gap-2">
              <User className="h-3 w-3" />
              <span className="truncate">{job.customer.name}</span>
            </div>
          )}

          {job.assignedTechnician && (
            <div className="flex items-center gap-2">
              <User className="h-3 w-3" />
              <span className="truncate">
                {job.assignedTechnician.firstName} {job.assignedTechnician.lastName}
              </span>
            </div>
          )}

          {job.scheduledStart && (
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              <span>{new Date(job.scheduledStart).toLocaleDateString()}</span>
              {job.scheduledEnd && (
                <>
                  <Clock className="h-3 w-3 ml-1" />
                  <span>
                    {new Date(job.scheduledStart).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'text-red-600 bg-red-50';
      case 'HIGH':
        return 'text-orange-600 bg-orange-50';
      case 'MEDIUM':
        return 'text-blue-600 bg-blue-50';
      case 'LOW':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'text-blue-600 bg-blue-50';
      case 'IN_PROGRESS':
        return 'text-yellow-600 bg-yellow-50';
      case 'ON_HOLD':
        return 'text-orange-600 bg-orange-50';
      case 'COMPLETED':
        return 'text-green-600 bg-green-50';
      case 'CANCELLED':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
          <p className="text-gray-600 mt-1">Manage work orders and job scheduling</p>
        </div>
        <div className="flex items-center gap-3">
          <Tabs value={view} onValueChange={(v) => setView(v as 'kanban' | 'list')}>
            <TabsList>
              <TabsTrigger value="kanban">Kanban</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button asChild>
            <Link href="/dashboard/jobs/new">
              <Plus className="h-4 w-4 mr-2" />
              New Job
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading jobs...</p>
        </div>
      ) : jobs.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <p className="text-gray-500 mb-4">No jobs found</p>
            <Button asChild>
              <Link href="/dashboard/jobs/new">Create your first job</Link>
            </Button>
          </div>
        </Card>
      ) : view === 'kanban' ? (
        <div className="min-h-[600px]">
          <KanbanBoard columns={kanbanColumns} renderItem={renderJobCard} onDragEnd={handleDragEnd} />
        </div>
      ) : (
        <Card className="p-6">
          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => router.push(`/dashboard/jobs/${job.id}`)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <p className="font-medium">{job.number}</p>
                    <h4 className="font-semibold">{job.title}</h4>
                  </div>
                  {job.customer && (
                    <p className="text-sm text-gray-600 mt-1">{job.customer.name}</p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {job.scheduledStart && (
                    <div className="text-sm text-gray-600">
                      {new Date(job.scheduledStart).toLocaleDateString()}
                    </div>
                  )}

                  <Badge className={getPriorityColor(job.priority)}>{job.priority}</Badge>

                  <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
