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
import { Search, Plus, Edit, Trash2, MapPin, Building2, Phone } from 'lucide-react';
import { toast } from 'sonner';

interface Site {
  id: string;
  tenantId: string;
  customerId: string;
  customerName: string;
  name: string;
  address: string;
  city: string;
  provinceState: string;
  postalZip: string;
  country: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  active: boolean;
  createdAt: string;
  _count?: {
    jobs: number;
  };
}

export default function SitesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [formData, setFormData] = useState({
    customerId: '',
    name: '',
    address: '',
    city: '',
    provinceState: '',
    postalZip: '',
    country: 'USA',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    notes: '',
    active: true,
  });
  const queryClient = useQueryClient();

  const { data: sitesData, isLoading } = useQuery({
    queryKey: ['sites', searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      const response = await apiClient.get(`/api/v1/sites?${params.toString()}`);
      return response;
    },
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/customers?limit=1000');
      return response;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingSite) {
        return await apiClient.put(`/api/v1/sites/${editingSite.id}`, data);
      }
      return await apiClient.post('/api/v1/sites', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      setDialogOpen(false);
      resetForm();
      toast.success(editingSite ? 'Site updated' : 'Site created');
    },
    onError: () => {
      toast.error('Failed to save site');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/v1/sites/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      toast.success('Site deleted');
    },
    onError: () => {
      toast.error('Failed to delete site');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleEdit = (site: Site) => {
    setEditingSite(site);
    setFormData({
      customerId: site.customerId,
      name: site.name,
      address: site.address,
      city: site.city,
      provinceState: site.provinceState,
      postalZip: site.postalZip,
      country: site.country,
      contactName: site.contactName || '',
      contactPhone: site.contactPhone || '',
      contactEmail: site.contactEmail || '',
      notes: site.notes || '',
      active: site.active,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingSite(null);
    setFormData({
      customerId: '',
      name: '',
      address: '',
      city: '',
      provinceState: '',
      postalZip: '',
      country: 'USA',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      notes: '',
      active: true,
    });
  };

  const sites = sitesData?.data || [];
  const customers = customersData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sites</h1>
          <p className="text-gray-600 mt-1">Manage service locations and customer sites</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Site
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Search sites..."
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
                  <TableHead>Site Name</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Jobs</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sites.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No sites found
                    </TableCell>
                  </TableRow>
                ) : (
                  sites.map((site: Site) => (
                    <TableRow key={site.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{site.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{site.customerName}</TableCell>
                      <TableCell>
                        <div className="flex items-start gap-1 text-sm">
                          <MapPin className="h-3 w-3 mt-0.5 text-gray-400" />
                          <div>
                            <div>{site.address}</div>
                            <div className="text-gray-500">
                              {site.city}, {site.provinceState} {site.postalZip}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {site.contactName && (
                          <div className="text-sm">
                            <div>{site.contactName}</div>
                            {site.contactPhone && (
                              <div className="text-gray-500 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {site.contactPhone}
                              </div>
                            )}
                          </div>
                        )}
                        {!site.contactName && '-'}
                      </TableCell>
                      <TableCell>{site._count?.jobs || 0}</TableCell>
                      <TableCell>
                        <Badge variant={site.active ? 'default' : 'secondary'}>
                          {site.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(site)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate(site.id)}
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
            <DialogTitle>{editingSite ? 'Edit' : 'Add'} Site</DialogTitle>
            <DialogDescription>
              {editingSite ? 'Update' : 'Create'} a service location
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerId">Customer</Label>
                  <select
                    id="customerId"
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="">Select customer...</option>
                    {customers.map((customer: any) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="name">Site Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="provinceState">State/Province</Label>
                  <Input
                    id="provinceState"
                    value={formData.provinceState}
                    onChange={(e) => setFormData({ ...formData, provinceState: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="postalZip">Postal/Zip</Label>
                  <Input
                    id="postalZip"
                    value={formData.postalZip}
                    onChange={(e) => setFormData({ ...formData, postalZip: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="contactName">Contact Name</Label>
                  <Input
                    id="contactName"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  />
                  Active
                </label>
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
