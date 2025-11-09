'use client';

import { useState } from 'react';
import { Plus, Search, MoreHorizontal, Edit, Trash2, UserPlus, Play, CheckCircle, Ban } from 'lucide-react';
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
  useJobs,
  useCreateJob,
  useUpdateJob,
  useAssignJob,
  useStartJob,
  useCompleteJob,
  useCancelJob,
} from '@/hooks/use-jobs';
import { useCustomers } from '@/hooks/use-customers';
import { useSites } from '@/hooks/use-sites';
import { useTechnicians } from '@/hooks/use-technicians';
import { JobStatus, JobPriority, type Job, type CreateJobInput } from '@/types';
import { format } from 'date-fns';

export default function JobsPage() {
  const [search, setSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState('');

  const { toast } = useToast();
  const { data: jobs = [], isLoading } = useJobs({ search });
  const { data: customers = [] } = useCustomers();
  const { data: sites = [] } = useSites();
  const { data: technicians = [] } = useTechnicians();
  const createMutation = useCreateJob();
  const updateMutation = useUpdateJob();
  const assignMutation = useAssignJob();
  const startMutation = useStartJob();
  const completeMutation = useCompleteJob();
  const cancelMutation = useCancelJob();

  const [formData, setFormData] = useState<CreateJobInput>({
    title: '',
    description: '',
    priority: JobPriority.MEDIUM,
    customerId: '',
    siteId: '',
    assignedToId: '',
    scheduledStart: '',
    scheduledEnd: '',
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: JobPriority.MEDIUM,
      customerId: '',
      siteId: '',
      assignedToId: '',
      scheduledStart: '',
      scheduledEnd: '',
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      if (!submitData.assignedToId) delete submitData.assignedToId;
      if (!submitData.description) delete submitData.description;

      await createMutation.mutateAsync(submitData);
      toast({ title: 'Job created successfully' });
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: 'Error creating job',
        description: error.response?.data?.message || error.message || 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (job: Job) => {
    setSelectedJob(job);
    setFormData({
      title: job.title,
      description: job.description || '',
      priority: job.priority,
      customerId: job.customerId,
      siteId: job.siteId,
      assignedToId: job.assignedToId || '',
      scheduledStart: job.scheduledStart,
      scheduledEnd: job.scheduledEnd,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    try {
      await updateMutation.mutateAsync({
        id: selectedJob.id,
        input: formData,
      });
      toast({ title: 'Job updated successfully' });
      setIsEditDialogOpen(false);
      setSelectedJob(null);
      resetForm();
    } catch (error: any) {
      toast({
        title: 'Error updating job',
        description: error.response?.data?.message || error.message || 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedJob) return;

    try {
      await cancelMutation.mutateAsync({ jobId: selectedJob.id, reason: 'Deleted by user' });
      toast({ title: 'Job deleted successfully' });
      setIsDeleteDialogOpen(false);
      setSelectedJob(null);
    } catch (error: any) {
      toast({
        title: 'Error deleting job',
        description: error.response?.data?.message || error.message || 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  const handleAssign = async () => {
    if (!selectedJob || !selectedTechnicianId) return;

    try {
      await assignMutation.mutateAsync({
        jobId: selectedJob.id,
        technicianId: selectedTechnicianId,
      });
      toast({ title: 'Job assigned successfully' });
      setIsAssignDialogOpen(false);
      setSelectedJob(null);
      setSelectedTechnicianId('');
    } catch (error: any) {
      toast({
        title: 'Error assigning job',
        description: error.response?.data?.message || error.message || 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  const handleStart = async (job: Job) => {
    try {
      await startMutation.mutateAsync({ jobId: job.id });
      toast({ title: 'Job started successfully' });
    } catch (error: any) {
      toast({
        title: 'Error starting job',
        description: error.response?.data?.message || error.message || 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  const handleComplete = async (job: Job) => {
    try {
      await completeMutation.mutateAsync({ jobId: job.id });
      toast({ title: 'Job completed successfully' });
    } catch (error: any) {
      toast({
        title: 'Error completing job',
        description: error.response?.data?.message || error.message || 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = async (job: Job) => {
    try {
      await cancelMutation.mutateAsync({ jobId: job.id, reason: 'Cancelled by user' });
      toast({ title: 'Job cancelled' });
    } catch (error: any) {
      toast({
        title: 'Error cancelling job',
        description: error.response?.data?.message || error.message || 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: JobStatus) => {
    const variants: Record<JobStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
      DRAFT: { variant: 'secondary' },
      SCHEDULED: { variant: 'default', className: 'bg-blue-500' },
      IN_PROGRESS: { variant: 'default', className: 'bg-orange-500' },
      ON_HOLD: { variant: 'outline' },
      COMPLETED: { variant: 'default', className: 'bg-green-500' },
      CANCELLED: { variant: 'destructive' },
    };
    const config = variants[status] || { variant: 'default' };
    return <Badge variant={config.variant} className={config.className}>{status.replace('_', ' ')}</Badge>;
  };

  const getPriorityBadge = (priority: JobPriority) => {
    const variants: Record<JobPriority, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
      LOW: { variant: 'secondary' },
      MEDIUM: { variant: 'outline' },
      HIGH: { variant: 'default', className: 'bg-orange-500' },
      URGENT: { variant: 'destructive' },
    };
    const config = variants[priority] || { variant: 'default' };
    return <Badge variant={config.variant} className={config.className}>{priority}</Badge>;
  };

  const getCustomerSites = (customerId: string) => {
    return sites.filter(site => site.customerId === customerId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
          <p className="text-muted-foreground">
            Track and manage field service jobs and work orders.
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Job
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
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
              <TableHead>Title</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>Technician</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  No jobs found
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.number}</TableCell>
                  <TableCell>{job.title}</TableCell>
                  <TableCell>{job.customer?.name || '-'}</TableCell>
                  <TableCell>{job.site?.name || '-'}</TableCell>
                  <TableCell>
                    {job.assignedTo
                      ? `${job.assignedTo.firstName} ${job.assignedTo.lastName}`
                      : <span className="text-muted-foreground">Unassigned</span>
                    }
                  </TableCell>
                  <TableCell>
                    {job.scheduledStart
                      ? format(new Date(job.scheduledStart), 'MMM dd, yyyy HH:mm')
                      : '-'
                    }
                  </TableCell>
                  <TableCell>{getPriorityBadge(job.priority)}</TableCell>
                  <TableCell>{getStatusBadge(job.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(job)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {!job.assignedToId && (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedJob(job);
                              setIsAssignDialogOpen(true);
                            }}
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Assign Technician
                          </DropdownMenuItem>
                        )}
                        {job.status === JobStatus.SCHEDULED && (
                          <DropdownMenuItem onClick={() => handleStart(job)}>
                            <Play className="mr-2 h-4 w-4" />
                            Start Job
                          </DropdownMenuItem>
                        )}
                        {job.status === JobStatus.IN_PROGRESS && (
                          <DropdownMenuItem onClick={() => handleComplete(job)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Complete Job
                          </DropdownMenuItem>
                        )}
                        {(job.status === JobStatus.DRAFT || job.status === JobStatus.SCHEDULED) && (
                          <DropdownMenuItem onClick={() => handleCancel(job)}>
                            <Ban className="mr-2 h-4 w-4" />
                            Cancel Job
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedJob(job);
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
        <DialogContent className="sm:max-w-[600px]">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Add Job</DialogTitle>
              <DialogDescription>Create a new job or work order.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
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
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="customerId">Customer *</Label>
                  <Select
                    value={formData.customerId}
                    onValueChange={(value) => setFormData({ ...formData, customerId: value, siteId: '' })}
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
                  <Label htmlFor="siteId">Site *</Label>
                  <Select
                    value={formData.siteId}
                    onValueChange={(value) => setFormData({ ...formData, siteId: value })}
                    disabled={!formData.customerId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select site" />
                    </SelectTrigger>
                    <SelectContent>
                      {getCustomerSites(formData.customerId).map((site) => (
                        <SelectItem key={site.id} value={site.id}>
                          {site.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="assignedToId">Assign Technician</Label>
                <Select
                  value={formData.assignedToId}
                  onValueChange={(value) => setFormData({ ...formData, assignedToId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select technician (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {technicians.map((tech) => (
                      <SelectItem key={tech.id} value={tech.id}>
                        {tech.firstName} {tech.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="scheduledStart">Scheduled Start *</Label>
                  <Input
                    id="scheduledStart"
                    type="datetime-local"
                    value={formData.scheduledStart}
                    onChange={(e) => setFormData({ ...formData, scheduledStart: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="scheduledEnd">Scheduled End *</Label>
                  <Input
                    id="scheduledEnd"
                    type="datetime-local"
                    value={formData.scheduledEnd}
                    onChange={(e) => setFormData({ ...formData, scheduledEnd: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: JobPriority) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={JobPriority.LOW}>Low</SelectItem>
                    <SelectItem value={JobPriority.MEDIUM}>Medium</SelectItem>
                    <SelectItem value={JobPriority.HIGH}>High</SelectItem>
                    <SelectItem value={JobPriority.URGENT}>Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Job'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Job</DialogTitle>
              <DialogDescription>Update job information.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
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
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-scheduledStart">Scheduled Start *</Label>
                  <Input
                    id="edit-scheduledStart"
                    type="datetime-local"
                    value={formData.scheduledStart}
                    onChange={(e) => setFormData({ ...formData, scheduledStart: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-scheduledEnd">Scheduled End *</Label>
                  <Input
                    id="edit-scheduledEnd"
                    type="datetime-local"
                    value={formData.scheduledEnd}
                    onChange={(e) => setFormData({ ...formData, scheduledEnd: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: JobPriority) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={JobPriority.LOW}>Low</SelectItem>
                    <SelectItem value={JobPriority.MEDIUM}>Medium</SelectItem>
                    <SelectItem value={JobPriority.HIGH}>High</SelectItem>
                    <SelectItem value={JobPriority.URGENT}>Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Updating...' : 'Update Job'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Job</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete job {selectedJob?.number}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Technician</DialogTitle>
            <DialogDescription>
              Assign a technician to job {selectedJob?.number}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="technician">Technician *</Label>
              <Select
                value={selectedTechnicianId}
                onValueChange={setSelectedTechnicianId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select technician" />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.firstName} {tech.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={assignMutation.isPending || !selectedTechnicianId}
            >
              {assignMutation.isPending ? 'Assigning...' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
