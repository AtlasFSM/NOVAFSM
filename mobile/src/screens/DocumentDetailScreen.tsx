import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { useRoute } from '@react-navigation/native';

type DocumentVersion = {
  id: string;
  version: number;
  uploadedAt: string;
  uploadedBy: string;
  size: number;
  notes: string;
};

type Document = {
  id: string;
  name: string;
  type: string;
  category: 'CONTRACT' | 'INVOICE' | 'QUOTE' | 'REPORT' | 'PHOTO' | 'OTHER';
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  associatedEntity: {
    type: 'JOB' | 'CUSTOMER' | 'QUOTE' | 'INVOICE';
    id: string;
    name: string;
  };
  tags: string[];
  description: string;
  url: string;
  mimeType: string;
  versions: DocumentVersion[];
};

export default function DocumentDetailScreen({ navigation }: any) {
  const route = useRoute();
  const { documentId } = route.params as { documentId: string };

  // Mock data - replace with actual API call
  const [document] = useState<Document>({
    id: documentId,
    name: 'Service_Agreement_2024.pdf',
    type: 'PDF',
    category: 'CONTRACT',
    size: 2457600, // 2.4 MB
    uploadedAt: '2024-11-01T10:30:00Z',
    uploadedBy: 'Sarah Johnson',
    associatedEntity: {
      type: 'CUSTOMER',
      id: 'cust-001',
      name: 'Acme Corporation',
    },
    tags: ['contract', 'annual', '2024'],
    description: 'Annual service agreement for HVAC maintenance and support',
    url: 'https://s3.amazonaws.com/novafsm/documents/service-agreement.pdf',
    mimeType: 'application/pdf',
    versions: [
      {
        id: 'v3',
        version: 3,
        uploadedAt: '2024-11-01T10:30:00Z',
        uploadedBy: 'Sarah Johnson',
        size: 2457600,
        notes: 'Updated pricing terms',
      },
      {
        id: 'v2',
        version: 2,
        uploadedAt: '2024-10-28T14:20:00Z',
        uploadedBy: 'Mike Davis',
        size: 2445000,
        notes: 'Added emergency service clause',
      },
      {
        id: 'v1',
        version: 1,
        uploadedAt: '2024-10-25T09:00:00Z',
        uploadedBy: 'Sarah Johnson',
        size: 2430000,
        notes: 'Initial version',
      },
    ],
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'CONTRACT': return '📄';
      case 'INVOICE': return '💰';
      case 'QUOTE': return '📋';
      case 'REPORT': return '📊';
      case 'PHOTO': return '📷';
      default: return '📁';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'CONTRACT': return '#3b82f6';
      case 'INVOICE': return '#10b981';
      case 'QUOTE': return '#f59e0b';
      case 'REPORT': return '#8b5cf6';
      case 'PHOTO': return '#ec4899';
      default: return '#6b7280';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleDownload = () => {
    // TODO: Implement actual download
    Alert.alert('Download', 'Downloading document...');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this document: ${document.name}`,
        url: document.url,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share document');
    }
  };

  const handleViewVersion = (version: DocumentVersion) => {
    // TODO: Implement version viewer
    Alert.alert('View Version', `Opening version ${version.version}`);
  };

  const handleDeleteDocument = () => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement actual delete
            Alert.alert('Deleted', 'Document has been deleted');
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleOpenEntity = () => {
    // TODO: Navigate to associated entity
    const { type, id, name } = document.associatedEntity;
    Alert.alert('Navigate', `Opening ${type}: ${name}`);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Document Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{getCategoryIcon(document.category)}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.documentName}>{document.name}</Text>
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(document.category) }]}>
            <Text style={styles.categoryText}>{document.category}</Text>
          </View>
          <Text style={styles.fileInfo}>
            {document.type.toUpperCase()} • {formatFileSize(document.size)}
          </Text>
        </View>
      </View>

      {/* Document Preview Placeholder */}
      <View style={styles.previewContainer}>
        <View style={styles.previewPlaceholder}>
          <Text style={styles.previewIcon}>{getCategoryIcon(document.category)}</Text>
          <Text style={styles.previewText}>Document Preview</Text>
          <Text style={styles.previewSubtext}>Tap Download to view full document</Text>
        </View>
      </View>

      {/* Description */}
      {document.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{document.description}</Text>
        </View>
      )}

      {/* Document Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Document Details</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Uploaded:</Text>
          <Text style={styles.infoValue}>{formatDate(document.uploadedAt)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Uploaded By:</Text>
          <Text style={styles.infoValue}>{document.uploadedBy}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>MIME Type:</Text>
          <Text style={styles.infoValue}>{document.mimeType}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Current Version:</Text>
          <Text style={styles.infoValue}>v{document.versions[0].version}</Text>
        </View>
      </View>

      {/* Associated Entity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Associated With</Text>
        <TouchableOpacity style={styles.entityCard} onPress={handleOpenEntity}>
          <View style={styles.entityInfo}>
            <Text style={styles.entityType}>{document.associatedEntity.type}</Text>
            <Text style={styles.entityName}>{document.associatedEntity.name}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Tags */}
      {document.tags.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tagsContainer}>
            {document.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Version History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Version History</Text>
        {document.versions.map((version) => (
          <TouchableOpacity
            key={version.id}
            style={styles.versionCard}
            onPress={() => handleViewVersion(version)}
          >
            <View style={styles.versionHeader}>
              <View style={styles.versionInfo}>
                <Text style={styles.versionNumber}>Version {version.version}</Text>
                <Text style={styles.versionDate}>{formatDate(version.uploadedAt)}</Text>
              </View>
              <Text style={styles.versionSize}>{formatFileSize(version.size)}</Text>
            </View>
            <Text style={styles.versionUploader}>Uploaded by {version.uploadedBy}</Text>
            {version.notes && (
              <Text style={styles.versionNotes}>{version.notes}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonPrimary]}
          onPress={handleDownload}
        >
          <Text style={styles.actionButtonText}>Download</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={handleShare}
        >
          <Text style={styles.actionButtonTextSecondary}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonDanger]}
          onPress={handleDeleteDocument}
        >
          <Text style={styles.actionButtonTextDanger}>Delete Document</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 32,
  },
  headerInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  categoryText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  fileInfo: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  previewContainer: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  previewPlaceholder: {
    height: 200,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  previewText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  previewSubtext: {
    fontSize: 13,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  entityCard: {
    backgroundColor: '#f9fafb',
    padding: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  entityInfo: {
    flex: 1,
  },
  entityType: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  entityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  chevron: {
    fontSize: 24,
    color: '#9ca3af',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    color: '#4f46e5',
    fontSize: 13,
    fontWeight: '500',
  },
  versionCard: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  versionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  versionInfo: {
    flex: 1,
  },
  versionNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  versionDate: {
    fontSize: 12,
    color: '#666',
  },
  versionSize: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  versionUploader: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  versionNotes: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonPrimary: {
    backgroundColor: '#3b82f6',
  },
  actionButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  actionButtonDanger: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonTextSecondary: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonTextDanger: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
});
