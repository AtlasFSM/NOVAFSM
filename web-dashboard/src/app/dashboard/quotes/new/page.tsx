'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';

interface QuoteLine {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discounts: number;
}

interface QuoteFormData {
  customerId: string;
  title: string;
  description: string;
  currency: string;
  validUntil: string;
  notes: string;
  termsConditions: string;
  lines: QuoteLine[];
}

export default function NewQuotePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<QuoteFormData>({
    customerId: '',
    title: '',
    description: '',
    currency: 'CAD',
    validUntil: '',
    notes: '',
    termsConditions: '',
    lines: [],
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/customers?limit=1000&status=ACTIVE');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/api/v1/quotes', data);
      return response;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      router.push(`/dashboard/quotes/${response.data.id}`);
    },
    onError: (error: any) => {
      if (error.response?.data?.details) {
        setErrors(error.response.data.details);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!formData.customerId) {
      setErrors({ customerId: 'Customer is required' });
      return;
    }

    if (formData.lines.length === 0) {
      setErrors({ lines: 'At least one line item is required' });
      return;
    }

    const submitData: any = {
      customerId: formData.customerId,
      currency: formData.currency,
      lines: formData.lines.map((line, index) => ({
        description: line.description,
        quantity: parseFloat(line.quantity.toString()),
        unit: line.unit,
        unitPrice: parseFloat(line.unitPrice.toString()),
        discounts: parseFloat(line.discounts.toString()) || 0,
        sort: index,
      })),
    };

    if (formData.title) submitData.title = formData.title;
    if (formData.description) submitData.description = formData.description;
    if (formData.validUntil) submitData.validUntil = new Date(formData.validUntil).toISOString();
    if (formData.notes) submitData.notes = formData.notes;
    if (formData.termsConditions) submitData.termsConditions = formData.termsConditions;

    createMutation.mutate(submitData);
  };

  const handleChange = (field: keyof QuoteFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const addLine = () => {
    const newLine: QuoteLine = {
      id: Math.random().toString(36).substr(2, 9),
      description: '',
      quantity: 1,
      unit: 'EA',
      unitPrice: 0,
      discounts: 0,
    };
    setFormData((prev) => ({
      ...prev,
      lines: [...prev.lines, newLine],
    }));
  };

  const removeLine = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      lines: prev.lines.filter((line) => line.id !== id),
    }));
  };

  const updateLine = (id: string, field: keyof QuoteLine, value: any) => {
    setFormData((prev) => ({
      ...prev,
      lines: prev.lines.map((line) =>
        line.id === id ? { ...line, [field]: value } : line
      ),
    }));
  };

  const calculateLineTotal = (line: QuoteLine) => {
    const subtotal = line.quantity * line.unitPrice;
    return subtotal - (line.discounts || 0);
  };

  const calculateSubtotal = () => {
    return formData.lines.reduce((sum, line) => {
      return sum + line.quantity * line.unitPrice;
    }, 0);
  };

  const calculateTotalDiscounts = () => {
    return formData.lines.reduce((sum, line) => {
      return sum + (line.discounts || 0);
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateTotalDiscounts();
  };

  const customers = customersData || [];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/quotes">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quotes
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">New Quote</h1>
        <p className="text-gray-600 mt-1">Create a new quote for a customer</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Quote details and customer selection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="customerId">
                    Customer <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.customerId}
                    onValueChange={(value) => handleChange('customerId', value)}
                  >
                    <SelectTrigger id="customerId" className={errors.customerId ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer: any) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.customerId && (
                    <p className="text-red-500 text-sm mt-1">{errors.customerId}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="HVAC System Installation"
                  />
                </div>

                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => handleChange('currency', value)}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CAD">CAD</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Detailed description of work..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="validUntil">Valid Until</Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => handleChange('validUntil', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Line Items</CardTitle>
                  <CardDescription>Add products and services to this quote</CardDescription>
                </div>
                <Button type="button" onClick={addLine} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Line
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {formData.lines.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No line items added yet</p>
                  <Button type="button" onClick={addLine} variant="outline" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Line Item
                  </Button>
                </div>
              ) : (
                <>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[300px]">Description</TableHead>
                          <TableHead className="w-[100px]">Qty</TableHead>
                          <TableHead className="w-[80px]">Unit</TableHead>
                          <TableHead className="w-[120px]">Unit Price</TableHead>
                          <TableHead className="w-[120px]">Discount</TableHead>
                          <TableHead className="w-[120px]">Total</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.lines.map((line) => (
                          <TableRow key={line.id}>
                            <TableCell>
                              <Input
                                value={line.description}
                                onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                                placeholder="Item description"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={line.quantity}
                                onChange={(e) =>
                                  updateLine(line.id, 'quantity', parseFloat(e.target.value) || 0)
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={line.unit}
                                onChange={(e) => updateLine(line.id, 'unit', e.target.value)}
                                placeholder="EA"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={line.unitPrice}
                                onChange={(e) =>
                                  updateLine(line.id, 'unitPrice', parseFloat(e.target.value) || 0)
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={line.discounts}
                                onChange={(e) =>
                                  updateLine(line.id, 'discounts', parseFloat(e.target.value) || 0)
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">
                                {formatCurrency(calculateLineTotal(line), formData.currency)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeLine(line.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {errors.lines && <p className="text-red-500 text-sm mt-2">{errors.lines}</p>}

                  {/* Totals */}
                  <div className="mt-6 flex justify-end">
                    <div className="w-80 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal:</span>
                        <span>{formatCurrency(calculateSubtotal(), formData.currency)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Discounts:</span>
                        <span className="text-red-600">
                          -{formatCurrency(calculateTotalDiscounts(), formData.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-bold pt-2 border-t">
                        <span>Total:</span>
                        <span>{formatCurrency(calculateTotal(), formData.currency)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>Notes and terms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Internal notes (not visible to customer)..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="termsConditions">Terms & Conditions</Label>
                <Textarea
                  id="termsConditions"
                  value={formData.termsConditions}
                  onChange={(e) => handleChange('termsConditions', e.target.value)}
                  placeholder="Payment terms, conditions, etc..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/quotes">Cancel</Link>
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {createMutation.isPending ? 'Creating...' : 'Create Quote'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
