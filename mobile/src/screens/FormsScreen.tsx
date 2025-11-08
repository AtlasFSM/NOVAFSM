import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';

interface FormField {
  id: string;
  type: 'TEXT' | 'CHECKBOX' | 'NUMBER' | 'SELECT';
  label: string;
  required: boolean;
  options?: string[];
}

interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  fields: FormField[];
  isActive: boolean;
}

interface FormResponse {
  id: string;
  templateId: string;
  templateName: string;
  relatedTo?: {
    type: 'JOB' | 'ASSET' | 'CUSTOMER';
    id: string;
    name: string;
  };
  responses: Record<string, any>;
  completedBy: string;
  completedAt: string;
  syncStatus?: 'synced' | 'pending';
}

export default function FormsScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<'templates' | 'responses'>('templates');
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });
    loadData();
    return unsubscribe;
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual API calls
      const mockTemplates: FormTemplate[] = [
        {
          id: '1',
          name: 'HVAC Inspection Checklist',
          description: 'Standard inspection form for HVAC systems',
          category: 'INSPECTION',
          isActive: true,
          fields: [
            { id: 'f1', type: 'CHECKBOX', label: 'Air filter checked', required: true },
            { id: 'f2', type: 'CHECKBOX', label: 'Thermostat functioning', required: true },
            { id: 'f3', type: 'NUMBER', label: 'Temperature reading (°C)', required: true },
            { id: 'f4', type: 'SELECT', label: 'System condition', required: true, options: ['Good', 'Fair', 'Poor'] },
            { id: 'f5', type: 'TEXT', label: 'Additional notes', required: false },
          ],
        },
        {
          id: '2',
          name: 'Safety Checklist',
          description: 'Pre-job safety inspection',
          category: 'SAFETY',
          isActive: true,
          fields: [
            { id: 's1', type: 'CHECKBOX', label: 'PPE available', required: true },
            { id: 's2', type: 'CHECKBOX', label: 'Work area secured', required: true },
            { id: 's3', type: 'CHECKBOX', label: 'Emergency exits identified', required: true },
            { id: 's4', type: 'TEXT', label: 'Hazards identified', required: false },
          ],
        },
        {
          id: '3',
          name: 'Customer Satisfaction Survey',
          description: 'Post-job customer feedback',
          category: 'FEEDBACK',
          isActive: true,
          fields: [
            { id: 'cs1', type: 'SELECT', label: 'Overall satisfaction', required: true, options: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied'] },
            { id: 'cs2', type: 'SELECT', label: 'Technician professionalism', required: true, options: ['Excellent', 'Good', 'Fair', 'Poor'] },
            { id: 'cs3', type: 'TEXT', label: 'Comments', required: false },
          ],
        },
      ];

      const mockResponses: FormResponse[] = [
        {
          id: '1',
          templateId: '1',
          templateName: 'HVAC Inspection Checklist',
          relatedTo: {
            type: 'JOB',
            id: 'job1',
            name: 'J-2024-001',
          },
          responses: {
            f1: true,
            f2: true,
            f3: '22',
            f4: 'Good',
            f5: 'System running smoothly',
          },
          completedBy: 'John Smith',
          completedAt: '2024-11-08T14:30:00Z',
          syncStatus: 'synced',
        },
        {
          id: '2',
          templateId: '2',
          templateName: 'Safety Checklist',
          relatedTo: {
            type: 'JOB',
            id: 'job1',
            name: 'J-2024-001',
          },
          responses: {
            s1: true,
            s2: true,
            s3: true,
            s4: 'None identified',
          },
          completedBy: 'John Smith',
          completedAt: '2024-11-08T08:00:00Z',
          syncStatus: 'synced',
        },
      ];

      setTemplates(mockTemplates);
      setResponses(mockResponses);
    } catch (error) {
      console.error('Failed to load forms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleStartForm = (template: FormTemplate) => {
    setSelectedTemplate(template);
    setFormValues({});
    setShowFormModal(true);
  };

  const handleSubmitForm = () => {
    if (!selectedTemplate) return;

    // Validate required fields
    const missingRequired = selectedTemplate.fields
      .filter(f => f.required && !formValues[f.id])
      .map(f => f.label);

    if (missingRequired.length > 0) {
      alert(`Please fill in required fields: ${missingRequired.join(', ')}`);
      return;
    }

    const newResponse: FormResponse = {
      id: Date.now().toString(),
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.name,
      responses: formValues,
      completedBy: 'Current User',
      completedAt: new Date().toISOString(),
      syncStatus: 'pending',
    };

    setResponses([newResponse, ...responses]);
    setShowFormModal(false);
    setSelectedTemplate(null);
    setFormValues({});

    // Simulate sync
    setTimeout(() => {
      setResponses(resps =>
        resps.map(r =>
          r.id === newResponse.id
            ? { ...r, syncStatus: 'synced' as const }
            : r
        )
      );
    }, 2000);
  };

  const renderTemplate = ({ item }: { item: FormTemplate }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleStartForm(item)}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>{item.name}</Text>
          {item.description && (
            <Text style={styles.cardDescription}>{item.description}</Text>
          )}
        </View>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.fieldCount}>{item.fields.length} fields</Text>
        <Text style={styles.startButton}>Start →</Text>
      </View>
    </TouchableOpacity>
  );

  const renderResponse = ({ item }: { item: FormResponse }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('FormResponseDetail', { responseId: item.id })}
    >
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.templateName}</Text>
          {item.relatedTo && (
            <Text style={styles.relatedTo}>
              {item.relatedTo.type}: {item.relatedTo.name}
            </Text>
          )}
        </View>
        {item.syncStatus === 'pending' && (
          <Text style={styles.syncPending}>⏱ Pending</Text>
        )}
      </View>
      <View style={styles.responseDetails}>
        <Text style={styles.completedBy}>By: {item.completedBy}</Text>
        <Text style={styles.completedAt}>
          {new Date(item.completedAt).toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading forms...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Forms & Checklists</Text>
        <View style={styles.statusIndicator}>
          <View style={[styles.onlineIndicator, { backgroundColor: isOnline ? '#10b981' : '#ef4444' }]} />
          <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'templates' && styles.activeTab]}
          onPress={() => setActiveTab('templates')}
        >
          <Text style={[styles.tabText, activeTab === 'templates' && styles.activeTabText]}>
            Templates ({templates.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'responses' && styles.activeTab]}
          onPress={() => setActiveTab('responses')}
        >
          <Text style={[styles.tabText, activeTab === 'responses' && styles.activeTabText]}>
            My Responses ({responses.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === 'templates' ? templates : responses}
        renderItem={activeTab === 'templates' ? renderTemplate : renderResponse}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {activeTab === 'templates' ? 'No form templates available' : 'No form responses yet'}
            </Text>
          </View>
        }
      />

      {/* Form Modal */}
      <Modal
        visible={showFormModal}
        animationType="slide"
        onRequestClose={() => setShowFormModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedTemplate?.name}</Text>
            <TouchableOpacity onPress={() => setShowFormModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContent}>
            {selectedTemplate?.fields.map((field) => (
              <View key={field.id} style={styles.formField}>
                <Text style={styles.fieldLabel}>
                  {field.label}
                  {field.required && <Text style={styles.required}> *</Text>}
                </Text>

                {field.type === 'TEXT' && (
                  <TextInput
                    style={styles.textInput}
                    value={formValues[field.id] || ''}
                    onChangeText={(value) =>
                      setFormValues({ ...formValues, [field.id]: value })
                    }
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                )}

                {field.type === 'NUMBER' && (
                  <TextInput
                    style={styles.textInput}
                    value={formValues[field.id] || ''}
                    onChangeText={(value) =>
                      setFormValues({ ...formValues, [field.id]: value })
                    }
                    keyboardType="numeric"
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                )}

                {field.type === 'CHECKBOX' && (
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() =>
                      setFormValues({
                        ...formValues,
                        [field.id]: !formValues[field.id],
                      })
                    }
                  >
                    <View style={[styles.checkbox, formValues[field.id] && styles.checkboxChecked]}>
                      {formValues[field.id] && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.checkboxLabel}>Yes</Text>
                  </TouchableOpacity>
                )}

                {field.type === 'SELECT' && field.options && (
                  <View style={styles.selectContainer}>
                    {field.options.map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.selectOption,
                          formValues[field.id] === option && styles.selectOptionSelected,
                        ]}
                        onPress={() =>
                          setFormValues({ ...formValues, [field.id]: option })
                        }
                      >
                        <Text
                          style={[
                            styles.selectOptionText,
                            formValues[field.id] === option && styles.selectOptionTextSelected,
                          ]}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmitForm}
            >
              <Text style={styles.submitButtonText}>Submit Form</Text>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  categoryBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  startButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  relatedTo: {
    fontSize: 13,
    color: '#3b82f6',
    marginTop: 4,
  },
  responseDetails: {
    gap: 4,
  },
  completedBy: {
    fontSize: 14,
    color: '#6b7280',
  },
  completedAt: {
    fontSize: 13,
    color: '#9ca3af',
  },
  syncPending: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
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
    color: '#111827',
  },
  closeButton: {
    fontSize: 24,
    color: '#6b7280',
  },
  formContent: {
    flex: 1,
    padding: 16,
  },
  formField: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#111827',
  },
  selectContainer: {
    gap: 8,
  },
  selectOption: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
  },
  selectOptionSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  selectOptionText: {
    fontSize: 16,
    color: '#111827',
  },
  selectOptionTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
