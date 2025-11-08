'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  User,
  MapPin,
  Calendar,
  Clock,
  FileText,
  DollarSign,
  Plus,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import CreateInvoiceDialog from './create-invoice-dialog';

interface JobDetailPageProps {
  params: {
    id: string;
  };
}

export default function JobDetailPage({ params }: JobDetailPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);

  const { data: jobData, isLoading } = useQuery({
    queryKey: ['job', params.id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/jobs/${params.id}?include=customer,site,assignedTechnician,invoice,timeEntries`);
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!jobData) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Job not found</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/jobs">Back to Jobs</Link>
          </Button>
        </div>
      </div>
    );
  }

  const job = jobData;
  const invoice = job.invoice;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'ON_HOLD':
        return 'bg-orange-100 text-orange-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'bg-gray-100 text-gray-600';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-600';
      case 'HIGH':
        return 'bg-orange-100 text-orange-600';
      case 'URGENT':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getInvoiceStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'SENT':
        return 'bg-blue-100 text-blue-800';
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/jobs">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </Link>
          </Button>
        </div>
        <Button asChild>
          <Link href={`/dashboard/jobs/${params.id}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Job
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">{job.number}</h1>
            <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
            <Badge className={getPriorityColor(job.priority)}>{job.priority}</Badge>
          </div>
          <h2 className="text-xl text-gray-600 mt-2">{job.title}</h2>
        </div>
      </div>

      {/* Job Details Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <User className="h-4 w-4" />
              Customer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="font-semibold">{job.customer?.name}</p>
              {job.customer?.email && (
                <p className="text-sm text-gray-600">{job.customer.email}</p>
              )}
              {job.customer?.phone && (
                <p className="text-sm text-gray-600">{job.customer.phone}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {job.site && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Site Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{job.site.address}</p>
              {job.site.city && (
                <p className="text-sm text-gray-600">
                  {job.site.city}, {job.site.provinceState} {job.site.postalZip}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {job.assignedTechnician && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <User className="h-4 w-4" />
                Assigned Technician
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">
                {job.assignedTechnician.firstName} {job.assignedTechnician.lastName}
              </p>
              <p className="text-sm text-gray-600">{job.assignedTechnician.email}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="time">Time Entries</TabsTrigger>
          <TabsTrigger value="invoice">Invoice</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Job Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {job.description && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Description</p>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{job.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Scheduled Start</p>
                  <p className="text-sm text-gray-900 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {job.scheduledStart
                      ? new Date(job.scheduledStart).toLocaleString()
                      : 'Not scheduled'}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Scheduled End</p>
                  <p className="text-sm text-gray-900 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {job.scheduledEnd
                      ? new Date(job.scheduledEnd).toLocaleString()
                      : 'Not scheduled'}
                  </p>
                </div>

                {job.actualStart && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Actual Start</p>
                    <p className="text-sm text-gray-900 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {new Date(job.actualStart).toLocaleString()}
                    </p>
                  </div>
                )}

                {job.actualEnd && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Actual End</p>
                    <p className="text-sm text-gray-900 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {new Date(job.actualEnd).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {job.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Notes</p>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{job.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Time Entries</CardTitle>
              <CardDescription>Track time spent on this job</CardDescription>
            </CardHeader>
            <CardContent>
              {!job.timeEntries || job.timeEntries.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No time entries recorded</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Technician</TableHead>
                      <TableHead>Start Time</TableHead>
                      <TableHead>End Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {job.timeEntries.map((entry: any) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          {entry.technician?.firstName} {entry.technician?.lastName}
                        </TableCell>
                        <TableCell>{new Date(entry.startTime).toLocaleString()}</TableCell>
                        <TableCell>
                          {entry.endTime ? new Date(entry.endTime).toLocaleString() : 'In Progress'}
                        </TableCell>
                        <TableCell>
                          {entry.endTime
                            ? `${Math.round((new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / (1000 * 60))} min`
                            : '-'}
                        </TableCell>
                        <TableCell>{entry.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoice" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Invoice
                  </CardTitle>
                  <CardDescription>
                    {invoice
                      ? 'Invoice has been created for this job'
                      : 'Create an invoice for this completed job'}
                  </CardDescription>
                </div>
                {!invoice && job.status === 'COMPLETED' && (
                  <Button onClick={() => setShowCreateInvoice(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Invoice
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {invoice ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <FileText className="h-8 w-8 text-gray-400" />
                      <div>
                        <p className="font-semibold text-lg">{invoice.number}</p>
                        <p className="text-sm text-gray-600">
                          Issued: {invoice.issuedAt ? new Date(invoice.issuedAt).toLocaleDateString() : 'Not issued'}
                        </p>
                        {invoice.dueAt && (
                          <p className="text-sm text-gray-600">
                            Due: {new Date(invoice.dueAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getInvoiceStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                      <p className="text-2xl font-bold mt-2">
                        {formatCurrency(invoice.total, invoice.currency)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Subtotal: {formatCurrency(invoice.subtotal, invoice.currency)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Tax: {formatCurrency(invoice.taxTotal, invoice.currency)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button asChild variant="outline" className="flex-1">
                      <Link href={`/dashboard/invoices/${invoice.id}`}>
                        <FileText className="h-4 w-4 mr-2" />
                        View Invoice Details
                      </Link>
                    </Button>
                    {invoice.status === 'PAID' && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-md">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium text-green-700">
                          Paid on {invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString() : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Invoice Lines */}
                  {invoice.lines && invoice.lines.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold mb-3">Line Items</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Description</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead className="text-right">Unit Price</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoice.lines.map((line: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{line.description}</p>
                                  {line.sku && (
                                    <p className="text-xs text-gray-500">SKU: {line.sku}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{line.quantity}</TableCell>
                              <TableCell>{line.unit}</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(line.unitPrice, invoice.currency)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(line.amount, invoice.currency)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              ) : job.status !== 'COMPLETED' ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Invoices can only be created for completed jobs</p>
                  <p className="text-sm mt-1">Current status: {job.status}</p>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No invoice has been created for this job yet</p>
                  <Button onClick={() => setShowCreateInvoice(true)} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Invoice
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Invoice Dialog */}
      {showCreateInvoice && (
        <CreateInvoiceDialog
          open={showCreateInvoice}
          onClose={() => setShowCreateInvoice(false)}
          job={job}
          customerId={job.customerId}
        />
      )}
    </div>
  );
}
