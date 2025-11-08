'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, MapPin, Star, Phone, Mail, Building2, Loader2 } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  useSites,
  useCreateSite,
  useUpdateSite,
  useDeleteSite,
  useSetPrimarySite,
  type Site as APISite,
} from '@/hooks/use-sites';

// Extend API type with UI-specific fields
type Site = APISite & {
  jobCount?: number;
};

export default function SitesPage() {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCustomer, setFilterCustomer] = useState<string>('all');

  // API hooks
  const { data: sites = [], isLoading, error } = useSites();
  const createSite = useCreateSite();
  const updateSite = useUpdateSite();
  const deleteSite = useDeleteSite();
  const setPrimarySite = useSetPrimarySite();

  const customers = Array.from(new Set(sites.map(s => s.customerName)));

  const handleCreateSite = async (formData: any) => {
    try {
      await createSite.mutateAsync({
        customerId: formData.customerId,
        name: formData.name,
        address: formData.address,
        city: formData.city,
        province: formData.province,
        postalCode: formData.postalCode,
        country: formData.country || 'Canada',
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        contactName: formData.contactName || undefined,
        contactPhone: formData.contactPhone || undefined,
        contactEmail: formData.contactEmail || undefined,
        notes: formData.notes || undefined,
        isPrimary: formData.isPrimary || false,
      });
      setShowDialog(false);
      toast({
        title: 'Success',
        description: 'Site created successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create site',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateSite = async (id: string, formData: any) => {
    try {
      await updateSite.mutateAsync({
        id,
        data: formData,
      });
      setShowDialog(false);
      setEditingSite(null);
      toast({
        title: 'Success',
        description: 'Site updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update site',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSite = async (id: string) => {
    if (!confirm('Are you sure you want to delete this site?')) {
      return;
    }

    try {
      await deleteSite.mutateAsync(id);
      toast({
        title: 'Success',
        description: 'Site deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete site',
        variant: 'destructive',
      });
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      await setPrimarySite.mutateAsync(id);
      toast({
        title: 'Success',
        description: 'Primary site updated',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update primary site',
        variant: 'destructive',
      });
    }
  };

  const filteredSites = sites.filter(site => {
    const matchesSearch = searchQuery === '' ||
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (site.customerName && site.customerName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCustomer = filterCustomer === 'all' || site.customerName === filterCustomer;

    return matchesSearch && matchesCustomer;
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load sites</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sites</h1>
          <p className="text-muted-foreground">
            Manage customer service locations and site details.
          </p>
        </div>
        <Button onClick={() => {
          setEditingSite(null);
          setShowDialog(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Site
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search sites by name, address, or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>
        <Select value={filterCustomer} onValueChange={setFilterCustomer}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by customer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Customers</SelectItem>
            {customers.map(customer => (
              <SelectItem key={customer} value={customer}>
                {customer}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <div className="text-sm font-medium text-muted-foreground">
              Total Sites
            </div>
          </div>
          <div className="mt-2 text-3xl font-bold">{sites.length}</div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-muted-foreground" />
            <div className="text-sm font-medium text-muted-foreground">
              Primary Sites
            </div>
          </div>
          <div className="mt-2 text-3xl font-bold">
            {sites.filter(s => s.isPrimary).length}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <div className="text-sm font-medium text-muted-foreground">
              Unique Customers
            </div>
          </div>
          <div className="mt-2 text-3xl font-bold">{customers.length}</div>
        </div>
      </div>

      {/* Sites Table */}
      <div className="rounded-lg border bg-card">
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
            {filteredSites.map((site) => (
              <TableRow key={site.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{site.name}</div>
                      {site.isPrimary && (
                        <Badge variant="secondary" className="mt-1">
                          <Star className="h-3 w-3 mr-1" />
                          Primary
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{site.customerName}</Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{site.address}</div>
                    <div className="text-muted-foreground">
                      {site.city}, {site.province} {site.postalCode}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {site.contactName ? (
                    <div className="text-sm">
                      <div className="font-medium">{site.contactName}</div>
                      {site.contactPhone && (
                        <div className="text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {site.contactPhone}
                        </div>
                      )}
                      {site.contactEmail && (
                        <div className="text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {site.contactEmail}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{site.jobCount || 0}</Badge>
                </TableCell>
                <TableCell>
                  {site.latitude && site.longitude ? (
                    <Badge variant="default">
                      <MapPin className="h-3 w-3 mr-1" />
                      Geocoded
                    </Badge>
                  ) : (
                    <Badge variant="outline">No Location</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {!site.isPrimary && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetPrimary(site.id)}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingSite(site);
                        setShowDialog(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSite(site.id)}
                      disabled={site.isPrimary}
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

      {/* Site Dialog */}
      <SiteDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        site={editingSite}
        onSubmit={(data) => {
          if (editingSite) {
            handleUpdateSite(editingSite.id, data);
          } else {
            handleCreateSite(data);
          }
        }}
        isSubmitting={createSite.isPending || updateSite.isPending}
      />
    </div>
  );
}

function SiteDialog({
  open,
  onOpenChange,
  site,
  onSubmit,
  isSubmitting = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  site: Site | null;
  onSubmit: (data: any) => void;
  isSubmitting?: boolean;
}) {
  const [formData, setFormData] = useState({
    customerId: site?.customerId || '',
    customerName: site?.customerName || '',
    name: site?.name || '',
    address: site?.address || '',
    city: site?.city || '',
    province: site?.province || 'BC',
    postalCode: site?.postalCode || '',
    country: site?.country || 'Canada',
    latitude: site?.latitude?.toString() || '',
    longitude: site?.longitude?.toString() || '',
    contactName: site?.contactName || '',
    contactPhone: site?.contactPhone || '',
    contactEmail: site?.contactEmail || '',
    notes: site?.notes || '',
    isPrimary: site?.isPrimary || false,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {site ? 'Edit Site' : 'Add Site'}
          </DialogTitle>
          <DialogDescription>
            {site
              ? 'Update site information and contact details.'
              : 'Add a new service location for a customer.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label htmlFor="customerName">Customer</Label>
            <Input
              id="customerName"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              placeholder="Acme Corporation"
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="name">Site Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Main Office"
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Main Street"
            />
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Vancouver"
            />
          </div>
          <div>
            <Label htmlFor="province">Province/State</Label>
            <Input
              id="province"
              value={formData.province}
              onChange={(e) => setFormData({ ...formData, province: e.target.value })}
              placeholder="BC"
            />
          </div>
          <div>
            <Label htmlFor="postalCode">Postal/Zip Code</Label>
            <Input
              id="postalCode"
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              placeholder="V6B 2M9"
            />
          </div>
          <div>
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              placeholder="Canada"
            />
          </div>
          <div>
            <Label htmlFor="latitude">Latitude (Optional)</Label>
            <Input
              id="latitude"
              type="number"
              step="0.000001"
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              placeholder="49.2827"
            />
          </div>
          <div>
            <Label htmlFor="longitude">Longitude (Optional)</Label>
            <Input
              id="longitude"
              type="number"
              step="0.000001"
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              placeholder="-123.1207"
            />
          </div>
          <div className="col-span-2 border-t pt-4">
            <h3 className="font-medium mb-3">Site Contact</h3>
          </div>
          <div>
            <Label htmlFor="contactName">Contact Name</Label>
            <Input
              id="contactName"
              value={formData.contactName}
              onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              placeholder="Jane Smith"
            />
          </div>
          <div>
            <Label htmlFor="contactPhone">Contact Phone</Label>
            <Input
              id="contactPhone"
              type="tel"
              value={formData.contactPhone}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              placeholder="+1-604-555-0100"
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input
              id="contactEmail"
              type="email"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              placeholder="jane.smith@example.com"
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Access codes, special instructions, etc."
              rows={3}
            />
          </div>
          <div className="col-span-2 flex items-center space-x-2">
            <Checkbox
              id="isPrimary"
              checked={formData.isPrimary}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isPrimary: checked as boolean })
              }
            />
            <Label htmlFor="isPrimary" className="cursor-pointer">
              Set as primary site for this customer
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={() => onSubmit(formData)} disabled={isSubmitting || !formData.name}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              site ? 'Update' : 'Create'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
