import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { apiClient } from '../services/api';
import { v4 as uuidv4 } from 'uuid';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description?: string;
  quantityOnHand: number;
  unit: string;
}

interface InventoryUsage {
  id: string;
  inventoryItemId: string;
  inventoryItem: InventoryItem;
  quantityUsed: number;
  notes?: string;
  createdAt: string;
}

export default function InventoryUsageScreen({ route }: any) {
  const { jobId, jobNumber } = route.params;
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [usageHistory, setUsageHistory] = useState<InventoryUsage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadInventoryItems();
    loadUsageHistory();
  }, []);

  const loadInventoryItems = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/inventory');
      setInventoryItems(response.data.data || []);
    } catch (error) {
      console.error('Failed to load inventory:', error);
      Alert.alert('Error', 'Failed to load inventory items');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsageHistory = async () => {
    try {
      const response = await apiClient.get(`/jobs/${jobId}/inventory-usage`);
      setUsageHistory(response.data.data || []);
    } catch (error) {
      console.error('Failed to load usage history:', error);
    }
  };

  const recordUsage = async () => {
    if (!selectedItemId) {
      Alert.alert('Error', 'Please select an inventory item');
      return;
    }

    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    try {
      const idempotencyKey = uuidv4();
      await apiClient.post(
        `/inventory/${selectedItemId}/usage`,
        {
          jobId,
          quantityUsed: quantityNum,
          notes: notes.trim() || undefined,
        },
        { headers: { 'Idempotency-Key': idempotencyKey } }
      );

      Alert.alert('Success', 'Inventory usage recorded');
      setShowAddModal(false);
      resetForm();
      loadInventoryItems();
      loadUsageHistory();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to record usage');
    }
  };

  const resetForm = () => {
    setSelectedItemId('');
    setQuantity('1');
    setNotes('');
  };

  const selectedItem = inventoryItems.find((item) => item.id === selectedItemId);

  const renderUsageItem = ({ item }: { item: InventoryUsage }) => (
    <View style={styles.usageCard}>
      <View style={styles.usageHeader}>
        <Text style={styles.itemName}>{item.inventoryItem.name}</Text>
        <Text style={styles.quantityBadge}>
          {item.quantityUsed} {item.inventoryItem.unit}
        </Text>
      </View>
      <Text style={styles.sku}>SKU: {item.inventoryItem.sku}</Text>
      {item.notes && <Text style={styles.notes}>{item.notes}</Text>}
      <Text style={styles.timestamp}>
        {new Date(item.createdAt).toLocaleString()}
      </Text>
    </View>
  );

  const renderInventoryItem = ({ item }: { item: InventoryItem }) => (
    <View style={styles.inventoryCard}>
      <View style={styles.inventoryHeader}>
        <View style={styles.inventoryInfo}>
          <Text style={styles.inventoryName}>{item.name}</Text>
          <Text style={styles.inventorySku}>SKU: {item.sku}</Text>
        </View>
        <View style={styles.stockBadge}>
          <Text style={styles.stockText}>
            {item.quantityOnHand} {item.unit}
          </Text>
        </View>
      </View>
      {item.description && (
        <Text style={styles.inventoryDescription}>{item.description}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Inventory Usage</Text>
        <Text style={styles.jobInfo}>Job: {jobNumber}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>+ Record Usage</Text>
        </TouchableOpacity>
      </View>

      {/* Usage History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Usage History</Text>
        {isLoading ? (
          <ActivityIndicator size="large" color="#3b82f6" />
        ) : (
          <FlatList
            data={usageHistory}
            renderItem={renderUsageItem}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No inventory used yet</Text>
            }
          />
        )}
      </View>

      {/* Add Usage Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Record Inventory Usage</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.label}>Select Item:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedItemId}
                onValueChange={(value) => setSelectedItemId(value)}
                style={styles.picker}
              >
                <Picker.Item label="Select an item..." value="" />
                {inventoryItems.map((item) => (
                  <Picker.Item
                    key={item.id}
                    label={`${item.name} (${item.quantityOnHand} ${item.unit})`}
                    value={item.id}
                  />
                ))}
              </Picker>
            </View>

            {selectedItem && (
              <View style={styles.itemDetails}>
                <Text style={styles.itemDetailText}>
                  SKU: {selectedItem.sku}
                </Text>
                <Text style={styles.itemDetailText}>
                  Available: {selectedItem.quantityOnHand} {selectedItem.unit}
                </Text>
              </View>
            )}

            <Text style={styles.label}>Quantity Used:</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              placeholder="Enter quantity"
            />

            <Text style={styles.label}>Notes (Optional):</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes about usage..."
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={[styles.recordButton, !selectedItemId && styles.buttonDisabled]}
              onPress={recordUsage}
              disabled={!selectedItemId}
            >
              <Text style={styles.recordButtonText}>Record Usage</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  jobInfo: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  usageCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  quantityBadge: {
    backgroundColor: '#3b82f6',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  sku: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  notes: {
    fontSize: 14,
    color: '#374151',
    marginTop: 8,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  timestamp: {
    fontSize: 11,
    color: '#9ca3af',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    marginTop: 24,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    fontSize: 24,
    color: '#6b7280',
    paddingHorizontal: 8,
  },
  modalContent: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    marginTop: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
  },
  picker: {
    height: 50,
  },
  itemDetails: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  itemDetailText: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  recordButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  inventoryCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  inventoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inventoryInfo: {
    flex: 1,
  },
  inventoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  inventorySku: {
    fontSize: 11,
    color: '#6b7280',
  },
  stockBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stockText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '600',
  },
  inventoryDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
});
