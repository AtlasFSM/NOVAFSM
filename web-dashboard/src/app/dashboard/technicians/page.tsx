'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { Search, Plus, Edit, Trash2, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Technician {
  id: string;
  tenantId: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  skills?: string[];
  certifications?: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  hireDate?: string;
  hourlyRate?: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    jobs: number;
    timeEntries: number;
  };
}

export default function TechniciansPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState<Technician | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    skills: '',
    hourlyRate: '',
    hireDate: '',
    status: 'ACTIVE',
  });
  const queryClient = useQueryClient();

  const { data: techniciansData, isLoading } = useQuery({
    queryKey: ['technicians', searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      const response = await apiClient.get(`/api/v1/technicians?${params.toString()}`);
      return response;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingTechnician) {
        return await apiClient.put(`/api/v1/technicians/${editingTechnician.id}`, data);
      }
      return await apiClient.post('/api/v1/technicians', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      setDialogOpen(false);
      resetForm();
      toast.success(editingTechnician ? 'Technician updated' : 'Technician created');
    },
    onError: () => {
      toast.error('Failed to save technician');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/v1/technicians/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      toast.success('Technician deleted');
    },
    onError: () => {
      toast.error('Failed to delete technician');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      skills: formData.skills ? formData.skills.split(',').map(s => s.trim()) : [],
      hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
    };
    createMutation.mutate(data);
  };

  const handleEdit = (technician: Technician) => {
    setEditingTechnician(technician);
    setFormData({
      email: technician.email,
      firstName: technician.firstName,
      lastName: technician.lastName,
      phone: technician.phone || '',
      skills: technician.skills?.join(', ') || '',
      hourlyRate: technician.hourlyRate?.toString() || '',
      hireDate: technician.hireDate || '',
      status: technician.status,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingTechnician(null);
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      skills: '',
      hourlyRate: '',
      hireDate: '',
      status: 'ACTIVE',
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'ON_LEAVE':
        return 'secondary';
      case 'INACTIVE':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const technicians = techniciansData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Technicians</h1>
          <p className="text-gray-600 mt-1">Manage field service technicians</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Technician
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Search technicians..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Skills</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Jobs</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {technicians.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No technicians found
                    </TableCell>
                  </TableRow>
                ) : (
                  technicians.map((tech: Technician) => (
                    <TableRow key={tech.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{`${tech.firstName} ${tech.lastName}`}</div>
                          {tech.hireDate && (
                            <div className="text-sm text-gray-500">
                              Hired: {format(new Date(tech.hireDate), 'MMM yyyy')}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {tech.email}
                          </div>
                          {tech.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {tech.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {tech.skills && tech.skills.length > 0 ? (
                            tech.skills.slice(0, 2).map((skill) => (
                              <Badge key={skill} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                          {tech.skills && tech.skills.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{tech.skills.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {tech.hourlyRate ? `$${tech.hourlyRate}/hr` : '-'}
                      </TableCell>
                      <TableCell>{tech._count?.jobs || 0}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(tech.status)}>
                          {tech.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(tech)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate(tech.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTechnician ? 'Edit' : 'Add'} Technician</DialogTitle>
            <DialogDescription>
              {editingTechnician ? 'Update' : 'Create'} a field service technician
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="skills">Skills (comma-separated)</Label>
                <Input
                  id="skills"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  placeholder="HVAC, Electrical, Plumbing"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hourlyRate">Hourly Rate</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    step="0.01"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="hireDate">Hire Date</Label>
                  <Input
                    id="hireDate"
                    type="date"
                    value={formData.hireDate}
                    onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="ON_LEAVE">On Leave</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
