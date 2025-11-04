'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Edit, Send, CheckCircle, XCircle, FileText } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

interface QuoteDetailPageProps {
  params: {
    id: string;
  };
}

export default function QuoteDetailPage({ params }: QuoteDetailPageProps) {
  const queryClient = useQueryClient();

  const { data: quoteData, isLoading } = useQuery({
    queryKey: ['quote', params.id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/quotes/${params.id}`);
      return response.data;
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post(`/api/v1/quotes/${params.id}/send`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote', params.id] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post(`/api/v1/quotes/${params.id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote', params.id] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post(`/api/v1/quotes/${params.id}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote', params.id] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Loading quote...</p>
        </div>
      </div>
    );
  }

  if (!quoteData) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Quote not found</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/quotes">Back to Quotes</Link>
          </Button>
        </div>
      </div>
    );
  }

  const quote = quoteData;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'secondary';
      case 'SENT':
        return 'default';
      case 'APPROVED':
        return 'default';
      case 'REJECTED':
        return 'destructive';
      case 'EXPIRED':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/quotes">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {quote.status === 'DRAFT' && (
            <>
              <Button variant="outline" asChild>
                <Link href={`/dashboard/quotes/${params.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
              <Button onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending}>
                <Send className="h-4 w-4 mr-2" />
                {sendMutation.isPending ? 'Sending...' : 'Send to Customer'}
              </Button>
            </>
          )}
          {quote.status === 'SENT' && (
            <>
              <Button
                variant="outline"
                onClick={() => rejectMutation.mutate()}
                disabled={rejectMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}>
                <CheckCircle className="h-4 w-4 mr-2" />
                {approveMutation.isPending ? 'Approving...' : 'Approve'}
              </Button>
            </>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900">Quote {quote.number}</h1>
          <Badge variant={getStatusBadgeVariant(quote.status)}>{quote.status}</Badge>
        </div>
        {quote.title && <p className="text-gray-600 mt-1">{quote.title}</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent>
            {quote.customer ? (
              <div>
                <Link
                  href={`/dashboard/customers/${quote.customer.id}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {quote.customer.name}
                </Link>
                {quote.customer.email && (
                  <p className="text-sm text-gray-600 mt-1">{quote.customer.email}</p>
                )}
                {quote.customer.phone && (
                  <p className="text-sm text-gray-600">{quote.customer.phone}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No customer information</p>
            )}
          </CardContent>
        </Card>

        {/* Quote Info */}
        <Card>
          <CardHeader>
            <CardTitle>Quote Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-gray-600">Created</p>
              <p className="font-medium">{new Date(quote.createdAt).toLocaleDateString()}</p>
            </div>
            {quote.validUntil && (
              <div>
                <p className="text-sm text-gray-600">Valid Until</p>
                <p className="font-medium">{new Date(quote.validUntil).toLocaleDateString()}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Currency</p>
              <p className="font-medium">{quote.currency}</p>
            </div>
          </CardContent>
        </Card>

        {/* Total */}
        <Card>
          <CardHeader>
            <CardTitle>Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(quote.total, quote.currency)}</div>
            {quote.subtotal && (
              <div className="mt-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(quote.subtotal, quote.currency)}</span>
                </div>
                {quote.discounts > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discounts:</span>
                    <span>-{formatCurrency(quote.discounts, quote.currency)}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {quote.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-gray-700">{quote.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quote.lines && quote.lines.length > 0 ? (
                  quote.lines.map((line: any) => (
                    <TableRow key={line.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{line.description}</p>
                          {line.sku && <p className="text-sm text-gray-500">SKU: {line.sku}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {line.quantity} {line.unit}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(line.unitPrice, quote.currency)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {line.discounts > 0 ? `-${formatCurrency(line.discounts, quote.currency)}` : '—'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(line.lineTotal, quote.currency)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500">
                      No line items
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {quote.lines && quote.lines.length > 0 && (
            <div className="mt-6 flex justify-end">
              <div className="w-80 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>{formatCurrency(quote.subtotal || 0, quote.currency)}</span>
                </div>
                {quote.discounts > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Discounts:</span>
                    <span>-{formatCurrency(quote.discounts, quote.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span>{formatCurrency(quote.total, quote.currency)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Terms & Notes */}
      <div className="grid gap-6 lg:grid-cols-2">
        {quote.termsConditions && (
          <Card>
            <CardHeader>
              <CardTitle>Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-gray-700">{quote.termsConditions}</p>
            </CardContent>
          </Card>
        )}

        {quote.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Internal Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-gray-700">{quote.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
