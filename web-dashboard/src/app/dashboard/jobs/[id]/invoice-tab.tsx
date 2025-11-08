'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronUp,
  ChevronDown,
  Settings,
  X,
  Plus,
  FileText,
  Trash2,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';

interface InvoiceLine {
  id?: string;
  type: 'item' | 'title' | 'pagebreak';
  sku?: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discounts?: number;
  category?: string;
  taxes?: Array<{ code: string; rate: number; amount: number }>;
  amount: number;
}

interface InvoiceTabProps {
  job: any;
  invoice?: any;
  customerId: string;
}

const PROVINCES = [
  { value: 'QC', label: 'Québec', tps: 0.05, tvq: 0.09975 },
  { value: 'ON', label: 'Ontario', tps: 0, hst: 0.13 },
  { value: 'BC', label: 'British Columbia', tps: 0.05, pst: 0.07 },
  { value: 'AB', label: 'Alberta', tps: 0.05, pst: 0 },
  { value: 'MB', label: 'Manitoba', tps: 0.05, pst: 0.07 },
  { value: 'SK', label: 'Saskatchewan', tps: 0.05, pst: 0.06 },
  { value: 'NS', label: 'Nova Scotia', tps: 0, hst: 0.15 },
  { value: 'NB', label: 'New Brunswick', tps: 0, hst: 0.15 },
  { value: 'PE', label: 'Prince Edward Island', tps: 0, hst: 0.15 },
  { value: 'NL', label: 'Newfoundland and Labrador', tps: 0, hst: 0.15 },
];

export default function InvoiceTab({ job, invoice, customerId }: InvoiceTabProps) {
  const queryClient = useQueryClient();
  const [lines, setLines] = useState<InvoiceLine[]>(invoice?.lines || []);
  const [selectedProvince, setSelectedProvince] = useState('QC');
  const [templateName, setTemplateName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  // Fetch price lists
  const { data: priceListsData } = useQuery({
    queryKey: ['price-lists'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/pricing/price-lists');
      return response.data;
    },
  });

  // Fetch price items for default price list
  const { data: priceItemsData } = useQuery({
    queryKey: ['price-items'],
    queryFn: async () => {
      const defaultList = priceListsData?.find((pl: any) => pl.isDefault);
      if (!defaultList) return [];
      const response = await apiClient.get(`/api/v1/pricing/price-items/price-list/${defaultList.id}`);
      return response.data;
    },
    enabled: !!priceListsData,
  });

  // Fetch templates (could be stored as special price lists or separate API)
  const { data: templatesData } = useQuery({
    queryKey: ['invoice-templates'],
    queryFn: async () => {
      // TODO: Implement template API
      return [];
    },
  });

  const priceItems = priceItemsData || [];
  const templates = templatesData || [];

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
      if (invoice) {
        const response = await apiClient.put(`/api/v1/invoices/${invoice.id}`, data);
        return response.data;
      } else {
        const response = await apiClient.post('/api/v1/invoices', data);
        return response.data;
      }
    },
    onSuccess: () => {
      toast.success(invoice ? 'Invoice updated successfully' : 'Invoice created successfully');
      queryClient.invalidateQueries({ queryKey: ['job', job.id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save invoice');
    },
  });

  const addItem = (item: any) => {
    const newLine: InvoiceLine = {
      type: 'item',
      sku: item.sku,
      description: item.name,
      quantity: 1,
      unit: item.unit,
      unitPrice: parseFloat(item.defaultRate),
      category: item.category || 'Autre',
      amount: parseFloat(item.defaultRate),
    };
    setLines([...lines, newLine]);
  };

  const addTitle = () => {
    const newLine: InvoiceLine = {
      type: 'title',
      description: 'Nouveau titre',
      quantity: 0,
      unit: '',
      unitPrice: 0,
      amount: 0,
    };
    setLines([...lines, newLine]);
  };

  const addPageBreak = () => {
    const newLine: InvoiceLine = {
      type: 'pagebreak',
      description: '--- Saut de page ---',
      quantity: 0,
      unit: '',
      unitPrice: 0,
      amount: 0,
    };
    setLines([...lines, newLine]);
  };

  const addTemplate = (template: any) => {
    // Add all items from template
    const templateLines = template.items.map((item: any) => ({
      type: 'item',
      sku: item.sku,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      category: item.category || 'Autre',
      amount: item.quantity * item.unitPrice,
    }));
    setLines([...lines, ...templateLines]);
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

  const moveLine = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newLines = [...lines];
      [newLines[index - 1], newLines[index]] = [newLines[index], newLines[index - 1]];
      setLines(newLines);
    } else if (direction === 'down' && index < lines.length - 1) {
      const newLines = [...lines];
      [newLines[index], newLines[index + 1]] = [newLines[index + 1], newLines[index]];
      setLines(newLines);
    }
  };

  const clearAll = () => {
    if (confirm('Êtes-vous sûr de vouloir effacer tout le contenu?')) {
      setLines([]);
    }
  };

  const clearItems = () => {
    if (confirm('Êtes-vous sûr de vouloir effacer les items?')) {
      setLines(lines.filter(line => line.type !== 'item'));
    }
  };

  const saveTemplate = () => {
    if (!templateName.trim()) {
      toast.error('Veuillez entrer un nom de modèle');
      return;
    }
    // TODO: Implement save template API
    toast.success(`Modèle "${templateName}" sauvegardé`);
    setTemplateName('');
  };

  const calculateSubtotal = () => {
    return lines
      .filter(line => line.type === 'item')
      .reduce((sum, line) => sum + line.amount, 0);
  };

  const calculateCategorySummary = () => {
    const summary: { [key: string]: number } = {};
    lines
      .filter(line => line.type === 'item')
      .forEach(line => {
        const category = line.category || 'Autre';
        summary[category] = (summary[category] || 0) + line.amount;
      });
    return summary;
  };

  const calculateTaxes = () => {
    const subtotal = calculateSubtotal();
    const province = PROVINCES.find(p => p.value === selectedProvince);
    if (!province) return { tps: 0, tvq: 0, hst: 0 };

    return {
      tps: province.tps ? subtotal * province.tps : 0,
      tvq: province.tvq ? subtotal * province.tvq : 0,
      hst: province.hst ? subtotal * province.hst : 0,
    };
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const taxes = calculateTaxes();
    return subtotal + taxes.tps + taxes.tvq + taxes.hst;
  };

  const handleSave = () => {
    if (lines.filter(l => l.type === 'item').length === 0) {
      toast.error('Veuillez ajouter au moins un item');
      return;
    }

    const province = PROVINCES.find(p => p.value === selectedProvince);
    const taxes = calculateTaxes();

    const invoiceData = {
      status: invoice?.status || 'DRAFT',
      currency: 'CAD',
      customerId,
      jobId: job.id,
      subtotal: calculateSubtotal(),
      taxTotal: taxes.tps + taxes.tvq + taxes.hst,
      total: calculateTotal(),
      lines: lines.map(line => ({
        ...line,
        taxes: line.type === 'item' ? [
          ...(province?.tps ? [{ code: 'TPS', rate: province.tps, amount: line.amount * province.tps }] : []),
          ...(province?.tvq ? [{ code: 'TVQ', rate: province.tvq, amount: line.amount * province.tvq }] : []),
          ...(province?.hst ? [{ code: 'HST', rate: province.hst, amount: line.amount * province.hst }] : []),
        ] : [],
      })),
      notes: `Province: ${province?.label}`,
      issuedAt: invoice?.issuedAt || new Date().toISOString(),
      dueAt: invoice?.dueAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    createInvoiceMutation.mutate(invoiceData);
  };

  const province = PROVINCES.find(p => p.value === selectedProvince);
  const taxes = calculateTaxes();
  const categorySummary = calculateCategorySummary();

  if (invoice && job.status === 'COMPLETED') {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Facture</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{invoice.number}</Badge>
                <Badge>{invoice.status}</Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{formatCurrency(invoice.total, 'CAD')}</p>
              <Button asChild variant="outline" size="sm" className="mt-2">
                <Link href={`/dashboard/invoices/${invoice.id}`}>
                  <FileText className="h-4 w-4 mr-2" />
                  Voir détails
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  if (job.status !== 'COMPLETED') {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>Les factures ne peuvent être créées que pour les jobs complétés</p>
          <p className="text-sm mt-1">Statut actuel: {job.status}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0 p-0">
          {lines.map((line, index) => (
            <div
              key={index}
              className={`border-b last:border-b-0 ${
                line.type === 'title' ? 'bg-gray-50' :
                line.type === 'pagebreak' ? 'bg-blue-50' : ''
              }`}
            >
              {line.type === 'item' && (
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Reorder buttons */}
                    <div className="flex flex-col gap-1 pt-1">
                      <button
                        onClick={() => moveLine(index, 'up')}
                        disabled={index === 0}
                        className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => moveLine(index, 'down')}
                        disabled={index === lines.length - 1}
                        className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Item details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2">
                            {line.sku && (
                              <span className="text-sm font-mono text-gray-600">{line.sku}</span>
                            )}
                            <Input
                              value={line.description}
                              onChange={(e) => updateLine(index, 'description', e.target.value)}
                              className="border-0 p-0 h-auto font-medium focus-visible:ring-0"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Qté</span>
                          <Input
                            type="number"
                            value={line.quantity}
                            onChange={(e) => updateLine(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-16 h-8 text-right"
                            min="0"
                            step="0.01"
                          />
                          <span className="text-sm text-gray-600">PU</span>
                          <Input
                            type="number"
                            value={line.unitPrice}
                            onChange={(e) => updateLine(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-24 h-8 text-right"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-gray-500">
                          {line.category && `Catégorie: ${line.category}`}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Total</span>
                          <span className="font-bold">{formatCurrency(line.amount, 'CAD')}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {/* TODO: Settings modal */}}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            onClick={() => removeLine(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {line.type === 'title' && (
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <Input
                      value={line.description}
                      onChange={(e) => updateLine(index, 'description', e.target.value)}
                      className="font-bold text-lg"
                      placeholder="Titre de section"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500"
                      onClick={() => removeLine(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {line.type === 'pagebreak' && (
                <div className="p-4 flex items-center justify-between">
                  <span className="text-sm text-blue-600 font-medium">--- Saut de page ---</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-500"
                    onClick={() => removeLine(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}

          {lines.length === 0 && (
            <div className="p-12 text-center text-gray-400">
              <p>Aucun item ajouté</p>
              <p className="text-sm mt-1">Utilisez les options ci-dessous pour ajouter des items</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Section */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Ajouter :</p>
            <div className="flex flex-wrap gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    un item
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto">
                  {priceItems.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      Aucun item dans la liste de prix
                    </div>
                  ) : (
                    priceItems.map((item: any) => (
                      <DropdownMenuItem
                        key={item.id}
                        onClick={() => addItem(item)}
                        className="flex flex-col items-start py-2"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-sm text-gray-500">
                            {formatCurrency(parseFloat(item.defaultRate), 'CAD')}
                          </span>
                        </div>
                        {item.sku && (
                          <span className="text-xs text-gray-400 font-mono">{item.sku}</span>
                        )}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" size="sm" onClick={addTitle}>
                <Plus className="h-4 w-4 mr-2" />
                un titre
              </Button>

              <Button variant="outline" size="sm" onClick={addPageBreak}>
                <Plus className="h-4 w-4 mr-2" />
                un saut de page
              </Button>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Ajouter un modèle :</p>
            <div className="flex gap-2">
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Sélectionner un modèle" />
                </SelectTrigger>
                <SelectContent>
                  {templates.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      Aucun modèle sauvegardé
                    </div>
                  ) : (
                    templates.map((template: any) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                disabled={!selectedTemplate}
                onClick={() => {
                  const template = templates.find((t: any) => t.id === selectedTemplate);
                  if (template) addTemplate(template);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Section */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-2">Effacer :</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={clearAll}>
              <Trash2 className="h-4 w-4 mr-2" />
              effacer tout le contenu
            </Button>
            <Button variant="outline" size="sm" onClick={clearItems}>
              <Trash2 className="h-4 w-4 mr-2" />
              effacer les items
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Template */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-2">Sauvegarder un modèle :</p>
          <div className="flex gap-2">
            <Input
              placeholder="Nom du modèle"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="flex-1"
            />
            <Button onClick={saveTemplate} disabled={!templateName.trim() || lines.length === 0}>
              Sauvegarder
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Category Summary */}
      {Object.keys(categorySummary).length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-2">Sommaire par catégorie</p>
            <div className="space-y-1">
              {Object.entries(categorySummary).map(([category, amount]) => (
                <div key={category} className="flex justify-between text-sm">
                  <span className="text-gray-600">{category} :</span>
                  <span className="font-medium">{formatCurrency(amount, 'CAD')}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Totals */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between">
            <span className="font-medium">Total avant taxes :</span>
            <span className="font-bold text-lg">{formatCurrency(calculateSubtotal(), 'CAD')}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Taxes de la province :</span>
            <Select value={selectedProvince} onValueChange={setSelectedProvince}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVINCES.map((prov) => (
                  <SelectItem key={prov.value} value={prov.value}>
                    {prov.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {province?.tvq && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">TVQ ({(province.tvq * 100).toFixed(3)}%) :</span>
              <span>{formatCurrency(taxes.tvq, 'CAD')}</span>
            </div>
          )}

          {province?.tps && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">TPS ({(province.tps * 100).toFixed(0)}%) :</span>
              <span>{formatCurrency(taxes.tps, 'CAD')}</span>
            </div>
          )}

          {province?.hst && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">HST ({(province.hst * 100).toFixed(0)}%) :</span>
              <span>{formatCurrency(taxes.hst, 'CAD')}</span>
            </div>
          )}

          <div className="border-t pt-3 flex justify-between">
            <span className="font-bold text-lg">TOTAL :</span>
            <span className="font-bold text-2xl">{formatCurrency(calculateTotal(), 'CAD')}</span>
          </div>

          <div className="pt-3">
            <Button
              onClick={handleSave}
              disabled={createInvoiceMutation.isPending || lines.filter(l => l.type === 'item').length === 0}
              className="w-full"
            >
              {createInvoiceMutation.isPending ? 'Sauvegarde...' : (invoice ? 'Mettre à jour la facture' : 'Créer la facture')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
