import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useDocuments } from '../hooks/use-documents';
import { useSync } from '../hooks/use-sync';
import { Document, DocumentType } from '../types';

export default function DocumentsScreen({ navigation }: any) {
  const { documents, isLoading, refreshDocuments } = useDocuments();
  const { isSyncing } = useSync();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });
    return unsubscribe;
  }, []);

  const handleRefresh = async () => {
    await refreshDocuments();
  };

  const getTypeColor = (type: DocumentType) => {
    switch (type) {
      case DocumentType.INVOICE:
        return '#10b981';
      case DocumentType.QUOTE:
        return '#3b82f6';
      case DocumentType.REPORT:
        return '#8b5cf6';
      case DocumentType.PHOTO:
        return '#f59e0b';
      case DocumentType.OTHER:
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const renderDocument = ({ item }: { item: Document }) => (
    <TouchableOpacity
      style={styles.documentCard}
      onPress={() => {
        // Could navigate to a document viewer
        console.log('View document:', item.id);
      }}
    >
      <View style={styles.documentHeader}>
        <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type) }]}>
          <Text style={styles.typeText}>{item.type}</Text>
        </View>
        {!item.uploaded && (
          <View style={styles.uploadPendingBadge}>
            <Text style={styles.uploadPendingText}>Pending Upload</Text>
          </View>
        )}
      </View>
      <Text style={styles.documentName}>{item.name}</Text>
      {item.description && (
        <Text style={styles.documentDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}
      <View style={styles.documentMeta}>
        <Text style={styles.documentSize}>{formatFileSize(item.size)}</Text>
        <Text style={styles.documentDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading && documents.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Documents</Text>
        {!isOnline && (
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineText}>Offline</Text>
          </View>
        )}
        {isSyncing && (
          <ActivityIndicator size="small" color="#3b82f6" style={{ marginLeft: 8 }} />
        )}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('DocumentUpload')}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={documents}
        renderItem={renderDocument}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No documents found</Text>
            <Text style={styles.emptySubtext}>Tap + to add a document</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  offlineBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  offlineText: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: '600',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  list: {
    padding: 16,
  },
  documentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  uploadPendingBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  uploadPendingText: {
    color: '#92400e',
    fontSize: 11,
    fontWeight: '600',
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  documentDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  documentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  documentSize: {
    fontSize: 12,
    color: '#9ca3af',
  },
  documentDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
});
