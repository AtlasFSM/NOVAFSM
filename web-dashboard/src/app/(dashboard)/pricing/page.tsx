'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Star, Archive, List } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';

interface PriceList {
  id: string;
  name: string;
  description?: string;
  currency: 'CAD' | 'USD';
  isDefault: boolean;
  status: 'ACTIVE' | 'ARCHIVED';
  itemCount?: number;
  createdAt: string;
}

interface PriceItem {
  id: string;
  priceListId: string;
  sku: string;
  name: string;
  description?: string;
  unitPrice: number;
  cost?: number;
  unit: string;
  category?: string;
  itemType: 'SERVICE' | 'PART' | 'LABOR';
}

export default function PricingPage() {
  const { toast } = useToast();
  const [selectedPriceList, setSelectedPriceList] = useState<string | null>(null);
  const [showPriceListDialog, setShowPriceListDialog] = useState(false);
  const [showPriceItemDialog, setShowPriceItemDialog] = useState(false);
  const [editingPriceList, setEditingPriceList] = useState<PriceList | null>(null);
  const [editingPriceItem, setEditingPriceItem] = useState<PriceItem | null>(null);

  // Mock data - replace with actual API calls
  const [priceLists, setPriceLists] = useState<PriceList[]>([
    {
      id: '1',
      name: 'Standard Pricing 2024',
      description: 'Default price list for all services',
      currency: 'CAD',
      isDefault: true,
      status: 'ACTIVE',
      itemCount: 45,
      createdAt: '2024-01-15',
    },
    {
      id: '2',
      name: 'Commercial Pricing',
      description: 'Special pricing for commercial clients',
      currency: 'CAD',
      isDefault: false,
      status: 'ACTIVE',
      itemCount: 32,
      createdAt: '2024-02-01',
    },
  ]);

  const [priceItems, setPriceItems] = useState<PriceItem[]>([
    {
      id: '1',
      priceListId: '1',
      sku: 'SVC-001',
      name: 'HVAC Inspection',
      description: 'Standard HVAC system inspection',
      unitPrice: 150.00,
      cost: 75.00,
      unit: 'hour',
      category: 'Inspection',
      itemType: 'SERVICE',
    },
    {
      id: '2',
      priceListId: '1',
      sku: 'PRT-101',
      name: 'Air Filter',
      description: '16x20 MERV 11 air filter',
      unitPrice: 25.00,
      cost: 12.50,
      unit: 'each',
      category: 'Parts',
      itemType: 'PART',
    },
  ]);

  const handleCreatePriceList = (formData: any) => {
    const newPriceList: PriceList = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      currency: formData.currency || 'CAD',
      isDefault: formData.isDefault || false,
      status: 'ACTIVE',
      itemCount: 0,
      createdAt: new Date().toISOString(),
    };
    setPriceLists([...priceLists, newPriceList]);
    setShowPriceListDialog(false);
    toast({
      title: 'Success',
      description: 'Price list created successfully',
    });
  };

  const handleUpdatePriceList = (id: string, formData: any) => {
    setPriceLists(priceLists.map(pl =>
      pl.id === id ? { ...pl, ...formData } : pl
    ));
    setShowPriceListDialog(false);
    setEditingPriceList(null);
    toast({
      title: 'Success',
      description: 'Price list updated successfully',
    });
  };

  const handleDeletePriceList = (id: string) => {
    setPriceLists(priceLists.filter(pl => pl.id !== id));
    toast({
      title: 'Success',
      description: 'Price list deleted successfully',
    });
  };

  const handleSetDefault = (id: string) => {
    setPriceLists(priceLists.map(pl => ({
      ...pl,
      isDefault: pl.id === id,
    })));
    toast({
      title: 'Success',
      description: 'Default price list updated',
    });
  };

  const handleCreatePriceItem = (formData: any) => {
    const newItem: PriceItem = {
      id: Date.now().toString(),
      priceListId: selectedPriceList!,
      sku: formData.sku,
      name: formData.name,
      description: formData.description,
      unitPrice: parseFloat(formData.unitPrice),
      cost: formData.cost ? parseFloat(formData.cost) : undefined,
      unit: formData.unit,
      category: formData.category,
      itemType: formData.itemType,
    };
    setPriceItems([...priceItems, newItem]);
    setShowPriceItemDialog(false);
    toast({
      title: 'Success',
      description: 'Price item created successfully',
    });
  };

  const handleUpdatePriceItem = (id: string, formData: any) => {
    setPriceItems(priceItems.map(item =>
      item.id === id ? { ...item, ...formData } : item
    ));
    setShowPriceItemDialog(false);
    setEditingPriceItem(null);
    toast({
      title: 'Success',
      description: 'Price item updated successfully',
    });
  };

  const handleDeletePriceItem = (id: string) => {
    setPriceItems(priceItems.filter(item => item.id !== id));
    toast({
      title: 'Success',
      description: 'Price item deleted successfully',
    });
  };

  const filteredPriceItems = selectedPriceList
    ? priceItems.filter(item => item.priceListId === selectedPriceList)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pricing</h1>
          <p className="text-muted-foreground">
            Manage price lists and pricing items for your services and products.
          </p>
        </div>
        <Button onClick={() => {
          setEditingPriceList(null);
          setShowPriceListDialog(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          New Price List
        </Button>
      </div>

      {/* Price Lists Section */}
      <div className="rounded-lg border bg-card">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Price Lists</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {priceLists.map((priceList) => (
                <TableRow
                  key={priceList.id}
                  className={selectedPriceList === priceList.id ? 'bg-muted/50' : ''}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {priceList.name}
                      {priceList.isDefault && (
                        <Badge variant="secondary" className="ml-2">
                          <Star className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {priceList.description}
                  </TableCell>
                  <TableCell>{priceList.currency}</TableCell>
                  <TableCell>{priceList.itemCount || 0}</TableCell>
                  <TableCell>
                    <Badge variant={priceList.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {priceList.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPriceList(priceList.id)}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      {!priceList.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(priceList.id)}
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingPriceList(priceList);
                          setShowPriceListDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePriceList(priceList.id)}
                        disabled={priceList.isDefault}
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
      </div>

      {/* Price Items Section */}
      {selectedPriceList && (
        <div className="rounded-lg border bg-card">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                Price Items - {priceLists.find(pl => pl.id === selectedPriceList)?.name}
              </h2>
              <Button onClick={() => {
                setEditingPriceItem(null);
                setShowPriceItemDialog(true);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPriceItems.map((item) => {
                  const margin = item.cost
                    ? ((item.unitPrice - item.cost) / item.unitPrice * 100).toFixed(1)
                    : null;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          {item.description && (
                            <div className="text-sm text-muted-foreground">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.itemType}</Badge>
                      </TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell className="text-right">
                        {item.cost ? `$${item.cost.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${item.unitPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {margin ? `${margin}%` : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingPriceItem(item);
                              setShowPriceItemDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePriceItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Price List Dialog */}
      <PriceListDialog
        open={showPriceListDialog}
        onOpenChange={setShowPriceListDialog}
        priceList={editingPriceList}
        onSubmit={(data) => {
          if (editingPriceList) {
            handleUpdatePriceList(editingPriceList.id, data);
          } else {
            handleCreatePriceList(data);
          }
        }}
      />

      {/* Price Item Dialog */}
      <PriceItemDialog
        open={showPriceItemDialog}
        onOpenChange={setShowPriceItemDialog}
        priceItem={editingPriceItem}
        onSubmit={(data) => {
          if (editingPriceItem) {
            handleUpdatePriceItem(editingPriceItem.id, data);
          } else {
            handleCreatePriceItem(data);
          }
        }}
      />
    </div>
  );
}

function PriceListDialog({
  open,
  onOpenChange,
  priceList,
  onSubmit
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  priceList: PriceList | null;
  onSubmit: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    name: priceList?.name || '',
    description: priceList?.description || '',
    currency: priceList?.currency || 'CAD',
    isDefault: priceList?.isDefault || false,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {priceList ? 'Edit Price List' : 'Create Price List'}
          </DialogTitle>
          <DialogDescription>
            {priceList
              ? 'Update the price list details below.'
              : 'Create a new price list for your products and services.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Standard Pricing 2024"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
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
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onSubmit(formData)}>
            {priceList ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PriceItemDialog({
  open,
  onOpenChange,
  priceItem,
  onSubmit
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  priceItem: PriceItem | null;
  onSubmit: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    sku: priceItem?.sku || '',
    name: priceItem?.name || '',
    description: priceItem?.description || '',
    unitPrice: priceItem?.unitPrice?.toString() || '',
    cost: priceItem?.cost?.toString() || '',
    unit: priceItem?.unit || 'hour',
    category: priceItem?.category || '',
    itemType: priceItem?.itemType || 'SERVICE',
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {priceItem ? 'Edit Price Item' : 'Add Price Item'}
          </DialogTitle>
          <DialogDescription>
            {priceItem
              ? 'Update the price item details below.'
              : 'Add a new item to this price list.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              placeholder="SVC-001"
            />
          </div>
          <div>
            <Label htmlFor="itemType">Type</Label>
            <Select
              value={formData.itemType}
              onValueChange={(value) => setFormData({ ...formData, itemType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SERVICE">Service</SelectItem>
                <SelectItem value="PART">Part</SelectItem>
                <SelectItem value="LABOR">Labor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="HVAC Inspection"
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="Inspection"
            />
          </div>
          <div>
            <Label htmlFor="unit">Unit</Label>
            <Select
              value={formData.unit}
              onValueChange={(value) => setFormData({ ...formData, unit: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hour">Hour</SelectItem>
                <SelectItem value="each">Each</SelectItem>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="sq_ft">Square Foot</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="cost">Cost</Label>
            <Input
              id="cost"
              type="number"
              step="0.01"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label htmlFor="unitPrice">Unit Price</Label>
            <Input
              id="unitPrice"
              type="number"
              step="0.01"
              value={formData.unitPrice}
              onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
              placeholder="0.00"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onSubmit(formData)}>
            {priceItem ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
