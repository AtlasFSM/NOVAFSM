import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface TimeEntry {
  id: string;
  tenantId: string;
  userId: string;
  userName?: string;
  jobId?: string;
  jobNumber?: string;
  type: 'WORK' | 'TRAVEL' | 'BREAK';
  startTime: string;
  endTime?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseEntry {
  id: string;
  tenantId: string;
  userId: string;
  userName?: string;
  jobId?: string;
  jobNumber?: string;
  type: 'MILEAGE' | 'MATERIALS' | 'MEALS' | 'OTHER';
  amount: number;
  currency: 'CAD' | 'USD';
  description: string;
  receiptUrl?: string;
  expenseDate: string;
  createdAt: string;
  updatedAt: string;
}

export function useTimeEntries(userId?: string) {
  return useQuery({
    queryKey: userId ? ['time-entries', 'user', userId] : ['time-entries'],
    queryFn: async () => {
      const url = userId ? `/time-expense/time?userId=${userId}` : '/time-expense/time';
      const response = await apiClient.get(url);
      return response.data as TimeEntry[];
    },
  });
}

export function useCreateTimeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<TimeEntry>) => {
      const response = await apiClient.post('/time-expense/time', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
    },
  });
}

export function useUpdateTimeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TimeEntry> }) => {
      const response = await apiClient.put(`/time-expense/time/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
    },
  });
}

export function useDeleteTimeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/time-expense/time/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
    },
  });
}

export function useExpenseEntries(userId?: string) {
  return useQuery({
    queryKey: userId ? ['expense-entries', 'user', userId] : ['expense-entries'],
    queryFn: async () => {
      const url = userId ? `/time-expense/expense?userId=${userId}` : '/time-expense/expense';
      const response = await apiClient.get(url);
      return response.data as ExpenseEntry[];
    },
  });
}

export function useCreateExpenseEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<ExpenseEntry>) => {
      const response = await apiClient.post('/time-expense/expense', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-entries'] });
    },
  });
}

export function useUpdateExpenseEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ExpenseEntry> }) => {
      const response = await apiClient.put(`/time-expense/expense/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-entries'] });
    },
  });
}

export function useDeleteExpenseEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/time-expense/expense/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-entries'] });
    },
  });
}
