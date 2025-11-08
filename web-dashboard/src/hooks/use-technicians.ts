import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface Technician {
  id: string;
  tenantId: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  skills: string[];
  certifications: string[];
  availability: {
    monday?: { start: string; end: string };
    tuesday?: { start: string; end: string };
    wednesday?: { start: string; end: string };
    thursday?: { start: string; end: string };
    friday?: { start: string; end: string };
    saturday?: { start: string; end: string };
    sunday?: { start: string; end: string };
  };
  currentLocation?: {
    lat: number;
    lng: number;
    timestamp: string;
  };
  status: 'AVAILABLE' | 'ON_JOB' | 'OFF_DUTY';
  activeJobsCount?: number;
  completedJobsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export function useTechnicians() {
  return useQuery({
    queryKey: ['technicians'],
    queryFn: async () => {
      const response = await apiClient.get('/technicians');
      return response.data as Technician[];
    },
  });
}

export function useTechnician(id: string) {
  return useQuery({
    queryKey: ['technician', id],
    queryFn: async () => {
      const response = await apiClient.get(`/technicians/${id}`);
      return response.data as Technician;
    },
    enabled: !!id,
  });
}

export function useCreateTechnician() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Technician>) => {
      const response = await apiClient.post('/technicians', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
    },
  });
}

export function useUpdateTechnician() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Technician> }) => {
      const response = await apiClient.put(`/technicians/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      queryClient.invalidateQueries({ queryKey: ['technician', variables.id] });
    },
  });
}

export function useDeleteTechnician() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/technicians/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
    },
  });
}

export function useUpdateTechnicianStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Technician['status'] }) => {
      const response = await apiClient.patch(`/technicians/${id}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
    },
  });
}
