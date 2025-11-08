import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface PriceList {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  currency: 'CAD' | 'USD';
  isDefault: boolean;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface PriceItem {
  id: string;
  tenantId: string;
  priceListId: string;
  sku: string;
  name: string;
  description?: string;
  unitPrice: number;
  cost?: number;
  unit: string;
  category?: string;
  itemType: 'SERVICE' | 'PART' | 'LABOR';
  createdAt: string;
  updatedAt: string;
}

export function usePriceLists() {
  return useQuery({
    queryKey: ['price-lists'],
    queryFn: async () => {
      const response = await apiClient.get('/pricing/price-lists');
      return response.data as PriceList[];
    },
  });
}

export function usePriceList(id: string) {
  return useQuery({
    queryKey: ['price-list', id],
    queryFn: async () => {
      const response = await apiClient.get(`/pricing/price-lists/${id}`);
      return response.data as PriceList;
    },
    enabled: !!id,
  });
}

export function useCreatePriceList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<PriceList>) => {
      const response = await apiClient.post('/pricing/price-lists', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-lists'] });
    },
  });
}

export function useUpdatePriceList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PriceList> }) => {
      const response = await apiClient.put(`/pricing/price-lists/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['price-lists'] });
      queryClient.invalidateQueries({ queryKey: ['price-list', variables.id] });
    },
  });
}

export function useDeletePriceList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/pricing/price-lists/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-lists'] });
    },
  });
}

export function useSetDefaultPriceList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.patch(`/pricing/price-lists/${id}/set-default`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-lists'] });
    },
  });
}

// Price Items
export function usePriceItems(priceListId: string) {
  return useQuery({
    queryKey: ['price-items', priceListId],
    queryFn: async () => {
      const response = await apiClient.get(`/pricing/price-items/price-list/${priceListId}`);
      return response.data as PriceItem[];
    },
    enabled: !!priceListId,
  });
}

export function useCreatePriceItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<PriceItem>) => {
      const response = await apiClient.post('/pricing/price-items', data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['price-items', variables.priceListId] });
    },
  });
}

export function useUpdatePriceItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PriceItem> }) => {
      const response = await apiClient.put(`/pricing/price-items/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['price-items', data.priceListId] });
    },
  });
}

export function useDeletePriceItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, priceListId }: { id: string; priceListId: string }) => {
      const response = await apiClient.delete(`/pricing/price-items/${id}`);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['price-items', variables.priceListId] });
    },
  });
}
