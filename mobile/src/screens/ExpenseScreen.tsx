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
  Image,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { apiClient } from '../services/api';
import { v4 as uuidv4 } from 'uuid';

interface ExpenseEntry {
  id: string;
  type: 'MILEAGE' | 'MATERIALS' | 'MEALS' | 'OTHER';
  amount: number;
  description?: string;
  receiptUrl?: string;
  createdAt: string;
}

export default function ExpenseScreen({ route }: any) {
  const { jobId, jobNumber } = route.params;
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [expenseType, setExpenseType] = useState<'MILEAGE' | 'MATERIALS' | 'MEALS' | 'OTHER'>(
    'MATERIALS'
  );
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/expense-entries`, {
        params: { jobId },
      });
      setExpenses(response.data.data || []);
    } catch (error) {
      console.error('Failed to load expenses:', error);
      Alert.alert('Error', 'Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setReceiptImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Permission to access camera is required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setReceiptImage(result.assets[0].uri);
    }
  };

  const uploadReceipt = async (): Promise<string | undefined> => {
    if (!receiptImage) return undefined;

    try {
      // Get presigned URL
      const presignedResponse = await apiClient.post('/files/presigned-upload', {
        fileName: `receipt-${Date.now()}.jpg`,
        fileType: 'image/jpeg',
        folder: 'receipts',
      });

      const { url, key } = presignedResponse.data;

      // Upload to S3
      const response = await fetch(receiptImage);
      const blob = await response.blob();

      await fetch(url, {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-Type': 'image/jpeg',
        },
      });

      return key;
    } catch (error) {
      console.error('Failed to upload receipt:', error);
      throw new Error('Failed to upload receipt');
    }
  };

  const submitExpense = async () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      setIsSubmitting(true);

      // Upload receipt if present
      let receiptKey: string | undefined;
      if (receiptImage) {
        receiptKey = await uploadReceipt();
      }

      // Create expense entry
      const idempotencyKey = uuidv4();
      await apiClient.post(
        '/expense-entries',
        {
          jobId,
          type: expenseType,
          amount: amountNum,
          description: description.trim() || undefined,
          receiptUrl: receiptKey,
        },
        { headers: { 'Idempotency-Key': idempotencyKey } }
      );

      Alert.alert('Success', 'Expense recorded successfully');
      setShowAddModal(false);
      resetForm();
      loadExpenses();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to record expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setExpenseType('MATERIALS');
    setAmount('');
    setDescription('');
    setReceiptImage(null);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'MILEAGE':
        return '#3b82f6';
      case 'MATERIALS':
        return '#10b981';
      case 'MEALS':
        return '#f59e0b';
      case 'OTHER':
        return '#6b7280';
      default:
        return '#8b5cf6';
    }
  };

  const renderExpense = ({ item }: { item: ExpenseEntry }) => (
    <View style={styles.expenseCard}>
      <View style={styles.expenseHeader}>
        <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type) }]}>
          <Text style={styles.typeText}>{item.type}</Text>
        </View>
        <Text style={styles.amountText}>${item.amount.toFixed(2)}</Text>
      </View>
      {item.description && <Text style={styles.description}>{item.description}</Text>}
      {item.receiptUrl && (
        <View style={styles.receiptBadge}>
          <Text style={styles.receiptText}>📎 Receipt attached</Text>
        </View>
      )}
      <Text style={styles.timestamp}>{new Date(item.createdAt).toLocaleString()}</Text>
    </View>
  );

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Expenses</Text>
        <Text style={styles.jobInfo}>Job: {jobNumber}</Text>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Expenses</Text>
          <Text style={styles.totalAmount}>${totalExpenses.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>+ Add Expense</Text>
        </TouchableOpacity>
      </View>

      {/* Expenses List */}
      <View style={styles.section}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#3b82f6" />
        ) : (
          <FlatList
            data={expenses}
            renderItem={renderExpense}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No expenses recorded yet</Text>
            }
          />
        )}
      </View>

      {/* Add Expense Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Expense</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.label}>Expense Type:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={expenseType}
                onValueChange={(value) => setExpenseType(value)}
                style={styles.picker}
              >
                <Picker.Item label="Materials" value="MATERIALS" />
                <Picker.Item label="Mileage" value="MILEAGE" />
                <Picker.Item label="Meals" value="MEALS" />
                <Picker.Item label="Other" value="OTHER" />
              </Picker>
            </View>

            <Text style={styles.label}>Amount ($):</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />

            <Text style={styles.label}>Description (Optional):</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add details..."
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Receipt (Optional):</Text>
            <View style={styles.receiptSection}>
              {receiptImage ? (
                <View style={styles.receiptPreview}>
                  <Image source={{ uri: receiptImage }} style={styles.receiptImage} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => setReceiptImage(null)}
                  >
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.receiptButtons}>
                  <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                    <Text style={styles.photoButtonText}>📷 Take Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                    <Text style={styles.photoButtonText}>🖼 Choose from Library</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
              onPress={submitExpense}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Submitting...' : 'Submit Expense'}
              </Text>
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
  totalCard: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
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
  expenseCard: {
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
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  description: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  receiptBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  receiptText: {
    fontSize: 11,
    color: '#6b7280',
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
  receiptSection: {
    marginBottom: 16,
  },
  receiptButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  photoButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  receiptPreview: {
    alignItems: 'center',
  },
  receiptImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  removeButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
