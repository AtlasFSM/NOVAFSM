import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface Site {
  id: string;
  tenantId: string;
  customerId: string;
  customerName?: string;
  name: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useSites(customerId?: string) {
  return useQuery({
    queryKey: customerId ? ['sites', 'customer', customerId] : ['sites'],
    queryFn: async () => {
      const url = customerId ? `/sites?customerId=${customerId}` : '/sites';
      const response = await apiClient.get(url);
      return response.data as Site[];
    },
  });
}

export function useSite(id: string) {
  return useQuery({
    queryKey: ['site', id],
    queryFn: async () => {
      const response = await apiClient.get(`/sites/${id}`);
      return response.data as Site;
    },
    enabled: !!id,
  });
}

export function useCreateSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Site>) => {
      const response = await apiClient.post('/sites', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
  });
}

export function useUpdateSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Site> }) => {
      const response = await apiClient.put(`/sites/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      queryClient.invalidateQueries({ queryKey: ['site', variables.id] });
    },
  });
}

export function useDeleteSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/sites/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
  });
}

export function useSetPrimarySite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.patch(`/sites/${id}/set-primary`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    },
  });
}
