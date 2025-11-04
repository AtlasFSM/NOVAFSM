import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type {
  Job,
  JobFilters,
  CreateJobInput,
  UpdateJobInput,
  ScheduleConflict,
} from '@/types';
import { toast } from 'sonner';

// Query keys
const jobKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobKeys.all, 'list'] as const,
  list: (filters: JobFilters) => [...jobKeys.lists(), filters] as const,
  details: () => [...jobKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobKeys.details(), id] as const,
  conflicts: (technicianId: string, startTime: string, endTime: string) =>
    [...jobKeys.all, 'conflicts', technicianId, startTime, endTime] as const,
};

// Fetch jobs with filters
export function useJobs(filters: JobFilters = {}) {
  return useQuery({
    queryKey: jobKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.status?.length) {
        filters.status.forEach((s) => params.append('status', s));
      }
      if (filters.priority?.length) {
        filters.priority.forEach((p) => params.append('priority', p));
      }
      if (filters.assignedToId) {
        params.append('assignedToId', filters.assignedToId);
      }
      if (filters.customerId) {
        params.append('customerId', filters.customerId);
      }
      if (filters.startDate) {
        params.append('startDate', filters.startDate);
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }

      const { data } = await apiClient.get<Job[]>(`/jobs?${params.toString()}`);
      return data;
    },
  });
}

// Fetch single job
export function useJob(id: string) {
  return useQuery({
    queryKey: jobKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<Job>(`/jobs/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

// Create job
export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateJobInput) => {
      const { data } = await apiClient.post<Job>('/jobs', input);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
      toast.success(`Job ${data.number} created successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to create job: ${error.message}`);
    },
  });
}

// Update job
export function useUpdateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateJobInput }) => {
      const { data } = await apiClient.patch<Job>(`/jobs/${id}`, input);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(data.id) });
      toast.success(`Job ${data.number} updated successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update job: ${error.message}`);
    },
  });
}

// Assign job to technician
export function useAssignJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      technicianId,
    }: {
      jobId: string;
      technicianId: string;
    }) => {
      const { data } = await apiClient.post<Job>(`/jobs/${jobId}/assign`, {
        technicianId,
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(data.id) });
      toast.success(`Job ${data.number} assigned successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to assign job: ${error.message}`);
    },
  });
}

// Start job
export function useStartJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      location,
    }: {
      jobId: string;
      location?: { latitude: number; longitude: number };
    }) => {
      const { data } = await apiClient.post<Job>(`/jobs/${jobId}/start`, {
        location,
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(data.id) });
      toast.success(`Job ${data.number} started`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to start job: ${error.message}`);
    },
  });
}

// Complete job
export function useCompleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      location,
    }: {
      jobId: string;
      location?: { latitude: number; longitude: number };
    }) => {
      const { data } = await apiClient.post<Job>(`/jobs/${jobId}/complete`, {
        location,
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(data.id) });
      toast.success(`Job ${data.number} completed`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to complete job: ${error.message}`);
    },
  });
}

// Cancel job
export function useCancelJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      reason,
    }: {
      jobId: string;
      reason?: string;
    }) => {
      const { data } = await apiClient.post<Job>(`/jobs/${jobId}/cancel`, {
        reason,
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(data.id) });
      toast.success(`Job ${data.number} cancelled`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to cancel job: ${error.message}`);
    },
  });
}

// Check schedule conflicts
export function useScheduleConflicts(
  technicianId?: string,
  startTime?: string,
  endTime?: string
) {
  return useQuery({
    queryKey: jobKeys.conflicts(
      technicianId || '',
      startTime || '',
      endTime || ''
    ),
    queryFn: async () => {
      const { data } = await apiClient.get<ScheduleConflict[]>(
        `/jobs/conflicts`,
        {
          params: {
            technicianId,
            startTime,
            endTime,
          },
        }
      );
      return data;
    },
    enabled: !!(technicianId && startTime && endTime),
  });
}

// Bulk assign jobs
export function useBulkAssignJobs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobIds,
      technicianId,
    }: {
      jobIds: string[];
      technicianId: string;
    }) => {
      const { data } = await apiClient.post('/jobs/bulk-assign', {
        jobIds,
        technicianId,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
      toast.success('Jobs assigned successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to assign jobs: ${error.message}`);
    },
  });
}
