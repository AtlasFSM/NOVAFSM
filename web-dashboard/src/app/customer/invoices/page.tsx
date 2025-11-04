'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Receipt, Download, CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function CustomerInvoicesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['customer-invoices'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/invoices?sortBy=createdAt&order=DESC');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            <p>Failed to load invoices. Please try again later.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const invoices = data?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Invoices</h1>
        <p className="text-gray-600 mt-1">View and pay your invoices</p>
      </div>

      {invoices.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices yet</h3>
              <p className="text-gray-600">
                Your invoices will appear here once they are generated.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {invoices.map((invoice: any) => (
            <InvoiceCard key={invoice.id} invoice={invoice} />
          ))}
        </div>
      )}
    </div>
  );
}

function InvoiceCard({ invoice }: { invoice: any }) {
  const statusConfig = {
    DRAFT: { icon: Clock, label: 'Draft', color: 'bg-gray-100 text-gray-800' },
    SENT: { icon: AlertCircle, label: 'Sent', color: 'bg-blue-100 text-blue-800' },
    PAID: { icon: CheckCircle, label: 'Paid', color: 'bg-green-100 text-green-800' },
    OVERDUE: { icon: AlertCircle, label: 'Overdue', color: 'bg-red-100 text-red-800' },
    CANCELLED: { icon: XCircle, label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
  };

  const config = statusConfig[invoice.status as keyof typeof statusConfig] || statusConfig.DRAFT;
  const StatusIcon = config.icon;

  const handleDownload = () => {
    // In a real app, this would download the PDF
    alert('PDF download feature coming soon!');
  };

  const handlePayNow = () => {
    // In a real app, this would redirect to payment gateway
    alert('Payment processing feature coming soon!');
  };

  const isPayable = invoice.status === 'SENT' || invoice.status === 'OVERDUE';

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <CardTitle className="text-xl">{invoice.number}</CardTitle>
              <Badge className={config.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {config.label}
              </Badge>
            </div>
            <CardDescription>
              {invoice.job?.title || 'Service Invoice'}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            {isPayable && (
              <Button
                variant="default"
                size="sm"
                onClick={handlePayNow}
                className="flex items-center gap-2"
              >
                Pay Now
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">Customer</div>
              <div className="font-medium">{invoice.customer?.name}</div>
            </div>

            {invoice.job && (
              <div>
                <div className="text-sm text-gray-500 mb-1">Job</div>
                <div className="text-sm text-gray-700">
                  {invoice.job.number} - {invoice.job.title}
                </div>
              </div>
            )}

            <div>
              <div className="text-sm text-gray-500 mb-1">Invoice Date</div>
              <div className="text-sm">
                {new Date(invoice.invoiceDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>

            {invoice.dueDate && (
              <div>
                <div className="text-sm text-gray-500 mb-1">Due Date</div>
                <div className={`text-sm ${
                  invoice.status === 'OVERDUE' ? 'text-red-600 font-medium' : ''
                }`}>
                  {new Date(invoice.dueDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            )}

            {invoice.paidDate && (
              <div>
                <div className="text-sm text-gray-500 mb-1">Paid Date</div>
                <div className="text-sm text-green-600 font-medium">
                  {new Date(invoice.paidDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">
                  {formatCurrency(invoice.subtotal, invoice.currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium">
                  {formatCurrency(invoice.taxTotal, invoice.currency)}
                </span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(invoice.discount, invoice.currency)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-semibold">Total Due</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(invoice.total, invoice.currency)}
                  </span>
                </div>
              </div>
            </div>

            {invoice.lineItems && invoice.lineItems.length > 0 && (
              <div>
                <div className="text-sm text-gray-500 mb-2">Line Items</div>
                <div className="space-y-1">
                  {invoice.lineItems.slice(0, 3).map((item: any, index: number) => (
                    <div key={index} className="text-sm flex justify-between">
                      <span className="text-gray-700">{item.description}</span>
                      <span className="text-gray-900 font-medium">
                        {formatCurrency(item.total, invoice.currency)}
                      </span>
                    </div>
                  ))}
                  {invoice.lineItems.length > 3 && (
                    <div className="text-sm text-gray-500 italic">
                      +{invoice.lineItems.length - 3} more items
                    </div>
                  )}
                </div>
              </div>
            )}

            {invoice.notes && (
              <div>
                <div className="text-sm text-gray-500 mb-1">Notes</div>
                <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                  {invoice.notes}
                </div>
              </div>
            )}

            {invoice.paymentInstructions && (
              <div>
                <div className="text-sm text-gray-500 mb-1">Payment Instructions</div>
                <div className="text-sm text-gray-700 bg-blue-50 p-3 rounded border border-blue-200">
                  {invoice.paymentInstructions}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
