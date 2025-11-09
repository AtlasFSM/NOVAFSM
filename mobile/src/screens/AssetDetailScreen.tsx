import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRoute } from '@react-navigation/native';

export default function AssetDetailScreen({ navigation }: any) {
  const route = useRoute();
  const { assetId } = route.params as { assetId: string };

  // Mock data - replace with actual API call
  const [asset] = useState({
    id: assetId,
    name: 'Service Van #1',
    category: 'VEHICLE',
    serialNumber: 'VAN-001-2024',
    model: 'Ford Transit 250',
    manufacturer: 'Ford',
    purchaseDate: '2024-01-15',
    purchaseCost: 45000,
    status: 'IN_USE',
    assignedTo: 'John Smith',
    location: 'Toronto, ON',
    warrantyExpiry: '2027-01-15',
    lastMaintenanceDate: '2024-10-15',
    nextMaintenanceDate: '2025-01-15',
    specifications: {
      'Engine': 'V6 3.5L',
      'Fuel Type': 'Gasoline',
      'Transmission': 'Automatic',
      'Mileage': '15,234 km',
    },
    maintenanceHistory: [
      {
        id: '1',
        date: '2024-10-15',
        type: 'Oil Change',
        description: 'Regular oil change and filter replacement',
        cost: 120,
      },
      {
        id: '2',
        date: '2024-08-20',
        type: 'Tire Rotation',
        description: 'Rotated all four tires',
        cost: 80,
      },
      {
        id: '3',
        date: '2024-06-01',
        type: 'Brake Inspection',
        description: 'Inspected brake pads and rotors',
        cost: 0,
      },
    ],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return '#10b981';
      case 'IN_USE': return '#3b82f6';
      case 'MAINTENANCE': return '#f59e0b';
      case 'RETIRED': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'VEHICLE': return '🚚';
      case 'TOOL': return '🔧';
      case 'EQUIPMENT': return '⚙️';
      default: return '📦';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{getCategoryIcon(asset.category)}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.assetName}>{asset.name}</Text>
          <Text style={styles.serialNumber}>{asset.serialNumber}</Text>
          <Text style={styles.model}>{asset.model}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(asset.status) }]}>
          <Text style={styles.statusText}>{asset.status}</Text>
        </View>
      </View>

      {/* Assignment Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Assignment</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Assigned To:</Text>
          <Text style={styles.infoValue}>{asset.assignedTo}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Location:</Text>
          <Text style={styles.infoValue}>{asset.location}</Text>
        </View>
      </View>

      {/* Asset Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Asset Details</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Category:</Text>
          <Text style={styles.infoValue}>{asset.category}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Manufacturer:</Text>
          <Text style={styles.infoValue}>{asset.manufacturer}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Purchase Date:</Text>
          <Text style={styles.infoValue}>{new Date(asset.purchaseDate).toLocaleDateString()}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Purchase Cost:</Text>
          <Text style={styles.infoValue}>${asset.purchaseCost.toLocaleString()}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Warranty Expiry:</Text>
          <Text style={styles.infoValue}>{new Date(asset.warrantyExpiry).toLocaleDateString()}</Text>
        </View>
      </View>

      {/* Specifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Specifications</Text>
        {Object.entries(asset.specifications).map(([key, value]) => (
          <View key={key} style={styles.infoRow}>
            <Text style={styles.infoLabel}>{key}:</Text>
            <Text style={styles.infoValue}>{value}</Text>
          </View>
        ))}
      </View>

      {/* Maintenance Schedule */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Maintenance Schedule</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Last Maintenance:</Text>
          <Text style={styles.infoValue}>
            {new Date(asset.lastMaintenanceDate).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Next Maintenance:</Text>
          <Text style={[styles.infoValue, styles.highlight]}>
            {new Date(asset.nextMaintenanceDate).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Maintenance History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Maintenance History</Text>
        {asset.maintenanceHistory.map((maintenance) => (
          <View key={maintenance.id} style={styles.maintenanceCard}>
            <View style={styles.maintenanceHeader}>
              <Text style={styles.maintenanceType}>{maintenance.type}</Text>
              <Text style={styles.maintenanceDate}>
                {new Date(maintenance.date).toLocaleDateString()}
              </Text>
            </View>
            <Text style={styles.maintenanceDescription}>{maintenance.description}</Text>
            {maintenance.cost > 0 && (
              <Text style={styles.maintenanceCost}>Cost: ${maintenance.cost}</Text>
            )}
          </View>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionButton, styles.actionButtonPrimary]}>
          <Text style={styles.actionButtonText}>Log Maintenance</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.actionButtonSecondary]}>
          <Text style={styles.actionButtonTextSecondary}>Generate QR Code</Text>
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
  headerCard: {
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
  assetName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  serialNumber: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  model: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
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
  },
  highlight: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  maintenanceCard: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  maintenanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  maintenanceType: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  maintenanceDate: {
    fontSize: 13,
    color: '#666',
  },
  maintenanceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  maintenanceCost: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10b981',
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
});
