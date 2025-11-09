'use client';

import { useState } from 'react';
import { Package, Plus, Search, Filter, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type InventoryCategory = 'PARTS' | 'TOOLS' | 'SUPPLIES' | 'ALL';

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<InventoryCategory>('ALL');

  // Mock data - replace with actual API calls
  const mockInventoryItems = [
    {
      id: '1',
      name: 'HVAC Filter 20x20',
      sku: 'HVAC-FIL-2020',
      category: 'PARTS',
      quantity: 45,
      minQuantity: 20,
      unitPrice: 12.99,
      location: 'Warehouse A, Shelf 3B',
    },
    {
      id: '2',
      name: 'Pipe Wrench Set',
      sku: 'TOOL-WRN-001',
      category: 'TOOLS',
      quantity: 8,
      minQuantity: 5,
      unitPrice: 89.99,
      location: 'Tool Room, Cabinet 2',
    },
    {
      id: '3',
      name: 'Teflon Tape Roll',
      sku: 'SUP-TEF-001',
      category: 'SUPPLIES',
      quantity: 12,
      minQuantity: 25,
      unitPrice: 3.49,
      location: 'Warehouse A, Shelf 1A',
    },
    {
      id: '4',
      name: 'Refrigerant R-410A',
      sku: 'PART-REF-410',
      category: 'PARTS',
      quantity: 6,
      minQuantity: 10,
      unitPrice: 145.00,
      location: 'Secure Storage, Bay 1',
    },
  ];

  const filteredItems = mockInventoryItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = category === 'ALL' || item.category === category;
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = mockInventoryItems.filter((item) => item.quantity < item.minQuantity);
  const totalValue = mockInventoryItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            Manage parts, tools, and supplies inventory
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockInventoryItems.length}</div>
            <p className="text-xs text-muted-foreground">In inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-orange-600">{lowStockItems.length}</div>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </div>
            <p className="text-xs text-muted-foreground">Need reordering</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Inventory worth</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Parts, Tools, Supplies</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={category} onValueChange={(value) => setCategory(value as InventoryCategory)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              <SelectItem value="PARTS">Parts</SelectItem>
              <SelectItem value="TOOLS">Tools</SelectItem>
              <SelectItem value="SUPPLIES">Supplies</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            More Filters
          </Button>
        </div>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>{filteredItems.length} item(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredItems.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-muted-foreground">No items found</p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{item.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                      {item.quantity < item.minQuantity && (
                        <Badge variant="destructive" className="text-xs">
                          Low Stock
                        </Badge>
                      )}
                    </div>

                    <div className="text-sm text-muted-foreground">
                      SKU: {item.sku} • {item.location}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-semibold">
                      {item.quantity} {item.quantity === 1 ? 'unit' : 'units'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ${item.unitPrice} each
                    </div>
                  </div>

                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
