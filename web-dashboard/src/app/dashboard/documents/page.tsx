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
import { Search, Plus, Upload, FileText, Download, Eye, History, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadMetadata, setUploadMetadata] = useState({
    entityType: '',
    entityId: '',
    tags: '',
    folderPath: '',
  });

  const queryClient = useQueryClient();

  const { data: documentsData, isLoading } = useQuery({
    queryKey: ['documents', searchQuery, entityTypeFilter, tagFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (entityTypeFilter !== 'all') params.append('entityType', entityTypeFilter);
      if (tagFilter) params.append('tags', tagFilter);
      return await apiClient.get(`/api/v1/documents?${params}`);
    },
  });

  const { data: versionsData } = useQuery({
    queryKey: ['document-versions', selectedDocument?.id],
    queryFn: async () => {
      if (!selectedDocument?.id) return null;
      return await apiClient.get(`/api/v1/documents/${selectedDocument.id}/versions`);
    },
    enabled: !!selectedDocument?.id,
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!uploadFile) throw new Error('No file selected');

      // Step 1: Get presigned URL
      const presignedResponse = await apiClient.post('/api/v1/documents/presigned-url', {
        fileName: uploadFile.name,
        mimeType: uploadFile.type,
        sizeBytes: uploadFile.size,
      });

      const { uploadUrl, s3Key, bucket } = presignedResponse.data;

      // Step 2: Upload to S3
      const uploadResult = await fetch(uploadUrl, {
        method: 'PUT',
        body: uploadFile,
        headers: {
          'Content-Type': uploadFile.type,
        },
      });

      if (!uploadResult.ok) {
        throw new Error('Failed to upload file to S3');
      }

      // Step 3: Create document record
      const tags = uploadMetadata.tags
        ? uploadMetadata.tags.split(',').map((t) => t.trim())
        : [];

      const documentData: any = {
        fileName: uploadFile.name,
        mimeType: uploadFile.type,
        sizeBytes: uploadFile.size,
        s3Key,
        s3Bucket: bucket,
        tags,
        folderPath: uploadMetadata.folderPath || undefined,
      };

      if (uploadMetadata.entityType) {
        documentData.entityType = uploadMetadata.entityType;
        documentData.entityId = uploadMetadata.entityId;
      }

      return await apiClient.post('/api/v1/documents', documentData);
    },
    onSuccess: () => {
      toast.success('Document uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setShowUploadDialog(false);
      setUploadFile(null);
      setUploadMetadata({
        entityType: '',
        entityId: '',
        tags: '',
        folderPath: '',
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload document');
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await apiClient.get(`/api/v1/documents/${documentId}/download-url`);
      return response.data;
    },
    onSuccess: (data) => {
      window.open(data.downloadUrl, '_blank');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to get download URL');
    },
  });

  const documents = documentsData?.data || [];
  const versions = versionsData?.data || [];

  const getMimeTypeIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
    if (mimeType.includes('video')) return '🎥';
    return '📎';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-gray-600 mt-1">Manage your document library</p>
        </div>
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium mb-2">File</label>
                <Input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                />
                {uploadFile && (
                  <p className="text-sm text-gray-500 mt-1">
                    {uploadFile.name} ({formatFileSize(uploadFile.size)})
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Entity Type (Optional)</label>
                  <Select
                    value={uploadMetadata.entityType}
                    onValueChange={(value) =>
                      setUploadMetadata({ ...uploadMetadata, entityType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      <SelectItem value="CUSTOMER">Customer</SelectItem>
                      <SelectItem value="SITE">Site</SelectItem>
                      <SelectItem value="JOB">Job</SelectItem>
                      <SelectItem value="QUOTE">Quote</SelectItem>
                      <SelectItem value="INVOICE">Invoice</SelectItem>
                      <SelectItem value="ASSET">Asset</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Entity ID (Optional)</label>
                  <Input
                    value={uploadMetadata.entityId}
                    onChange={(e) =>
                      setUploadMetadata({ ...uploadMetadata, entityId: e.target.value })
                    }
                    placeholder="Enter entity ID"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
                <Input
                  value={uploadMetadata.tags}
                  onChange={(e) =>
                    setUploadMetadata({ ...uploadMetadata, tags: e.target.value })
                  }
                  placeholder="contract, signed, 2024"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Folder Path (Optional)</label>
                <Input
                  value={uploadMetadata.folderPath}
                  onChange={(e) =>
                    setUploadMetadata({ ...uploadMetadata, folderPath: e.target.value })
                  }
                  placeholder="contracts/2024"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowUploadDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => uploadMutation.mutate()}
                  disabled={!uploadFile || uploadMutation.isPending}
                >
                  {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
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
                <p className="text-sm text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold">{documents.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Size</p>
                <p className="text-2xl font-bold">
                  {formatFileSize(
                    documents.reduce((sum: number, doc: any) => sum + (doc.sizeBytes || 0), 0)
                  )}
                </p>
              </div>
              <FileText className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">With Entities</p>
                <p className="text-2xl font-bold">
                  {documents.filter((d: any) => d.entityType).length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Versions</p>
                <p className="text-2xl font-bold">
                  {documents.filter((d: any) => d.version > 1).length}
                </p>
              </div>
              <History className="h-8 w-8 text-orange-500" />
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
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="CUSTOMER">Customer</SelectItem>
                <SelectItem value="SITE">Site</SelectItem>
                <SelectItem value="JOB">Job</SelectItem>
                <SelectItem value="QUOTE">Quote</SelectItem>
                <SelectItem value="INVOICE">Invoice</SelectItem>
                <SelectItem value="ASSET">Asset</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Filter by tag..."
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="w-48"
            />
          </div>

          {isLoading ? (
            <div className="text-center py-12">Loading...</div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No documents found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc: any) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getMimeTypeIcon(doc.mimeType)}</span>
                        <div>
                          <p className="font-medium">{doc.fileName}</p>
                          {doc.folderPath && (
                            <p className="text-xs text-gray-500">{doc.folderPath}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{doc.mimeType.split('/')[1]?.toUpperCase()}</TableCell>
                    <TableCell className="text-sm">{formatFileSize(doc.sizeBytes)}</TableCell>
                    <TableCell className="text-sm">
                      {doc.entityType ? (
                        <Badge variant="outline">
                          {doc.entityType}
                        </Badge>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {doc.tags?.slice(0, 2).map((tag: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {doc.tags?.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{doc.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        v{doc.version}
                        {doc.parentId && (
                          <History className="h-3 w-3 text-gray-400" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadMutation.mutate(doc.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedDocument(doc)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>Document Details</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div>
                                <p className="text-sm font-medium text-gray-500">File Name</p>
                                <p className="text-lg">{doc.fileName}</p>
                              </div>
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <p className="text-sm font-medium text-gray-500">MIME Type</p>
                                  <p>{doc.mimeType}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-500">Size</p>
                                  <p>{formatFileSize(doc.sizeBytes)}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-500">Version</p>
                                  <p>v{doc.version}</p>
                                </div>
                              </div>
                              {doc.entityType && (
                                <div>
                                  <p className="text-sm font-medium text-gray-500">Associated Entity</p>
                                  <Badge>{doc.entityType}: {doc.entityId}</Badge>
                                </div>
                              )}
                              {doc.tags?.length > 0 && (
                                <div>
                                  <p className="text-sm font-medium text-gray-500 mb-2">Tags</p>
                                  <div className="flex gap-2 flex-wrap">
                                    {doc.tags.map((tag: string, idx: number) => (
                                      <Badge key={idx} variant="secondary">
                                        <Tag className="h-3 w-3 mr-1" />
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {versions.length > 0 && (
                                <div>
                                  <p className="text-sm font-medium text-gray-500 mb-2">Version History</p>
                                  <div className="space-y-2">
                                    {versions.map((v: any) => (
                                      <div key={v.id} className="flex items-center justify-between p-2 border rounded">
                                        <div>
                                          <p className="text-sm font-medium">v{v.version}</p>
                                          <p className="text-xs text-gray-500">
                                            {formatDistanceToNow(new Date(v.createdAt), { addSuffix: true })}
                                          </p>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => downloadMutation.mutate(v.id)}
                                        >
                                          <Download className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
