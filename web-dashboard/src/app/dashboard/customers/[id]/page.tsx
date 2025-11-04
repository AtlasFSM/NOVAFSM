'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  FileText,
  Briefcase,
  DollarSign,
  Building2,
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

interface CustomerDetailPageProps {
  params: {
    id: string;
  };
}

export default function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { data: customerData, isLoading } = useQuery({
    queryKey: ['customer', params.id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/customers/${params.id}`);
      return response.data;
    },
  });

  const { data: quotesData } = useQuery({
    queryKey: ['customer-quotes', params.id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/quotes?customerId=${params.id}&limit=10`);
      return response.data;
    },
    enabled: !!params.id,
  });

  const { data: jobsData } = useQuery({
    queryKey: ['customer-jobs', params.id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/jobs?customerId=${params.id}&limit=10`);
      return response.data;
    },
    enabled: !!params.id,
  });

  const { data: invoicesData } = useQuery({
    queryKey: ['customer-invoices', params.id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/invoices?customerId=${params.id}&limit=10`);
      return response.data;
    },
    enabled: !!params.id,
  });

  const { data: sitesData } = useQuery({
    queryKey: ['customer-sites', params.id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/sites?customerId=${params.id}`);
      return response.data;
    },
    enabled: !!params.id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Loading customer details...</p>
        </div>
      </div>
    );
  }

  if (!customerData) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Customer not found</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/customers">Back to Customers</Link>
          </Button>
        </div>
      </div>
    );
  }

  const customer = customerData;
  const quotes = quotesData || [];
  const jobs = jobsData || [];
  const invoices = invoicesData || [];
  const sites = sitesData || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/customers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
        <Button asChild>
          <Link href={`/dashboard/customers/${params.id}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Customer
          </Link>
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge
              variant={
                customer.status === 'ACTIVE'
                  ? 'default'
                  : customer.status === 'INACTIVE'
                  ? 'secondary'
                  : 'outline'
              }
            >
              {customer.status}
            </Badge>
            {customer.tags?.map((tag: string, index: number) => (
              <Badge key={index} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Quotes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{customer._count?.quotes || 0}</div>
              <FileText className="h-4 w-4 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{customer._count?.jobs || 0}</div>
              <Briefcase className="h-4 w-4 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{customer._count?.invoices || 0}</div>
              <DollarSign className="h-4 w-4 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Sites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{customer._count?.sites || 0}</div>
              <Building2 className="h-4 w-4 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {customer.email && (
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Email</p>
                  <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">
                    {customer.email}
                  </a>
                </div>
              </div>
            )}

            {customer.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Phone</p>
                  <a href={`tel:${customer.phone}`} className="text-blue-600 hover:underline">
                    {customer.phone}
                  </a>
                </div>
              </div>
            )}

            {(customer.address || customer.city) && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Address</p>
                  <p className="text-sm">
                    {customer.address && <span>{customer.address}<br /></span>}
                    {[customer.city, customer.provinceState].filter(Boolean).join(', ')}
                    {customer.postalZip && <span> {customer.postalZip}</span>}
                  </p>
                </div>
              </div>
            )}

            {customer.notes && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Notes</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{customer.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <Tabs defaultValue="quotes">
            <CardHeader>
              <TabsList>
                <TabsTrigger value="quotes">Quotes</TabsTrigger>
                <TabsTrigger value="jobs">Jobs</TabsTrigger>
                <TabsTrigger value="invoices">Invoices</TabsTrigger>
                <TabsTrigger value="sites">Sites</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="quotes" className="mt-0">
                {quotes.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No quotes found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Quote #</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotes.map((quote: any) => (
                        <TableRow key={quote.id}>
                          <TableCell>
                            <Link
                              href={`/dashboard/quotes/${quote.id}`}
                              className="font-medium hover:text-blue-600"
                            >
                              {quote.number}
                            </Link>
                          </TableCell>
                          <TableCell>{formatCurrency(quote.total, quote.currency)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{quote.status}</Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(quote.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="jobs" className="mt-0">
                {jobs.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No jobs found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job #</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Scheduled</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobs.map((job: any) => (
                        <TableRow key={job.id}>
                          <TableCell>
                            <Link
                              href={`/dashboard/jobs/${job.id}`}
                              className="font-medium hover:text-blue-600"
                            >
                              {job.number}
                            </Link>
                          </TableCell>
                          <TableCell>{job.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{job.status}</Badge>
                          </TableCell>
                          <TableCell>
                            {job.scheduledStart
                              ? new Date(job.scheduledStart).toLocaleDateString()
                              : 'Not scheduled'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="invoices" className="mt-0">
                {invoices.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No invoices found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice: any) => (
                        <TableRow key={invoice.id}>
                          <TableCell>
                            <Link
                              href={`/dashboard/invoices/${invoice.id}`}
                              className="font-medium hover:text-blue-600"
                            >
                              {invoice.number}
                            </Link>
                          </TableCell>
                          <TableCell>{formatCurrency(invoice.total, invoice.currency)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{invoice.status}</Badge>
                          </TableCell>
                          <TableCell>
                            {invoice.dueDate
                              ? new Date(invoice.dueDate).toLocaleDateString()
                              : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="sites" className="mt-0">
                {sites.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No sites found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Site Name</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Primary</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sites.map((site: any) => (
                        <TableRow key={site.id}>
                          <TableCell className="font-medium">{site.siteName}</TableCell>
                          <TableCell>
                            {[site.city, site.provinceState].filter(Boolean).join(', ')}
                          </TableCell>
                          <TableCell>
                            {site.isPrimary && <Badge>Primary</Badge>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
