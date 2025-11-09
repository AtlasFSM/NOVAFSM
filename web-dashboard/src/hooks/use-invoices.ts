import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface InvoiceLine {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxCode?: string;
  total: number;
}

export interface Invoice {
  id: string;
  tenantId: string;
  number: string;
  customerId: string;
  customerName?: string;
  jobId?: string;
  quoteId?: string;
  title: string;
  description?: string;
  invoiceDate: string;
  dueDate: string;
  paidDate?: string;
  subtotal: number;
  taxTotal: number;
  discount: number;
  total: number;
  amountPaid: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  notes?: string;
  paymentInstructions?: string;
  lines: InvoiceLine[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceDto {
  customerId: string;
  jobId?: string;
  quoteId?: string;
  title: string;
  description?: string;
  invoiceDate: string;
  dueDate: string;
  discount?: number;
  notes?: string;
  paymentInstructions?: string;
  lines: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxCode?: string;
  }>;
}

export interface UpdateInvoiceDto extends Partial<CreateInvoiceDto> {}

export interface RecordPaymentDto {
  amount: number;
  paymentDate: string;
  paymentMethod?: string;
  notes?: string;
}

export function useInvoices(params?: { customerId?: string; status?: string; jobId?: string }) {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: async () => {
      const response = await apiClient.get('/invoices', { params });
      return response.data.data as Invoice[];
    },
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const response = await apiClient.get(`/invoices/${id}`);
      return response.data.data as Invoice;
    },
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateInvoiceDto) => {
      const response = await apiClient.post('/invoices', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateInvoiceDto }) => {
      const response = await apiClient.put(`/invoices/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.id] });
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/invoices/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useSendInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post(`/invoices/${id}/send`);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
    },
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: RecordPaymentDto }) => {
      const response = await apiClient.post(`/invoices/${id}/payments`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.id] });
    },
  });
}

export function useDownloadInvoicePdf() {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.get(`/invoices/${id}/pdf`, {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return response.data;
    },
  });
}
