'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, MapPin, Star, Phone, Mail, Building2 } from 'lucide-react';
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

interface Site {
  id: string;
  customerId: string;
  customerName: string;
  name: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
  isPrimary: boolean;
  jobCount?: number;
  createdAt: string;
}

export default function SitesPage() {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCustomer, setFilterCustomer] = useState<string>('all');

  // Mock data - replace with actual API calls
  const [sites, setSites] = useState<Site[]>([
    {
      id: '1',
      customerId: 'cust1',
      customerName: 'Acme Corporation',
      name: 'Main Office',
      address: '123 Main Street',
      city: 'Vancouver',
      province: 'BC',
      postalCode: 'V6B 2M9',
      country: 'Canada',
      latitude: 49.2827,
      longitude: -123.1207,
      contactName: 'Jane Smith',
      contactPhone: '+1-604-555-0100',
      contactEmail: 'jane.smith@acme.com',
      notes: 'Access code: 1234',
      isPrimary: true,
      jobCount: 15,
      createdAt: '2024-01-15',
    },
    {
      id: '2',
      customerId: 'cust1',
      customerName: 'Acme Corporation',
      name: 'Warehouse',
      address: '456 Industrial Way',
      city: 'Richmond',
      province: 'BC',
      postalCode: 'V7C 1A1',
      country: 'Canada',
      latitude: 49.1666,
      longitude: -123.1336,
      contactName: 'Bob Johnson',
      contactPhone: '+1-604-555-0101',
      contactEmail: 'bob.johnson@acme.com',
      isPrimary: false,
      jobCount: 8,
      createdAt: '2024-02-01',
    },
    {
      id: '3',
      customerId: 'cust2',
      customerName: 'TechStart Inc',
      name: 'Head Office',
      address: '789 Tech Drive',
      city: 'Burnaby',
      province: 'BC',
      postalCode: 'V5H 3Z7',
      country: 'Canada',
      latitude: 49.2488,
      longitude: -122.9805,
      contactName: 'Alice Chen',
      contactPhone: '+1-604-555-0102',
      contactEmail: 'alice@techstart.com',
      isPrimary: true,
      jobCount: 12,
      createdAt: '2024-01-20',
    },
  ]);

  const customers = Array.from(new Set(sites.map(s => s.customerName)));

  const handleCreateSite = (formData: any) => {
    const newSite: Site = {
      id: Date.now().toString(),
      customerId: formData.customerId,
      customerName: formData.customerName,
      name: formData.name,
      address: formData.address,
      city: formData.city,
      province: formData.province,
      postalCode: formData.postalCode,
      country: formData.country || 'Canada',
      latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
      longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
      contactName: formData.contactName,
      contactPhone: formData.contactPhone,
      contactEmail: formData.contactEmail,
      notes: formData.notes,
      isPrimary: formData.isPrimary || false,
      jobCount: 0,
      createdAt: new Date().toISOString(),
    };
    setSites([...sites, newSite]);
    setShowDialog(false);
    toast({
      title: 'Success',
      description: 'Site created successfully',
    });
  };

  const handleUpdateSite = (id: string, formData: any) => {
    setSites(sites.map(site =>
      site.id === id ? { ...site, ...formData } : site
    ));
    setShowDialog(false);
    setEditingSite(null);
    toast({
      title: 'Success',
      description: 'Site updated successfully',
    });
  };

  const handleDeleteSite = (id: string) => {
    setSites(sites.filter(site => site.id !== id));
    toast({
      title: 'Success',
      description: 'Site deleted successfully',
    });
  };

  const handleSetPrimary = (id: string, customerId: string) => {
    setSites(sites.map(site => ({
      ...site,
      isPrimary: site.customerId === customerId ? site.id === id : site.isPrimary,
    })));
    toast({
      title: 'Success',
      description: 'Primary site updated',
    });
  };

  const filteredSites = sites.filter(site => {
    const matchesSearch = searchQuery === '' ||
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.customerName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCustomer = filterCustomer === 'all' || site.customerName === filterCustomer;

    return matchesSearch && matchesCustomer;
  });

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
                        onClick={() => handleSetPrimary(site.id, site.customerId)}
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
      />
    </div>
  );
}

function SiteDialog({
  open,
  onOpenChange,
  site,
  onSubmit
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  site: Site | null;
  onSubmit: (data: any) => void;
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onSubmit(formData)}>
            {site ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
