import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useAsset } from '../hooks/use-assets';
import { AssetStatus } from '../types';

export default function AssetDetailScreen({ route, navigation }: any) {
  const { assetId } = route.params;
  const { asset, isLoading, updateAssetStatus } = useAsset(assetId);

  const handleStatusChange = async (newStatus: AssetStatus) => {
    try {
      await updateAssetStatus(newStatus);
    } catch (error) {
      console.error('Failed to update asset status:', error);
    }
  };

  if (isLoading || !asset) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.code}>{asset.code}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(asset.status) }]}>
          <Text style={styles.statusText}>{asset.status}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>{asset.name}</Text>
        {asset.description && (
          <Text style={styles.description}>{asset.description}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Category</Text>
          <Text style={styles.detailValue}>{asset.category}</Text>
        </View>

        {asset.serialNumber && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Serial Number</Text>
            <Text style={styles.detailValue}>{asset.serialNumber}</Text>
          </View>
        )}

        {asset.assignedToJobId && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Assigned to Job</Text>
            <Text style={styles.detailValue}>Yes</Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Created</Text>
          <Text style={styles.detailValue}>
            {new Date(asset.createdAt).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Last Updated</Text>
          <Text style={styles.detailValue}>
            {new Date(asset.updatedAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Change Status</Text>
        <View style={styles.statusButtons}>
          {Object.values(AssetStatus).map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.statusButton,
                asset.status === status && styles.statusButtonActive,
                { borderColor: getStatusColor(status) },
              ]}
              onPress={() => handleStatusChange(status)}
            >
              <Text
                style={[
                  styles.statusButtonText,
                  asset.status === status && { color: '#fff' },
                  asset.status === status && { backgroundColor: getStatusColor(status) },
                ]}
              >
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  code: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  statusButtons: {
    gap: 8,
  },
  statusButton: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  statusButtonActive: {
    backgroundColor: '#3b82f6',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
});
