'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Clock, DollarSign, Calendar, FileText } from 'lucide-react';
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

interface TimeEntry {
  id: string;
  userId: string;
  userName: string;
  jobId?: string;
  jobNumber?: string;
  type: 'WORK' | 'TRAVEL' | 'BREAK';
  startTime: string;
  endTime?: string;
  duration?: number;
  notes?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
}

interface ExpenseEntry {
  id: string;
  userId: string;
  userName: string;
  jobId?: string;
  jobNumber?: string;
  type: 'MILEAGE' | 'MATERIALS' | 'MEALS' | 'OTHER';
  amount: number;
  currency: 'CAD' | 'USD';
  description: string;
  receiptUrl?: string;
  expenseDate: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
}

export default function TimeExpensePage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('time');
  const [showTimeDialog, setShowTimeDialog] = useState(false);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [editingTimeEntry, setEditingTimeEntry] = useState<TimeEntry | null>(null);
  const [editingExpenseEntry, setEditingExpenseEntry] = useState<ExpenseEntry | null>(null);

  // Mock data - replace with actual API calls
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([
    {
      id: '1',
      userId: 'user1',
      userName: 'John Smith',
      jobId: 'job1',
      jobNumber: 'J-2024-001',
      type: 'WORK',
      startTime: '2024-11-08T09:00:00Z',
      endTime: '2024-11-08T17:00:00Z',
      duration: 8,
      notes: 'HVAC installation at customer site',
      status: 'SUBMITTED',
    },
    {
      id: '2',
      userId: 'user1',
      userName: 'John Smith',
      jobId: 'job1',
      jobNumber: 'J-2024-001',
      type: 'TRAVEL',
      startTime: '2024-11-08T08:00:00Z',
      endTime: '2024-11-08T09:00:00Z',
      duration: 1,
      notes: 'Travel to customer site',
      status: 'SUBMITTED',
    },
  ]);

  const [expenseEntries, setExpenseEntries] = useState<ExpenseEntry[]>([
    {
      id: '1',
      userId: 'user1',
      userName: 'John Smith',
      jobId: 'job1',
      jobNumber: 'J-2024-001',
      type: 'MILEAGE',
      amount: 45.50,
      currency: 'CAD',
      description: 'Travel to customer site - 65 km @ $0.70/km',
      expenseDate: '2024-11-08',
      status: 'SUBMITTED',
    },
    {
      id: '2',
      userId: 'user1',
      userName: 'John Smith',
      jobId: 'job1',
      jobNumber: 'J-2024-001',
      type: 'MATERIALS',
      amount: 125.00,
      currency: 'CAD',
      description: 'Emergency parts from local supplier',
      receiptUrl: 'https://example.com/receipt.pdf',
      expenseDate: '2024-11-08',
      status: 'SUBMITTED',
    },
  ]);

  const handleCreateTimeEntry = (formData: any) => {
    const newEntry: TimeEntry = {
      id: Date.now().toString(),
      userId: 'current-user',
      userName: 'Current User',
      jobId: formData.jobId || undefined,
      jobNumber: formData.jobNumber || undefined,
      type: formData.type,
      startTime: formData.startTime,
      endTime: formData.endTime || undefined,
      duration: formData.duration ? parseFloat(formData.duration) : undefined,
      notes: formData.notes,
      status: 'DRAFT',
    };
    setTimeEntries([...timeEntries, newEntry]);
    setShowTimeDialog(false);
    toast({
      title: 'Success',
      description: 'Time entry created successfully',
    });
  };

  const handleUpdateTimeEntry = (id: string, formData: any) => {
    setTimeEntries(timeEntries.map(entry =>
      entry.id === id ? { ...entry, ...formData } : entry
    ));
    setShowTimeDialog(false);
    setEditingTimeEntry(null);
    toast({
      title: 'Success',
      description: 'Time entry updated successfully',
    });
  };

  const handleDeleteTimeEntry = (id: string) => {
    setTimeEntries(timeEntries.filter(entry => entry.id !== id));
    toast({
      title: 'Success',
      description: 'Time entry deleted successfully',
    });
  };

  const handleSubmitTimeEntry = (id: string) => {
    setTimeEntries(timeEntries.map(entry =>
      entry.id === id ? { ...entry, status: 'SUBMITTED' as const } : entry
    ));
    toast({
      title: 'Success',
      description: 'Time entry submitted for approval',
    });
  };

  const handleApproveTimeEntry = (id: string) => {
    setTimeEntries(timeEntries.map(entry =>
      entry.id === id ? { ...entry, status: 'APPROVED' as const } : entry
    ));
    toast({
      title: 'Success',
      description: 'Time entry approved',
    });
  };

  const handleCreateExpenseEntry = (formData: any) => {
    const newEntry: ExpenseEntry = {
      id: Date.now().toString(),
      userId: 'current-user',
      userName: 'Current User',
      jobId: formData.jobId || undefined,
      jobNumber: formData.jobNumber || undefined,
      type: formData.type,
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      description: formData.description,
      receiptUrl: formData.receiptUrl || undefined,
      expenseDate: formData.expenseDate,
      status: 'DRAFT',
    };
    setExpenseEntries([...expenseEntries, newEntry]);
    setShowExpenseDialog(false);
    toast({
      title: 'Success',
      description: 'Expense entry created successfully',
    });
  };

  const handleUpdateExpenseEntry = (id: string, formData: any) => {
    setExpenseEntries(expenseEntries.map(entry =>
      entry.id === id ? { ...entry, ...formData } : entry
    ));
    setShowExpenseDialog(false);
    setEditingExpenseEntry(null);
    toast({
      title: 'Success',
      description: 'Expense entry updated successfully',
    });
  };

  const handleDeleteExpenseEntry = (id: string) => {
    setExpenseEntries(expenseEntries.filter(entry => entry.id !== id));
    toast({
      title: 'Success',
      description: 'Expense entry deleted successfully',
    });
  };

  const handleSubmitExpenseEntry = (id: string) => {
    setExpenseEntries(expenseEntries.map(entry =>
      entry.id === id ? { ...entry, status: 'SUBMITTED' as const } : entry
    ));
    toast({
      title: 'Success',
      description: 'Expense entry submitted for approval',
    });
  };

  const handleApproveExpenseEntry = (id: string) => {
    setExpenseEntries(expenseEntries.map(entry =>
      entry.id === id ? { ...entry, status: 'APPROVED' as const } : entry
    ));
    toast({
      title: 'Success',
      description: 'Expense entry approved',
    });
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
      />
    </div>
  );
}

function TimeEntryDialog({
  open,
  onOpenChange,
  timeEntry,
  onSubmit
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timeEntry: TimeEntry | null;
  onSubmit: (data: any) => void;
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onSubmit(formData)}>
            {timeEntry ? 'Update' : 'Create'}
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
  onSubmit
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenseEntry: ExpenseEntry | null;
  onSubmit: (data: any) => void;
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onSubmit(formData)}>
            {expenseEntry ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
