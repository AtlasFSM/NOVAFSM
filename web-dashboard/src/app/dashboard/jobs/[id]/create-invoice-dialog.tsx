'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Search } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface InvoiceLine {
  sku?: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discounts?: number;
  taxes?: Array<{ code: string; rate: number; amount: number }>;
  amount: number;
}

interface CreateInvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  job: any;
  customerId: string;
}

export default function CreateInvoiceDialog({
  open,
  onClose,
  job,
  customerId,
}: CreateInvoiceDialogProps) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string>('DRAFT');
  const [currency, setCurrency] = useState<string>('CAD');
  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [showPriceList, setShowPriceList] = useState(false);
  const [selectedPriceList, setSelectedPriceList] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch price lists
  const { data: priceListsData } = useQuery({
    queryKey: ['price-lists'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/pricing/price-lists');
      return response.data;
    },
  });

  // Fetch price items for selected price list
  const { data: priceItemsData } = useQuery({
    queryKey: ['price-items', selectedPriceList],
    queryFn: async () => {
      if (!selectedPriceList) return [];
      const response = await apiClient.get(`/api/v1/pricing/price-items/price-list/${selectedPriceList}`);
      return response.data;
    },
    enabled: !!selectedPriceList,
  });

  // Fetch tax rates
  const { data: taxRatesData } = useQuery({
    queryKey: ['tax-rates'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/tax-rates');
      return response.data;
    },
  });

  const priceLists = priceListsData || [];
  const priceItems = priceItemsData || [];
  const taxRates = taxRatesData || [];

  // Auto-select default price list
  useEffect(() => {
    if (priceLists.length > 0 && !selectedPriceList) {
      const defaultList = priceLists.find((pl: any) => pl.isDefault);
      if (defaultList) {
        setSelectedPriceList(defaultList.id);
        setCurrency(defaultList.currency);
      } else {
        setSelectedPriceList(priceLists[0].id);
        setCurrency(priceLists[0].currency);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPriceList]);

  // Set default due date (30 days from now)
  useEffect(() => {
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 30);
    setDueDate(defaultDueDate.toISOString().split('T')[0]);
  }, []);

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/api/v1/invoices', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Invoice created successfully');
      queryClient.invalidateQueries({ queryKey: ['job', job.id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create invoice');
    },
  });

  const addLineFromPriceItem = (priceItem: any) => {
    const newLine: InvoiceLine = {
      sku: priceItem.sku,
      description: priceItem.name + (priceItem.description ? ` - ${priceItem.description}` : ''),
      quantity: 1,
      unit: priceItem.unit,
      unitPrice: parseFloat(priceItem.defaultRate),
      discounts: 0,
      amount: parseFloat(priceItem.defaultRate),
    };

    setLines([...lines, newLine]);
    setShowPriceList(false);
    setSearchTerm('');
  };

  const addEmptyLine = () => {
    const newLine: InvoiceLine = {
      description: '',
      quantity: 1,
      unit: 'EA',
      unitPrice: 0,
      amount: 0,
    };
    setLines([...lines, newLine]);
  };

  const updateLine = (index: number, field: keyof InvoiceLine, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };

    // Recalculate amount
    if (field === 'quantity' || field === 'unitPrice' || field === 'discounts') {
      const quantity = parseFloat(newLines[index].quantity.toString()) || 0;
      const unitPrice = parseFloat(newLines[index].unitPrice.toString()) || 0;
      const discounts = parseFloat(newLines[index].discounts?.toString() || '0') || 0;
      newLines[index].amount = (quantity * unitPrice) - discounts;
    }

    setLines(newLines);
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return lines.reduce((sum, line) => sum + line.amount, 0);
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    // Get applicable tax rate (use first active tax rate or 0)
    const applicableTaxRate = taxRates.find((rate: any) => rate.isActive);
    if (!applicableTaxRate) return 0;
    return subtotal * parseFloat(applicableTaxRate.rate);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSubmit = () => {
    if (lines.length === 0) {
      toast.error('Please add at least one line item');
      return;
    }

    // Apply tax to lines if applicable
    const taxRate = taxRates.find((rate: any) => rate.isActive);
    const linesWithTax = lines.map(line => ({
      ...line,
      taxes: taxRate ? [{
        code: taxRate.code,
        rate: parseFloat(taxRate.rate),
        amount: line.amount * parseFloat(taxRate.rate)
      }] : []
    }));

    const invoiceData = {
      status,
      currency,
      customerId,
      jobId: job.id,
      subtotal: calculateSubtotal(),
      taxTotal: calculateTax(),
      total: calculateTotal(),
      lines: linesWithTax,
      notes,
      issuedAt: new Date().toISOString(),
      dueAt: dueDate ? new Date(dueDate).toISOString() : undefined,
    };

    createInvoiceMutation.mutate(invoiceData);
  };

  const filteredPriceItems = priceItems.filter((item: any) =>
    searchTerm === '' ||
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Invoice for Job {job.number}</DialogTitle>
          <DialogDescription>
            Add line items from the price list and create an invoice for {job.customer?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Header Fields */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CAD">CAD</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Line Items</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPriceList(!showPriceList)}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Add from Price List
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={addEmptyLine}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Line
                </Button>
              </div>
            </div>

            {/* Price List Selection */}
            {showPriceList && (
              <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Price List</Label>
                    <Select value={selectedPriceList} onValueChange={setSelectedPriceList}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select price list" />
                      </SelectTrigger>
                      <SelectContent>
                        {priceLists.map((pl: any) => (
                          <SelectItem key={pl.id} value={pl.id}>
                            {pl.name} {pl.isDefault && '(Default)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Search Items</Label>
                    <Input
                      placeholder="Search by name, SKU, or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto border rounded bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPriceItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-gray-500">
                            {priceItems.length === 0 ? 'No items in this price list' : 'No items match your search'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPriceItems.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.name}</p>
                                {item.description && (
                                  <p className="text-xs text-gray-500">{item.description}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{item.unit}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(parseFloat(item.defaultRate), currency)}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => addLineFromPriceItem(item)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Invoice Lines Table */}
            {lines.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[35%]">Description</TableHead>
                      <TableHead className="w-[10%]">Qty</TableHead>
                      <TableHead className="w-[10%]">Unit</TableHead>
                      <TableHead className="w-[15%]">Unit Price</TableHead>
                      <TableHead className="w-[15%]">Discount</TableHead>
                      <TableHead className="w-[15%] text-right">Amount</TableHead>
                      <TableHead className="w-[5%]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map((line, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Input
                            value={line.description}
                            onChange={(e) => updateLine(index, 'description', e.target.value)}
                            placeholder="Description"
                          />
                          {line.sku && (
                            <p className="text-xs text-gray-500 mt-1">SKU: {line.sku}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={line.quantity}
                            onChange={(e) => updateLine(index, 'quantity', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={line.unit}
                            onChange={(e) => updateLine(index, 'unit', e.target.value)}
                            placeholder="EA"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={line.unitPrice}
                            onChange={(e) => updateLine(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={line.discounts || 0}
                            onChange={(e) => updateLine(index, 'discounts', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(line.amount, currency)}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLine(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {lines.length === 0 && (
              <div className="border-2 border-dashed rounded-lg p-8 text-center text-gray-500">
                <p>No line items added yet</p>
                <p className="text-sm mt-1">Click &ldquo;Add from Price List&rdquo; or &ldquo;Add Line&rdquo; to get started</p>
              </div>
            )}
          </div>

          {/* Totals */}
          {lines.length > 0 && (
            <div className="flex justify-end">
              <div className="w-80 space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(calculateSubtotal(), currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Tax {taxRates.find((r: any) => r.isActive) ? `(${(parseFloat(taxRates.find((r: any) => r.isActive).rate) * 100).toFixed(2)}%)` : ''}:
                  </span>
                  <span className="font-medium">{formatCurrency(calculateTax(), currency)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(calculateTotal(), currency)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes or payment terms..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={createInvoiceMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createInvoiceMutation.isPending || lines.length === 0}>
            {createInvoiceMutation.isPending ? 'Creating...' : 'Create Invoice'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
