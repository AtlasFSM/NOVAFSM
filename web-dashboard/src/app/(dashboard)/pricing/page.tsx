'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Star, List, Loader2 } from 'lucide-react';
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
import {
  usePriceLists,
  usePriceItems,
  useCreatePriceList,
  useUpdatePriceList,
  useDeletePriceList,
  useSetDefaultPriceList,
  useCreatePriceItem,
  useUpdatePriceItem,
  useDeletePriceItem,
  type PriceList,
  type PriceItem,
} from '@/hooks/use-pricing';

export default function PricingPage() {
  const { toast } = useToast();
  const [selectedPriceList, setSelectedPriceList] = useState<string | null>(null);
  const [showPriceListDialog, setShowPriceListDialog] = useState(false);
  const [showPriceItemDialog, setShowPriceItemDialog] = useState(false);
  const [editingPriceList, setEditingPriceList] = useState<PriceList | null>(null);
  const [editingPriceItem, setEditingPriceItem] = useState<PriceItem | null>(null);

  // API hooks
  const { data: priceLists = [], isLoading: loadingPriceLists, error: priceListsError } = usePriceLists();
  const { data: priceItems = [], isLoading: loadingPriceItems } = usePriceItems(selectedPriceList || '');

  const createPriceList = useCreatePriceList();
  const updatePriceList = useUpdatePriceList();
  const deletePriceList = useDeletePriceList();
  const setDefaultPriceList = useSetDefaultPriceList();

  const createPriceItem = useCreatePriceItem();
  const updatePriceItem = useUpdatePriceItem();
  const deletePriceItem = useDeletePriceItem();

  const handleCreatePriceList = async (formData: any) => {
    try {
      await createPriceList.mutateAsync(formData);
      setShowPriceListDialog(false);
      toast({
        title: 'Success',
        description: 'Price list created successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create price list',
        variant: 'destructive',
      });
    }
  };

  const handleUpdatePriceList = async (id: string, formData: any) => {
    try {
      await updatePriceList.mutateAsync({ id, data: formData });
      setShowPriceListDialog(false);
      setEditingPriceList(null);
      toast({
        title: 'Success',
        description: 'Price list updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update price list',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePriceList = async (id: string) => {
    if (!confirm('Are you sure you want to delete this price list?')) return;

    try {
      await deletePriceList.mutateAsync(id);
      if (selectedPriceList === id) {
        setSelectedPriceList(null);
      }
      toast({
        title: 'Success',
        description: 'Price list deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete price list',
        variant: 'destructive',
      });
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultPriceList.mutateAsync(id);
      toast({
        title: 'Success',
        description: 'Default price list updated',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to set default price list',
        variant: 'destructive',
      });
    }
  };

  const handleCreatePriceItem = async (formData: any) => {
    try {
      await createPriceItem.mutateAsync({
        ...formData,
        priceListId: selectedPriceList!,
        unitPrice: parseFloat(formData.unitPrice),
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
      });
      setShowPriceItemDialog(false);
      toast({
        title: 'Success',
        description: 'Price item created successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create price item',
        variant: 'destructive',
      });
    }
  };

  const handleUpdatePriceItem = async (id: string, formData: any) => {
    try {
      await updatePriceItem.mutateAsync({
        id,
        data: {
          ...formData,
          unitPrice: parseFloat(formData.unitPrice),
          cost: formData.cost ? parseFloat(formData.cost) : undefined,
        },
      });
      setShowPriceItemDialog(false);
      setEditingPriceItem(null);
      toast({
        title: 'Success',
        description: 'Price item updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update price item',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePriceItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this price item?')) return;

    try {
      await deletePriceItem.mutateAsync({ id, priceListId: selectedPriceList! });
      toast({
        title: 'Success',
        description: 'Price item deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete price item',
        variant: 'destructive',
      });
    }
  };

  if (loadingPriceLists) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (priceListsError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load price lists</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pricing</h1>
          <p className="text-muted-foreground">
            Manage price lists and pricing items for your services and products.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingPriceList(null);
            setShowPriceListDialog(true);
          }}
          disabled={createPriceList.isPending}
        >
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
              {priceLists.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No price lists found. Create your first price list to get started.
                  </TableCell>
                </TableRow>
              ) : (
                priceLists.map((priceList) => (
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
                      {priceList.description || '-'}
                    </TableCell>
                    <TableCell>{priceList.currency}</TableCell>
                    <TableCell>-</TableCell>
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
                            disabled={setDefaultPriceList.isPending}
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
                          disabled={priceList.isDefault || deletePriceList.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
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
              <Button
                onClick={() => {
                  setEditingPriceItem(null);
                  setShowPriceItemDialog(true);
                }}
                disabled={createPriceItem.isPending}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>

            {loadingPriceItems ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
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
                  {priceItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground">
                        No price items found. Add items to this price list.
                      </TableCell>
                    </TableRow>
                  ) : (
                    priceItems.map((item) => {
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
                          <TableCell>{item.category || '-'}</TableCell>
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
                                disabled={deletePriceItem.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
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
        isSubmitting={createPriceList.isPending || updatePriceList.isPending}
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
        isSubmitting={createPriceItem.isPending || updatePriceItem.isPending}
      />
    </div>
  );
}

function PriceListDialog({
  open,
  onOpenChange,
  priceList,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  priceList: PriceList | null;
  onSubmit: (data: any) => void;
  isSubmitting?: boolean;
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
              required
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
              priceList ? 'Update' : 'Create'
            )}
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
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  priceItem: PriceItem | null;
  onSubmit: (data: any) => void;
  isSubmitting?: boolean;
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
              required
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
              required
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
              required
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={() => onSubmit(formData)}
            disabled={isSubmitting || !formData.sku || !formData.name || !formData.unitPrice}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              priceItem ? 'Update' : 'Create'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
