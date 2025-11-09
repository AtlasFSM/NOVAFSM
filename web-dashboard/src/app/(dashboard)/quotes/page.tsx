'use client';

import { useState } from 'react';
import { Plus, Search, MoreHorizontal, Edit, Trash2, Send, CheckCircle, XCircle, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  useQuotes,
  useCreateQuote,
  useUpdateQuote,
  useDeleteQuote,
  useSendQuote,
  useApproveQuote,
  useRejectQuote,
  useConvertQuoteToJob,
  type Quote,
  type CreateQuoteDto,
} from '@/hooks/use-quotes';
import { useCustomers } from '@/hooks/use-customers';
import { format } from 'date-fns';

interface QuoteLine {
  description: string;
  quantity: number;
  unitPrice: number;
  taxCode?: string;
}

export default function QuotesPage() {
  const [search, setSearch] = useState('');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const { toast } = useToast();
  const { data: quotes = [], isLoading } = useQuotes();
  const { data: customers = [] } = useCustomers();
  const createMutation = useCreateQuote();
  const updateMutation = useUpdateQuote();
  const deleteMutation = useDeleteQuote();
  const sendMutation = useSendQuote();
  const approveMutation = useApproveQuote();
  const rejectMutation = useRejectQuote();
  const convertMutation = useConvertQuoteToJob();

  const [formData, setFormData] = useState<CreateQuoteDto>({
    customerId: '',
    title: '',
    description: '',
    validUntil: '',
    discount: 0,
    notes: '',
    lines: [{ description: '', quantity: 1, unitPrice: 0, taxCode: '' }],
  });

  const resetForm = () => {
    setFormData({
      customerId: '',
      title: '',
      description: '',
      validUntil: '',
      discount: 0,
      notes: '',
      lines: [{ description: '', quantity: 1, unitPrice: 0, taxCode: '' }],
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync(formData);
      toast({ title: 'Quote created successfully' });
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: 'Error creating quote',
        description: error.response?.data?.message || 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (quote: Quote) => {
    setSelectedQuote(quote);
    setFormData({
      customerId: quote.customerId,
      title: quote.title,
      description: quote.description || '',
      validUntil: quote.validUntil,
      discount: quote.discount,
      notes: quote.notes || '',
      lines: quote.lines.map(line => ({
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        taxCode: line.taxCode,
      })),
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuote) return;

    try {
      await updateMutation.mutateAsync({
        id: selectedQuote.id,
        data: { ...formData, version: selectedQuote.version },
      });
      toast({ title: 'Quote updated successfully' });
      setIsEditDialogOpen(false);
      setSelectedQuote(null);
      resetForm();
    } catch (error: any) {
      toast({
        title: 'Error updating quote',
        description: error.response?.data?.message || 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedQuote) return;

    try {
      await deleteMutation.mutateAsync(selectedQuote.id);
      toast({ title: 'Quote deleted successfully' });
      setIsDeleteDialogOpen(false);
      setSelectedQuote(null);
    } catch (error: any) {
      toast({
        title: 'Error deleting quote',
        description: error.response?.data?.message || 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  const handleSend = async (quote: Quote) => {
    try {
      await sendMutation.mutateAsync(quote.id);
      toast({ title: 'Quote sent successfully' });
    } catch (error: any) {
      toast({
        title: 'Error sending quote',
        description: error.response?.data?.message || 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  const handleApprove = async (quote: Quote) => {
    try {
      await approveMutation.mutateAsync(quote.id);
      toast({ title: 'Quote approved successfully' });
    } catch (error: any) {
      toast({
        title: 'Error approving quote',
        description: error.response?.data?.message || 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async () => {
    if (!selectedQuote) return;

    try {
      await rejectMutation.mutateAsync({ id: selectedQuote.id, reason: rejectReason });
      toast({ title: 'Quote rejected' });
      setIsRejectDialogOpen(false);
      setSelectedQuote(null);
      setRejectReason('');
    } catch (error: any) {
      toast({
        title: 'Error rejecting quote',
        description: error.response?.data?.message || 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  const handleConvertToJob = async (quote: Quote) => {
    try {
      await convertMutation.mutateAsync(quote.id);
      toast({ title: 'Quote converted to job successfully' });
    } catch (error: any) {
      toast({
        title: 'Error converting quote',
        description: error.response?.data?.message || 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  const addLine = () => {
    setFormData({
      ...formData,
      lines: [...formData.lines, { description: '', quantity: 1, unitPrice: 0, taxCode: '' }],
    });
  };

  const removeLine = (index: number) => {
    setFormData({
      ...formData,
      lines: formData.lines.filter((_, i) => i !== index),
    });
  };

  const updateLine = (index: number, field: keyof QuoteLine, value: any) => {
    const newLines = [...formData.lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setFormData({ ...formData, lines: newLines });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
      DRAFT: { variant: 'secondary' },
      SENT: { variant: 'default', className: 'bg-blue-500' },
      APPROVED: { variant: 'default', className: 'bg-green-500' },
      REJECTED: { variant: 'destructive' },
      EXPIRED: { variant: 'outline' },
    };
    const config = variants[status] || { variant: 'default' };
    return <Badge variant={config.variant} className={config.className}>{status}</Badge>;
  };

  const filteredQuotes = quotes.filter((quote) =>
    quote.number.toLowerCase().includes(search.toLowerCase()) ||
    quote.title.toLowerCase().includes(search.toLowerCase()) ||
    quote.customerName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quotes</h1>
          <p className="text-muted-foreground">
            Create and manage customer quotes and proposals.
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Quote
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search quotes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Valid Until</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredQuotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No quotes found
                </TableCell>
              </TableRow>
            ) : (
              filteredQuotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium">{quote.number}</TableCell>
                  <TableCell>{quote.customerName || '-'}</TableCell>
                  <TableCell>{quote.title}</TableCell>
                  <TableCell>${quote.total.toFixed(2)}</TableCell>
                  <TableCell>
                    {quote.validUntil ? format(new Date(quote.validUntil), 'MMM dd, yyyy') : '-'}
                  </TableCell>
                  <TableCell>{getStatusBadge(quote.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(quote)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {quote.status === 'DRAFT' && (
                          <DropdownMenuItem onClick={() => handleSend(quote)}>
                            <Send className="mr-2 h-4 w-4" />
                            Send
                          </DropdownMenuItem>
                        )}
                        {quote.status === 'SENT' && (
                          <>
                            <DropdownMenuItem onClick={() => handleApprove(quote)}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedQuote(quote);
                                setIsRejectDialogOpen(true);
                              }}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}
                        {quote.status === 'APPROVED' && (
                          <DropdownMenuItem onClick={() => handleConvertToJob(quote)}>
                            <Briefcase className="mr-2 h-4 w-4" />
                            Convert to Job
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedQuote(quote);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Add Quote</DialogTitle>
              <DialogDescription>Create a new quote for a customer.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="customerId">Customer *</Label>
                <Select
                  value={formData.customerId}
                  onValueChange={(value) => setFormData({ ...formData, customerId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="validUntil">Valid Until</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="discount">Discount</Label>
                <Input
                  id="discount"
                  type="number"
                  step="0.01"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Line Items *</Label>
                  <Button type="button" size="sm" onClick={addLine}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Line
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.lines.map((line, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 p-2 border rounded">
                      <div className="col-span-5">
                        <Input
                          placeholder="Description"
                          value={line.description}
                          onChange={(e) => updateLine(index, 'description', e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={line.quantity}
                          onChange={(e) => updateLine(index, 'quantity', parseFloat(e.target.value) || 1)}
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Price"
                          value={line.unitPrice}
                          onChange={(e) => updateLine(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          placeholder="Tax"
                          value={line.taxCode || ''}
                          onChange={(e) => updateLine(index, 'taxCode', e.target.value)}
                        />
                      </div>
                      <div className="col-span-1 flex items-center">
                        {formData.lines.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLine(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Quote'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Quote</DialogTitle>
              <DialogDescription>Update quote information.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-customerId">Customer *</Label>
                <Select
                  value={formData.customerId}
                  onValueChange={(value) => setFormData({ ...formData, customerId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-validUntil">Valid Until</Label>
                <Input
                  id="edit-validUntil"
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-discount">Discount</Label>
                <Input
                  id="edit-discount"
                  type="number"
                  step="0.01"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Line Items *</Label>
                  <Button type="button" size="sm" onClick={addLine}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Line
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.lines.map((line, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 p-2 border rounded">
                      <div className="col-span-5">
                        <Input
                          placeholder="Description"
                          value={line.description}
                          onChange={(e) => updateLine(index, 'description', e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={line.quantity}
                          onChange={(e) => updateLine(index, 'quantity', parseFloat(e.target.value) || 1)}
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Price"
                          value={line.unitPrice}
                          onChange={(e) => updateLine(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          placeholder="Tax"
                          value={line.taxCode || ''}
                          onChange={(e) => updateLine(index, 'taxCode', e.target.value)}
                        />
                      </div>
                      <div className="col-span-1 flex items-center">
                        {formData.lines.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLine(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Updating...' : 'Update Quote'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quote</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete quote {selectedQuote?.number}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Quote</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting quote {selectedQuote?.number}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reject-reason">Reason *</Label>
              <Textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMutation.isPending || !rejectReason}
            >
              {rejectMutation.isPending ? 'Rejecting...' : 'Reject Quote'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
