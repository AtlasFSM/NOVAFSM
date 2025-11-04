'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, Plus, FileText, Edit, Copy, Eye, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const FIELD_TYPES = [
  { value: 'TEXT', label: 'Text Input', icon: '📝' },
  { value: 'TEXTAREA', label: 'Text Area', icon: '📄' },
  { value: 'NUMBER', label: 'Number', icon: '🔢' },
  { value: 'CHECKBOX', label: 'Checkbox', icon: '☑️' },
  { value: 'RADIO', label: 'Radio Buttons', icon: '⭕' },
  { value: 'DROPDOWN', label: 'Dropdown', icon: '📋' },
  { value: 'DATE', label: 'Date Picker', icon: '📅' },
  { value: 'SIGNATURE', label: 'Signature', icon: '✍️' },
  { value: 'PHOTO', label: 'Photo Upload', icon: '📷' },
  { value: 'GPS', label: 'GPS Location', icon: '📍' },
  { value: 'RATING', label: 'Star Rating', icon: '⭐' },
];

export default function FormsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showBuilderDialog, setShowBuilderDialog] = useState(false);
  const [showResponsesDialog, setShowResponsesDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [formBuilder, setFormBuilder] = useState({
    name: '',
    category: 'INSPECTION',
    description: '',
    fields: [] as any[],
  });
  const [currentField, setCurrentField] = useState({
    id: '',
    type: 'TEXT',
    label: '',
    required: false,
    options: [] as string[],
    placeholder: '',
  });

  const queryClient = useQueryClient();

  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['form-templates', searchQuery, categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      return await apiClient.get(`/api/v1/forms/templates?${params}`);
    },
  });

  const { data: responsesData } = useQuery({
    queryKey: ['form-responses', selectedTemplate?.id],
    queryFn: async () => {
      if (!selectedTemplate?.id) return null;
      return await apiClient.get(`/api/v1/forms/templates/${selectedTemplate.id}/responses`);
    },
    enabled: !!selectedTemplate?.id && showResponsesDialog,
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiClient.post('/api/v1/forms/templates', data);
    },
    onSuccess: () => {
      toast.success('Form template created successfully');
      queryClient.invalidateQueries({ queryKey: ['form-templates'] });
      setShowBuilderDialog(false);
      resetBuilder();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create template');
    },
  });

  const cloneTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      return await apiClient.post(`/api/v1/forms/templates/${templateId}/clone`);
    },
    onSuccess: () => {
      toast.success('Template cloned successfully');
      queryClient.invalidateQueries({ queryKey: ['form-templates'] });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      return await apiClient.delete(`/api/v1/forms/templates/${templateId}`);
    },
    onSuccess: () => {
      toast.success('Template deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['form-templates'] });
    },
  });

  const publishTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      return await apiClient.post(`/api/v1/forms/templates/${templateId}/publish`);
    },
    onSuccess: () => {
      toast.success('Template published successfully');
      queryClient.invalidateQueries({ queryKey: ['form-templates'] });
    },
  });

  const templates = templatesData?.data || [];
  const responses = responsesData?.data || [];

  const resetBuilder = () => {
    setFormBuilder({
      name: '',
      category: 'INSPECTION',
      description: '',
      fields: [],
    });
    setCurrentField({
      id: '',
      type: 'TEXT',
      label: '',
      required: false,
      options: [],
      placeholder: '',
    });
  };

  const addFieldToForm = () => {
    if (!currentField.label) {
      toast.error('Field label is required');
      return;
    }

    const field = {
      id: currentField.id || `field-${Date.now()}`,
      type: currentField.type,
      label: currentField.label,
      required: currentField.required,
      placeholder: currentField.placeholder || undefined,
      options: ['RADIO', 'DROPDOWN', 'CHECKBOX'].includes(currentField.type)
        ? currentField.options
        : undefined,
    };

    setFormBuilder({
      ...formBuilder,
      fields: [...formBuilder.fields, field],
    });

    setCurrentField({
      id: '',
      type: 'TEXT',
      label: '',
      required: false,
      options: [],
      placeholder: '',
    });
  };

  const removeField = (fieldId: string) => {
    setFormBuilder({
      ...formBuilder,
      fields: formBuilder.fields.filter((f) => f.id !== fieldId),
    });
  };

  const saveTemplate = () => {
    if (!formBuilder.name) {
      toast.error('Template name is required');
      return;
    }

    if (formBuilder.fields.length === 0) {
      toast.error('Add at least one field to the form');
      return;
    }

    createTemplateMutation.mutate({
      name: formBuilder.name,
      category: formBuilder.category,
      description: formBuilder.description || undefined,
      fields: formBuilder.fields,
      logic: {},
      settings: {},
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Form Builder</h1>
          <p className="text-gray-600 mt-1">Create and manage dynamic forms</p>
        </div>
        <Dialog open={showBuilderDialog} onOpenChange={setShowBuilderDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetBuilder}>
              <Plus className="h-4 w-4 mr-2" />
              New Form Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Form Builder</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Template Metadata */}
              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-semibold">Template Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Template Name *</Label>
                    <Input
                      value={formBuilder.name}
                      onChange={(e) =>
                        setFormBuilder({ ...formBuilder, name: e.target.value })
                      }
                      placeholder="Site Safety Inspection"
                    />
                  </div>
                  <div>
                    <Label>Category *</Label>
                    <Select
                      value={formBuilder.category}
                      onValueChange={(value) =>
                        setFormBuilder({ ...formBuilder, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INSPECTION">Inspection</SelectItem>
                        <SelectItem value="CHECKLIST">Checklist</SelectItem>
                        <SelectItem value="SURVEY">Survey</SelectItem>
                        <SelectItem value="REPORT">Report</SelectItem>
                        <SelectItem value="INCIDENT">Incident</SelectItem>
                        <SelectItem value="CUSTOM">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formBuilder.description}
                    onChange={(e) =>
                      setFormBuilder({ ...formBuilder, description: e.target.value })
                    }
                    placeholder="Describe the purpose of this form..."
                    rows={2}
                  />
                </div>
              </div>

              {/* Add Field Section */}
              <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                <h3 className="font-semibold">Add Field</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Field Type *</Label>
                    <Select
                      value={currentField.type}
                      onValueChange={(value) =>
                        setCurrentField({ ...currentField, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.icon} {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Field Label *</Label>
                    <Input
                      value={currentField.label}
                      onChange={(e) =>
                        setCurrentField({ ...currentField, label: e.target.value })
                      }
                      placeholder="Enter field label"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Placeholder</Label>
                    <Input
                      value={currentField.placeholder}
                      onChange={(e) =>
                        setCurrentField({ ...currentField, placeholder: e.target.value })
                      }
                      placeholder="Enter placeholder text"
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Checkbox
                      checked={currentField.required}
                      onCheckedChange={(checked) =>
                        setCurrentField({ ...currentField, required: checked as boolean })
                      }
                    />
                    <Label>Required Field</Label>
                  </div>
                </div>
                {['RADIO', 'DROPDOWN', 'CHECKBOX'].includes(currentField.type) && (
                  <div>
                    <Label>Options (comma-separated) *</Label>
                    <Input
                      value={currentField.options.join(', ')}
                      onChange={(e) =>
                        setCurrentField({
                          ...currentField,
                          options: e.target.value.split(',').map((o) => o.trim()),
                        })
                      }
                      placeholder="Yes, No, Maybe"
                    />
                  </div>
                )}
                <Button onClick={addFieldToForm} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Field to Form
                </Button>
              </div>

              {/* Current Form Preview */}
              {formBuilder.fields.length > 0 && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-semibold">
                    Form Preview ({formBuilder.fields.length} fields)
                  </h3>
                  <div className="space-y-3">
                    {formBuilder.fields.map((field, idx) => (
                      <div
                        key={field.id}
                        className="flex items-start justify-between p-3 border rounded bg-white"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-500">
                              #{idx + 1}
                            </span>
                            <Badge variant="outline">{field.type}</Badge>
                            <span className="font-medium">{field.label}</span>
                            {field.required && (
                              <Badge variant="destructive" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                          {field.options && (
                            <p className="text-sm text-gray-500 mt-1">
                              Options: {field.options.join(', ')}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeField(field.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBuilderDialog(false);
                    resetBuilder();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveTemplate}
                  disabled={createTemplateMutation.isPending}
                >
                  {createTemplateMutation.isPending ? 'Saving...' : 'Save Template'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Templates</p>
                <p className="text-2xl font-bold">{templates.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Published</p>
                <p className="text-2xl font-bold text-green-600">
                  {templates.filter((t: any) => t.isPublished).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Drafts</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {templates.filter((t: any) => !t.isPublished).length}
                </p>
              </div>
              <Edit className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Responses</p>
                <p className="text-2xl font-bold">
                  {templates.reduce((sum: number, t: any) => sum + (t._count?.responses || 0), 0)}
                </p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="INSPECTION">Inspection</SelectItem>
                <SelectItem value="CHECKLIST">Checklist</SelectItem>
                <SelectItem value="SURVEY">Survey</SelectItem>
                <SelectItem value="REPORT">Report</SelectItem>
                <SelectItem value="INCIDENT">Incident</SelectItem>
                <SelectItem value="CUSTOM">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-12">Loading...</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No templates found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Fields</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Responses</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template: any) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{template.name}</p>
                        {template.description && (
                          <p className="text-sm text-gray-500">{template.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{template.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{template.fields?.length || 0}</span>
                        <span className="text-sm text-gray-500">fields</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {template.isPublished ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Published
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Edit className="h-3 w-3 mr-1" />
                          Draft
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowResponsesDialog(true);
                        }}
                      >
                        {template._count?.responses || 0} responses
                      </Button>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDistanceToNow(new Date(template.createdAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {!template.isPublished && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => publishTemplateMutation.mutate(template.id)}
                            title="Publish"
                          >
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cloneTemplateMutation.mutate(template.id)}
                          title="Clone"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this template?')) {
                              deleteTemplateMutation.mutate(template.id);
                            }
                          }}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Responses Dialog */}
      <Dialog open={showResponsesDialog} onOpenChange={setShowResponsesDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Form Responses: {selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {responses.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No responses yet</p>
            ) : (
              <div className="space-y-4">
                {responses.map((response: any) => (
                  <Card key={response.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge>{response.status}</Badge>
                          <span className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(response.submittedAt), { addSuffix: true })}
                          </span>
                        </div>
                        {response.latitude && response.longitude && (
                          <Badge variant="outline">
                            📍 {response.latitude.toFixed(4)}, {response.longitude.toFixed(4)}
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-2">
                        {Object.entries(response.responses || {}).map(([key, value]: [string, any]) => (
                          <div key={key} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                            <span className="text-sm font-medium min-w-[150px]">{key}:</span>
                            <span className="text-sm">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
