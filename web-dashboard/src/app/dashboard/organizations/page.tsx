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
import { Search, Plus, Edit, Trash2, Building, Users, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Organization {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  provinceState?: string;
  postalZip?: string;
  country?: string;
  website?: string;
  taxId?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL';
  subscriptionTier?: string;
  subscriptionExpiresAt?: string;
  maxUsers?: number;
  createdAt: string;
  _count?: {
    users: number;
    customers: number;
    jobs: number;
  };
}

export default function OrganizationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    provinceState: '',
    postalZip: '',
    country: 'USA',
    website: '',
    status: 'ACTIVE',
    subscriptionTier: 'PROFESSIONAL',
    maxUsers: '10',
  });
  const queryClient = useQueryClient();

  const { data: orgsData, isLoading } = useQuery({
    queryKey: ['organizations', searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      const response = await apiClient.get(`/api/v1/organizations?${params.toString()}`);
      return response;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingOrg) {
        return await apiClient.put(`/api/v1/organizations/${editingOrg.id}`, data);
      }
      return await apiClient.post('/api/v1/organizations', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setDialogOpen(false);
      resetForm();
      toast.success(editingOrg ? 'Organization updated' : 'Organization created');
    },
    onError: () => {
      toast.error('Failed to save organization');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/v1/organizations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organization deleted');
    },
    onError: () => {
      toast.error('Failed to delete organization');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      maxUsers: parseInt(formData.maxUsers),
    };
    createMutation.mutate(data);
  };

  const handleEdit = (org: Organization) => {
    setEditingOrg(org);
    setFormData({
      name: org.name,
      slug: org.slug,
      email: org.email || '',
      phone: org.phone || '',
      address: org.address || '',
      city: org.city || '',
      provinceState: org.provinceState || '',
      postalZip: org.postalZip || '',
      country: org.country || 'USA',
      website: org.website || '',
      status: org.status,
      subscriptionTier: org.subscriptionTier || 'PROFESSIONAL',
      maxUsers: org.maxUsers?.toString() || '10',
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingOrg(null);
    setFormData({
      name: '',
      slug: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      provinceState: '',
      postalZip: '',
      country: 'USA',
      website: '',
      status: 'ACTIVE',
      subscriptionTier: 'PROFESSIONAL',
      maxUsers: '10',
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'TRIAL':
        return 'secondary';
      case 'SUSPENDED':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const organizations = orgsData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
          <p className="text-gray-600 mt-1">Manage tenant organizations and subscriptions</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Organization
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Search organizations..."
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
                  <TableHead>Organization</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No organizations found
                    </TableCell>
                  </TableRow>
                ) : (
                  organizations.map((org: Organization) => (
                    <TableRow key={org.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium">{org.name}</div>
                            <div className="text-sm text-gray-500">/{org.slug}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {org.email && <div>{org.email}</div>}
                          {org.phone && <div className="text-gray-500">{org.phone}</div>}
                          {!org.email && !org.phone && '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <Badge variant="outline">{org.subscriptionTier || 'FREE'}</Badge>
                          {org.subscriptionExpiresAt && (
                            <div className="text-xs text-gray-500 mt-1">
                              Expires: {format(new Date(org.subscriptionExpiresAt), 'MMM d, yyyy')}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {org._count?.users || 0}/{org.maxUsers || 'unlimited'} users
                          </div>
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {org._count?.jobs || 0} jobs
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(org.status)}>
                          {org.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(org)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate(org.id)}
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOrg ? 'Edit' : 'Add'} Organization</DialogTitle>
            <DialogDescription>
              {editingOrg ? 'Update' : 'Create'} a tenant organization
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Organization Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug (URL identifier)</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                    required
                    disabled={!!editingOrg}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="provinceState">State/Province</Label>
                  <Input
                    id="provinceState"
                    value={formData.provinceState}
                    onChange={(e) => setFormData({ ...formData, provinceState: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="postalZip">Postal/Zip</Label>
                  <Input
                    id="postalZip"
                    value={formData.postalZip}
                    onChange={(e) => setFormData({ ...formData, postalZip: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="subscriptionTier">Subscription Tier</Label>
                  <select
                    id="subscriptionTier"
                    value={formData.subscriptionTier}
                    onChange={(e) => setFormData({ ...formData, subscriptionTier: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="FREE">Free</option>
                    <option value="STARTER">Starter</option>
                    <option value="PROFESSIONAL">Professional</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="maxUsers">Max Users</Label>
                  <Input
                    id="maxUsers"
                    type="number"
                    value={formData.maxUsers}
                    onChange={(e) => setFormData({ ...formData, maxUsers: e.target.value })}
                  />
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
                    <option value="TRIAL">Trial</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
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
