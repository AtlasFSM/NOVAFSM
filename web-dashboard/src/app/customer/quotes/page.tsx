'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, Download, CheckCircle, XCircle, Clock, Send } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function CustomerQuotesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['customer-quotes'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/quotes?sortBy=createdAt&order=DESC');
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
            <p>Failed to load quotes. Please try again later.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const quotes = data?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Quotes</h1>
        <p className="text-gray-600 mt-1">View and manage your service quotes</p>
      </div>

      {quotes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No quotes yet</h3>
              <p className="text-gray-600">
                Your service quotes will appear here once they are created.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {quotes.map((quote: any) => (
            <QuoteCard key={quote.id} quote={quote} />
          ))}
        </div>
      )}
    </div>
  );
}

function QuoteCard({ quote }: { quote: any }) {
  const statusConfig = {
    DRAFT: { icon: Clock, label: 'Draft', color: 'bg-gray-100 text-gray-800' },
    SENT: { icon: Send, label: 'Sent', color: 'bg-blue-100 text-blue-800' },
    APPROVED: { icon: CheckCircle, label: 'Approved', color: 'bg-green-100 text-green-800' },
    REJECTED: { icon: XCircle, label: 'Rejected', color: 'bg-red-100 text-red-800' },
    EXPIRED: { icon: Clock, label: 'Expired', color: 'bg-gray-100 text-gray-800' },
  };

  const config = statusConfig[quote.status as keyof typeof statusConfig] || statusConfig.DRAFT;
  const StatusIcon = config.icon;

  const handleDownload = () => {
    // In a real app, this would download the PDF
    alert('PDF download feature coming soon!');
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <CardTitle className="text-xl">{quote.number}</CardTitle>
              <Badge className={config.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {config.label}
              </Badge>
            </div>
            <CardDescription>{quote.title || 'Service Quote'}</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">Customer</div>
              <div className="font-medium">{quote.customer?.name}</div>
            </div>

            {quote.description && (
              <div>
                <div className="text-sm text-gray-500 mb-1">Description</div>
                <div className="text-sm text-gray-700">{quote.description}</div>
              </div>
            )}

            <div>
              <div className="text-sm text-gray-500 mb-1">Created</div>
              <div className="text-sm">
                {new Date(quote.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>

            {quote.expiresAt && (
              <div>
                <div className="text-sm text-gray-500 mb-1">Expires</div>
                <div className="text-sm">
                  {new Date(quote.expiresAt).toLocaleDateString('en-US', {
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
                  {formatCurrency(quote.subtotal, quote.currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium">
                  {formatCurrency(quote.taxTotal, quote.currency)}
                </span>
              </div>
              {quote.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(quote.discount, quote.currency)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(quote.total, quote.currency)}
                  </span>
                </div>
              </div>
            </div>

            {quote.status === 'SENT' && (
              <div className="flex gap-2">
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={() => alert('Approve feature coming soon!')}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => alert('Reject feature coming soon!')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Decline
                </Button>
              </div>
            )}

            {quote.lineItems && quote.lineItems.length > 0 && (
              <div>
                <div className="text-sm text-gray-500 mb-2">Line Items</div>
                <div className="space-y-1">
                  {quote.lineItems.slice(0, 3).map((item: any, index: number) => (
                    <div key={index} className="text-sm flex justify-between">
                      <span className="text-gray-700">{item.description}</span>
                      <span className="text-gray-900 font-medium">
                        {formatCurrency(item.total, quote.currency)}
                      </span>
                    </div>
                  ))}
                  {quote.lineItems.length > 3 && (
                    <div className="text-sm text-gray-500 italic">
                      +{quote.lineItems.length - 3} more items
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
