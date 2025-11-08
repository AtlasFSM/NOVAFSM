'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Clock, DollarSign, Calendar, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  useTimeEntries,
  useCreateTimeEntry,
  useUpdateTimeEntry,
  useDeleteTimeEntry,
  useExpenseEntries,
  useCreateExpenseEntry,
  useUpdateExpenseEntry,
  useDeleteExpenseEntry,
  type TimeEntry as APITimeEntry,
  type ExpenseEntry as APIExpenseEntry,
} from '@/hooks/use-time-expense';

// Extend API types with UI-specific fields
type TimeEntry = APITimeEntry & {
  status?: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  duration?: number;
};

type ExpenseEntry = APIExpenseEntry & {
  status?: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
};

export default function TimeExpensePage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('time');
  const [showTimeDialog, setShowTimeDialog] = useState(false);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [editingTimeEntry, setEditingTimeEntry] = useState<TimeEntry | null>(null);
  const [editingExpenseEntry, setEditingExpenseEntry] = useState<ExpenseEntry | null>(null);

  // API hooks
  const { data: timeEntries = [], isLoading: loadingTimeEntries, error: timeEntriesError } = useTimeEntries();
  const createTimeEntry = useCreateTimeEntry();
  const updateTimeEntry = useUpdateTimeEntry();
  const deleteTimeEntry = useDeleteTimeEntry();

  const { data: expenseEntries = [], isLoading: loadingExpenseEntries, error: expenseEntriesError } = useExpenseEntries();
  const createExpenseEntry = useCreateExpenseEntry();
  const updateExpenseEntry = useUpdateExpenseEntry();
  const deleteExpenseEntry = useDeleteExpenseEntry();

  const handleCreateTimeEntry = async (formData: any) => {
    try {
      await createTimeEntry.mutateAsync({
        jobId: formData.jobId || undefined,
        jobNumber: formData.jobNumber || undefined,
        type: formData.type,
        startTime: formData.startTime,
        endTime: formData.endTime || undefined,
        notes: formData.notes,
      });
      setShowTimeDialog(false);
      toast({
        title: 'Success',
        description: 'Time entry created successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create time entry',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateTimeEntry = async (id: string, formData: any) => {
    try {
      await updateTimeEntry.mutateAsync({
        id,
        data: formData,
      });
      setShowTimeDialog(false);
      setEditingTimeEntry(null);
      toast({
        title: 'Success',
        description: 'Time entry updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update time entry',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTimeEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this time entry?')) {
      return;
    }

    try {
      await deleteTimeEntry.mutateAsync(id);
      toast({
        title: 'Success',
        description: 'Time entry deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete time entry',
        variant: 'destructive',
      });
    }
  };

  const handleSubmitTimeEntry = async (id: string) => {
    try {
      await updateTimeEntry.mutateAsync({
        id,
        data: { status: 'SUBMITTED' as any },
      });
      toast({
        title: 'Success',
        description: 'Time entry submitted for approval',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to submit time entry',
        variant: 'destructive',
      });
    }
  };

  const handleApproveTimeEntry = async (id: string) => {
    try {
      await updateTimeEntry.mutateAsync({
        id,
        data: { status: 'APPROVED' as any },
      });
      toast({
        title: 'Success',
        description: 'Time entry approved',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to approve time entry',
        variant: 'destructive',
      });
    }
  };

  const handleCreateExpenseEntry = async (formData: any) => {
    try {
      await createExpenseEntry.mutateAsync({
        jobId: formData.jobId || undefined,
        jobNumber: formData.jobNumber || undefined,
        type: formData.type,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        description: formData.description,
        receiptUrl: formData.receiptUrl || undefined,
        expenseDate: formData.expenseDate,
      });
      setShowExpenseDialog(false);
      toast({
        title: 'Success',
        description: 'Expense entry created successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create expense entry',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateExpenseEntry = async (id: string, formData: any) => {
    try {
      await updateExpenseEntry.mutateAsync({
        id,
        data: formData,
      });
      setShowExpenseDialog(false);
      setEditingExpenseEntry(null);
      toast({
        title: 'Success',
        description: 'Expense entry updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update expense entry',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteExpenseEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense entry?')) {
      return;
    }

    try {
      await deleteExpenseEntry.mutateAsync(id);
      toast({
        title: 'Success',
        description: 'Expense entry deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete expense entry',
        variant: 'destructive',
      });
    }
  };

  const handleSubmitExpenseEntry = async (id: string) => {
    try {
      await updateExpenseEntry.mutateAsync({
        id,
        data: { status: 'SUBMITTED' as any },
      });
      toast({
        title: 'Success',
        description: 'Expense entry submitted for approval',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to submit expense entry',
        variant: 'destructive',
      });
    }
  };

  const handleApproveExpenseEntry = async (id: string) => {
    try {
      await updateExpenseEntry.mutateAsync({
        id,
        data: { status: 'APPROVED' as any },
      });
      toast({
        title: 'Success',
        description: 'Expense entry approved',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to approve expense entry',
        variant: 'destructive',
      });
    }
  };

  const formatDuration = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const totalTimeHours = timeEntries
    .filter(e => e.status === 'APPROVED')
    .reduce((sum, e) => sum + (e.duration || 0), 0);

  const totalExpenseAmount = expenseEntries
    .filter(e => e.status === 'APPROVED')
    .reduce((sum, e) => sum + e.amount, 0);

  // Loading state
  if (loadingTimeEntries || loadingExpenseEntries) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (timeEntriesError || expenseEntriesError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load time & expense entries</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Time & Expense</h1>
          <p className="text-muted-foreground">
            Track time entries and expense reports for jobs and general work.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right mr-4">
            <div className="text-sm text-muted-foreground">Approved This Period</div>
            <div className="text-2xl font-bold">{formatDuration(totalTimeHours)} / ${totalExpenseAmount.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="time" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Time Entries
          </TabsTrigger>
          <TabsTrigger value="expense" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Expense Entries
          </TabsTrigger>
        </TabsList>

        <TabsContent value="time" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {timeEntries.length} total entries
            </div>
            <Button onClick={() => {
              setEditingTimeEntry(null);
              setShowTimeDialog(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              New Time Entry
            </Button>
          </div>

          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.userName}</TableCell>
                    <TableCell>
                      {entry.jobNumber ? (
                        <Badge variant="outline">{entry.jobNumber}</Badge>
                      ) : (
                        <span className="text-muted-foreground">General</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{entry.type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDateTime(entry.startTime)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {entry.endTime ? formatDateTime(entry.endTime) : '-'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {entry.duration ? formatDuration(entry.duration) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          entry.status === 'APPROVED'
                            ? 'default'
                            : entry.status === 'REJECTED'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {entry.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {entry.status === 'DRAFT' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSubmitTimeEntry(entry.id)}
                          >
                            Submit
                          </Button>
                        )}
                        {entry.status === 'SUBMITTED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApproveTimeEntry(entry.id)}
                          >
                            Approve
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingTimeEntry(entry);
                            setShowTimeDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTimeEntry(entry.id)}
                          disabled={entry.status === 'APPROVED'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="expense" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {expenseEntries.length} total entries
            </div>
            <Button onClick={() => {
              setEditingExpenseEntry(null);
              setShowExpenseDialog(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              New Expense Entry
            </Button>
          </div>

          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenseEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.userName}</TableCell>
                    <TableCell>
                      {entry.jobNumber ? (
                        <Badge variant="outline">{entry.jobNumber}</Badge>
                      ) : (
                        <span className="text-muted-foreground">General</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{entry.type}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {entry.description}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(entry.expenseDate)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${entry.amount.toFixed(2)} {entry.currency}
                    </TableCell>
                    <TableCell>
                      {entry.receiptUrl ? (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={entry.receiptUrl} target="_blank" rel="noopener noreferrer">
                            <FileText className="h-4 w-4" />
                          </a>
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          entry.status === 'APPROVED'
                            ? 'default'
                            : entry.status === 'REJECTED'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {entry.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {entry.status === 'DRAFT' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSubmitExpenseEntry(entry.id)}
                          >
                            Submit
                          </Button>
                        )}
                        {entry.status === 'SUBMITTED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApproveExpenseEntry(entry.id)}
                          >
                            Approve
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingExpenseEntry(entry);
                            setShowExpenseDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteExpenseEntry(entry.id)}
                          disabled={entry.status === 'APPROVED'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Time Entry Dialog */}
      <TimeEntryDialog
        open={showTimeDialog}
        onOpenChange={setShowTimeDialog}
        timeEntry={editingTimeEntry}
        onSubmit={(data) => {
          if (editingTimeEntry) {
            handleUpdateTimeEntry(editingTimeEntry.id, data);
          } else {
            handleCreateTimeEntry(data);
          }
        }}
        isSubmitting={createTimeEntry.isPending || updateTimeEntry.isPending}
      />

      {/* Expense Entry Dialog */}
      <ExpenseEntryDialog
        open={showExpenseDialog}
        onOpenChange={setShowExpenseDialog}
        expenseEntry={editingExpenseEntry}
        onSubmit={(data) => {
          if (editingExpenseEntry) {
            handleUpdateExpenseEntry(editingExpenseEntry.id, data);
          } else {
            handleCreateExpenseEntry(data);
          }
        }}
        isSubmitting={createExpenseEntry.isPending || updateExpenseEntry.isPending}
      />
    </div>
  );
}

function TimeEntryDialog({
  open,
  onOpenChange,
  timeEntry,
  onSubmit,
  isSubmitting = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timeEntry: TimeEntry | null;
  onSubmit: (data: any) => void;
  isSubmitting?: boolean;
}) {
  const [formData, setFormData] = useState({
    jobNumber: timeEntry?.jobNumber || '',
    type: timeEntry?.type || 'WORK',
    startTime: timeEntry?.startTime || new Date().toISOString().slice(0, 16),
    endTime: timeEntry?.endTime || '',
    duration: timeEntry?.duration?.toString() || '',
    notes: timeEntry?.notes || '',
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {timeEntry ? 'Edit Time Entry' : 'New Time Entry'}
          </DialogTitle>
          <DialogDescription>
            {timeEntry
              ? 'Update the time entry details below.'
              : 'Create a new time entry for tracking work hours.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="jobNumber">Job Number (Optional)</Label>
            <Input
              id="jobNumber"
              value={formData.jobNumber}
              onChange={(e) => setFormData({ ...formData, jobNumber: e.target.value })}
              placeholder="J-2024-001"
            />
          </div>
          <div>
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WORK">Work</SelectItem>
                <SelectItem value="TRAVEL">Travel</SelectItem>
                <SelectItem value="BREAK">Break</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="startTime">Start Time</Label>
            <Input
              id="startTime"
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="endTime">End Time (Optional)</Label>
            <Input
              id="endTime"
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="duration">Duration (hours)</Label>
            <Input
              id="duration"
              type="number"
              step="0.25"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              placeholder="8"
            />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Description of work performed"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={() => onSubmit(formData)} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              timeEntry ? 'Update' : 'Create'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ExpenseEntryDialog({
  open,
  onOpenChange,
  expenseEntry,
  onSubmit,
  isSubmitting = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenseEntry: ExpenseEntry | null;
  onSubmit: (data: any) => void;
  isSubmitting?: boolean;
}) {
  const [formData, setFormData] = useState({
    jobNumber: expenseEntry?.jobNumber || '',
    type: expenseEntry?.type || 'MATERIALS',
    amount: expenseEntry?.amount?.toString() || '',
    currency: expenseEntry?.currency || 'CAD',
    description: expenseEntry?.description || '',
    receiptUrl: expenseEntry?.receiptUrl || '',
    expenseDate: expenseEntry?.expenseDate || new Date().toISOString().slice(0, 10),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {expenseEntry ? 'Edit Expense Entry' : 'New Expense Entry'}
          </DialogTitle>
          <DialogDescription>
            {expenseEntry
              ? 'Update the expense entry details below.'
              : 'Create a new expense entry for tracking costs.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="jobNumber">Job Number (Optional)</Label>
            <Input
              id="jobNumber"
              value={formData.jobNumber}
              onChange={(e) => setFormData({ ...formData, jobNumber: e.target.value })}
              placeholder="J-2024-001"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MILEAGE">Mileage</SelectItem>
                  <SelectItem value="MATERIALS">Materials</SelectItem>
                  <SelectItem value="MEALS">Meals</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="expenseDate">Date</Label>
              <Input
                id="expenseDate"
                type="date"
                value={formData.expenseDate}
                onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CAD">CAD</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description of the expense"
            />
          </div>
          <div>
            <Label htmlFor="receiptUrl">Receipt URL (Optional)</Label>
            <Input
              id="receiptUrl"
              value={formData.receiptUrl}
              onChange={(e) => setFormData({ ...formData, receiptUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={() => onSubmit(formData)} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              expenseEntry ? 'Update' : 'Create'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
