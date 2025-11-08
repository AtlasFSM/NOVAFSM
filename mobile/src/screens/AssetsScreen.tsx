import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';

interface Asset {
  id: string;
  name: string;
  assetNumber: string;
  type: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'RETIRED';
  customerId: string;
  customerName: string;
  location?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  serialNumber?: string;
  syncStatus?: 'synced' | 'pending' | 'conflict';
}

export default function AssetsScreen({ navigation }: any) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });
    loadAssets();
    return unsubscribe;
  }, []);

  const loadAssets = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockAssets: Asset[] = [
        {
          id: '1',
          name: 'HVAC Unit #1',
          assetNumber: 'HVAC-001',
          type: 'HVAC',
          status: 'ACTIVE',
          customerId: 'cust1',
          customerName: 'Acme Corporation',
          location: 'Main Building - Roof',
          serialNumber: 'SN123456789',
          lastMaintenanceDate: '2024-10-15',
          nextMaintenanceDate: '2025-01-15',
        },
        {
          id: '2',
          name: 'Chiller Unit',
          assetNumber: 'CHILL-001',
          type: 'COOLING',
          status: 'MAINTENANCE',
          customerId: 'cust1',
          customerName: 'Acme Corporation',
          location: 'Mechanical Room',
          serialNumber: 'SN987654321',
          lastMaintenanceDate: '2024-11-01',
          nextMaintenanceDate: '2024-11-08',
        },
        {
          id: '3',
          name: 'Boiler System',
          assetNumber: 'BOIL-001',
          type: 'HEATING',
          status: 'ACTIVE',
          customerId: 'cust2',
          customerName: 'TechStart Inc',
          location: 'Basement',
          serialNumber: 'SN456789123',
          lastMaintenanceDate: '2024-09-20',
          nextMaintenanceDate: '2024-12-20',
        },
      ];
      setAssets(mockAssets);
    } catch (error) {
      console.error('Failed to load assets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAssets();
    setIsRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '#10b981';
      case 'MAINTENANCE':
        return '#f59e0b';
      case 'RETIRED':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const filteredAssets = assets.filter(
    (asset) =>
      searchQuery === '' ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.assetNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderAsset = ({ item }: { item: Asset }) => (
    <TouchableOpacity
      style={styles.assetCard}
      onPress={() => navigation.navigate('AssetDetail', { assetId: item.id })}
    >
      <View style={styles.assetHeader}>
        <View>
          <Text style={styles.assetNumber}>{item.assetNumber}</Text>
          <Text style={styles.assetName}>{item.name}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.assetDetails}>
        <Text style={styles.assetType}>Type: {item.type}</Text>
        <Text style={styles.assetCustomer}>Customer: {item.customerName}</Text>
        {item.location && (
          <Text style={styles.assetLocation}>📍 {item.location}</Text>
        )}
        {item.serialNumber && (
          <Text style={styles.assetSerial}>S/N: {item.serialNumber}</Text>
        )}
      </View>

      {item.nextMaintenanceDate && (
        <View style={styles.maintenanceInfo}>
          <Text style={styles.maintenanceLabel}>Next Maintenance:</Text>
          <Text style={styles.maintenanceDate}>
            {new Date(item.nextMaintenanceDate).toLocaleDateString()}
          </Text>
        </View>
      )}

      {item.syncStatus === 'pending' && (
        <Text style={styles.syncPending}>⏱ Pending sync</Text>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading assets...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Assets</Text>
        <View style={styles.statusIndicator}>
          <View style={[styles.onlineIndicator, { backgroundColor: isOnline ? '#10b981' : '#ef4444' }]} />
          <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search assets..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{assets.filter(a => a.status === 'ACTIVE').length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{assets.filter(a => a.status === 'MAINTENANCE').length}</Text>
          <Text style={styles.statLabel}>In Maintenance</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{assets.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      <FlatList
        data={filteredAssets}
        renderItem={renderAsset}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No assets found</Text>
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
  searchContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
  },
  searchInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
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
  listContent: {
    padding: 16,
    gap: 12,
  },
  assetCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  assetNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 4,
  },
  assetName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  assetDetails: {
    gap: 6,
    marginBottom: 12,
  },
  assetType: {
    fontSize: 14,
    color: '#6b7280',
  },
  assetCustomer: {
    fontSize: 14,
    color: '#6b7280',
  },
  assetLocation: {
    fontSize: 14,
    color: '#6b7280',
  },
  assetSerial: {
    fontSize: 13,
    color: '#9ca3af',
    fontFamily: 'monospace',
  },
  maintenanceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  maintenanceLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  maintenanceDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
  },
  syncPending: {
    marginTop: 8,
    fontSize: 12,
    color: '#f59e0b',
    fontStyle: 'italic',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
  },
});
