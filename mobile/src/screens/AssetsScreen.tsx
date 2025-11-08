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
import { useAssets } from '../hooks/use-assets';
import { useSync } from '../hooks/use-sync';
import { Asset, AssetStatus } from '../types';

export default function AssetsScreen({ navigation }: any) {
  const { assets, isLoading, refreshAssets } = useAssets();
  const { syncStatus } = useSync();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });
    return unsubscribe;
  }, []);

  const handleRefresh = async () => {
    await refreshAssets();
  };

  const getStatusColor = (status: AssetStatus) => {
    switch (status) {
      case AssetStatus.AVAILABLE:
        return '#10b981';
      case AssetStatus.IN_USE:
        return '#3b82f6';
      case AssetStatus.MAINTENANCE:
        return '#f59e0b';
      case AssetStatus.RETIRED:
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const renderAsset = ({ item }: { item: Asset }) => (
    <TouchableOpacity
      style={styles.assetCard}
      onPress={() => navigation.navigate('AssetDetail', { assetId: item.id })}
    >
      <View style={styles.assetHeader}>
        <Text style={styles.assetCode}>{item.code}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.assetName}>{item.name}</Text>
      <Text style={styles.assetCategory}>Category: {item.category}</Text>
      {item.serialNumber && (
        <Text style={styles.assetSerial}>S/N: {item.serialNumber}</Text>
      )}
      {item.assignedToJobId && (
        <Text style={styles.assetAssigned}>Assigned to Job</Text>
      )}
    </TouchableOpacity>
  );

  if (isLoading && assets.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Assets</Text>
        {!isOnline && (
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineText}>Offline</Text>
          </View>
        )}
        {syncStatus.isSyncing && (
          <ActivityIndicator size="small" color="#3b82f6" style={{ marginLeft: 8 }} />
        )}
      </View>

      <FlatList
        data={assets}
        renderItem={renderAsset}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No assets found</Text>
            <Text style={styles.emptySubtext}>Pull down to refresh</Text>
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
  },
  offlineText: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  assetCard: {
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
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  assetCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  assetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  assetCategory: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  assetSerial: {
    fontSize: 12,
    color: '#9ca3af',
  },
  assetAssigned: {
    marginTop: 8,
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
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
