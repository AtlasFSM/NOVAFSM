import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface QuoteLine {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxCode?: string;
  total: number;
}

export interface Quote {
  id: string;
  tenantId: string;
  number: string;
  customerId: string;
  customerName?: string;
  title: string;
  description?: string;
  validUntil: string;
  subtotal: number;
  taxTotal: number;
  discount: number;
  total: number;
  status: 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  notes?: string;
  lines: QuoteLine[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuoteDto {
  customerId: string;
  title: string;
  description?: string;
  validUntil: string;
  discount?: number;
  notes?: string;
  lines: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxCode?: string;
  }>;
}

export interface UpdateQuoteDto extends Partial<CreateQuoteDto> {
  version: number;
}

export function useQuotes(params?: { customerId?: string; status?: string }) {
  return useQuery({
    queryKey: ['quotes', params],
    queryFn: async () => {
      const response = await apiClient.get('/quotes', { params });
      return response.data.data as Quote[];
    },
  });
}

export function useQuote(id: string) {
  return useQuery({
    queryKey: ['quote', id],
    queryFn: async () => {
      const response = await apiClient.get(`/quotes/${id}`);
      return response.data.data as Quote;
    },
    enabled: !!id,
  });
}

export function useCreateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateQuoteDto) => {
      const response = await apiClient.post('/quotes', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}

export function useUpdateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateQuoteDto }) => {
      const response = await apiClient.put(`/quotes/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quote', variables.id] });
    },
  });
}

export function useDeleteQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/quotes/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}

export function useSendQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post(`/quotes/${id}/send`);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quote', id] });
    },
  });
}

export function useApproveQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post(`/quotes/${id}/approve`);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quote', id] });
    },
  });
}

export function useRejectQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await apiClient.post(`/quotes/${id}/reject`, { reason });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quote', variables.id] });
    },
  });
}

export function useConvertQuoteToJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post(`/quotes/${id}/convert-to-job`);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quote', id] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}
