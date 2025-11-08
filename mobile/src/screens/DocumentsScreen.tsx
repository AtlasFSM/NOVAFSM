import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import NetInfo from '@react-native-community/netinfo';

interface Document {
  id: string;
  title: string;
  fileType: 'PDF' | 'IMAGE' | 'DOC' | 'XLS' | 'OTHER';
  fileUrl?: string;
  localUri?: string;
  fileSize: number;
  relatedTo?: {
    type: 'JOB' | 'CUSTOMER' | 'ASSET';
    id: string;
    name: string;
  };
  uploadedBy: string;
  uploadedAt: string;
  syncStatus?: 'synced' | 'pending' | 'uploading';
}

export default function DocumentsScreen({ navigation }: any) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });
    loadDocuments();
    requestPermissions();
    return unsubscribe;
  }, []);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Camera and photo library access are needed to upload documents.'
      );
    }
  };

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockDocuments: Document[] = [
        {
          id: '1',
          title: 'Installation Photo - HVAC Unit',
          fileType: 'IMAGE',
          fileUrl: 'https://example.com/photo1.jpg',
          fileSize: 2457600,
          relatedTo: {
            type: 'JOB',
            id: 'job1',
            name: 'J-2024-001',
          },
          uploadedBy: 'John Smith',
          uploadedAt: '2024-11-08T10:30:00Z',
          syncStatus: 'synced',
        },
        {
          id: '2',
          title: 'Customer Signature',
          fileType: 'IMAGE',
          fileUrl: 'https://example.com/signature1.jpg',
          fileSize: 524288,
          relatedTo: {
            type: 'JOB',
            id: 'job1',
            name: 'J-2024-001',
          },
          uploadedBy: 'John Smith',
          uploadedAt: '2024-11-08T15:45:00Z',
          syncStatus: 'synced',
        },
        {
          id: '3',
          title: 'Equipment Manual - HVAC',
          fileType: 'PDF',
          fileUrl: 'https://example.com/manual.pdf',
          fileSize: 5242880,
          relatedTo: {
            type: 'ASSET',
            id: 'asset1',
            name: 'HVAC-001',
          },
          uploadedBy: 'Admin',
          uploadedAt: '2024-10-15T09:00:00Z',
          syncStatus: 'synced',
        },
      ];
      setDocuments(mockDocuments);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDocuments();
    setIsRefreshing(false);
  };

  const handleTakePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await handleUploadDocument(result.assets[0].uri, 'IMAGE');
      }
    } catch (error) {
      console.error('Failed to take photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await handleUploadDocument(result.assets[0].uri, 'IMAGE');
      }
    } catch (error) {
      console.error('Failed to pick image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleUploadDocument = async (uri: string, fileType: string) => {
    setIsUploading(true);
    try {
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(uri);

      // Create new document record
      const newDocument: Document = {
        id: Date.now().toString(),
        title: `Document_${new Date().toISOString()}`,
        fileType: fileType as any,
        localUri: uri,
        fileSize: fileInfo.size || 0,
        uploadedBy: 'Current User',
        uploadedAt: new Date().toISOString(),
        syncStatus: 'pending',
      };

      setDocuments([newDocument, ...documents]);

      // In production, upload to server and update syncStatus
      // For now, just simulate upload
      setTimeout(() => {
        setDocuments(docs =>
          docs.map(doc =>
            doc.id === newDocument.id
              ? { ...doc, syncStatus: 'synced' as const }
              : doc
          )
        );
        Alert.alert('Success', 'Document uploaded successfully');
      }, 2000);
    } catch (error) {
      console.error('Failed to upload document:', error);
      Alert.alert('Error', 'Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDocumentOptions = () => {
    Alert.alert(
      'Add Document',
      'Choose how to add a document',
      [
        {
          text: 'Take Photo',
          onPress: handleTakePhoto,
        },
        {
          text: 'Choose from Library',
          onPress: handlePickImage,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const getFileTypeColor = (fileType: string) => {
    switch (fileType) {
      case 'IMAGE':
        return '#3b82f6';
      case 'PDF':
        return '#ef4444';
      case 'DOC':
        return '#3b82f6';
      case 'XLS':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderDocument = ({ item }: { item: Document }) => (
    <TouchableOpacity
      style={styles.documentCard}
      onPress={() => navigation.navigate('DocumentDetail', { documentId: item.id })}
    >
      <View style={styles.documentIcon}>
        {item.fileType === 'IMAGE' && item.localUri ? (
          <Image source={{ uri: item.localUri }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.iconPlaceholder, { backgroundColor: getFileTypeColor(item.fileType) }]}>
            <Text style={styles.fileTypeText}>{item.fileType}</Text>
          </View>
        )}
      </View>

      <View style={styles.documentInfo}>
        <Text style={styles.documentTitle} numberOfLines={2}>
          {item.title}
        </Text>

        {item.relatedTo && (
          <Text style={styles.relatedTo}>
            {item.relatedTo.type}: {item.relatedTo.name}
          </Text>
        )}

        <View style={styles.documentMeta}>
          <Text style={styles.metaText}>
            {formatFileSize(item.fileSize)}
          </Text>
          <Text style={styles.metaText}>•</Text>
          <Text style={styles.metaText}>
            {new Date(item.uploadedAt).toLocaleDateString()}
          </Text>
        </View>

        <Text style={styles.uploadedBy}>By: {item.uploadedBy}</Text>

        {item.syncStatus === 'pending' && (
          <Text style={styles.syncPending}>⏱ Pending upload</Text>
        )}
        {item.syncStatus === 'uploading' && (
          <Text style={styles.syncUploading}>📤 Uploading...</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading documents...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Documents</Text>
        <View style={styles.statusIndicator}>
          <View style={[styles.onlineIndicator, { backgroundColor: isOnline ? '#10b981' : '#ef4444' }]} />
          <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{documents.length}</Text>
          <Text style={styles.statLabel}>Total Docs</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {documents.filter(d => d.syncStatus === 'pending').length}
          </Text>
          <Text style={styles.statLabel}>Pending Upload</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {documents.filter(d => d.fileType === 'IMAGE').length}
          </Text>
          <Text style={styles.statLabel}>Photos</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={handleDocumentOptions}
        disabled={isUploading}
      >
        {isUploading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.addButtonText}>📷 Add Document</Text>
        )}
      </TouchableOpacity>

      <FlatList
        data={documents}
        renderItem={renderDocument}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No documents yet</Text>
            <Text style={styles.emptySubtext}>Tap the button above to add your first document</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    color: '#6b7280',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#3b82f6',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  documentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  documentIcon: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  iconPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileTypeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  documentInfo: {
    flex: 1,
    gap: 4,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  relatedTo: {
    fontSize: 13,
    color: '#3b82f6',
  },
  documentMeta: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  uploadedBy: {
    fontSize: 12,
    color: '#6b7280',
  },
  syncPending: {
    fontSize: 12,
    color: '#f59e0b',
    fontStyle: 'italic',
  },
  syncUploading: {
    fontSize: 12,
    color: '#3b82f6',
    fontStyle: 'italic',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
});
