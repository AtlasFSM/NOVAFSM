import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'checkbox' | 'select';
  value: any;
  required: boolean;
  options?: string[];
}

export default function FormResponseDetailScreen({ navigation }: any) {
  const route = useRoute();
  const { responseId } = route.params as { responseId: string };

  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Mock data - replace with actual API call
  const [response, setResponse] = useState({
    id: responseId,
    templateName: 'Safety Inspection Form',
    jobNumber: 'JOB-2024-001234',
    status: 'DRAFT', // DRAFT, SUBMITTED
    submittedAt: null as string | null,
    fields: [
      { id: '1', label: 'Equipment Condition', type: 'select', value: 'Good', required: true, options: ['Excellent', 'Good', 'Fair', 'Poor'] },
      { id: '2', label: 'Safety Issues Found', type: 'checkbox', value: false, required: false },
      { id: '3', label: 'Notes', type: 'text', value: 'All equipment in good working order', required: false },
      { id: '4', label: 'Temperature Reading', type: 'number', value: '22', required: true },
    ] as FormField[],
  });

  const handleFieldChange = (fieldId: string, value: any) => {
    setResponse(prev => ({
      ...prev,
      fields: prev.fields.map(f =>
        f.id === fieldId ? { ...f, value } : f
      ),
    }));
  };

  const handleSubmit = () => {
    setLoading(true);
    // TODO: Implement actual API call
    setTimeout(() => {
      setResponse(prev => ({ ...prev, status: 'SUBMITTED', submittedAt: new Date().toISOString() }));
      setLoading(false);
      setIsEditing(false);
    }, 1000);
  };

  const renderField = (field: FormField) => {
    const isDisabled = response.status === 'SUBMITTED' && !isEditing;

    switch (field.type) {
      case 'text':
        return (
          <TextInput
            style={[styles.textInput, isDisabled && styles.disabledInput]}
            value={field.value || ''}
            onChangeText={(text) => handleFieldChange(field.id, text)}
            editable={!isDisabled}
            multiline
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );

      case 'number':
        return (
          <TextInput
            style={[styles.textInput, isDisabled && styles.disabledInput]}
            value={field.value?.toString() || ''}
            onChangeText={(text) => handleFieldChange(field.id, text)}
            editable={!isDisabled}
            keyboardType="numeric"
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );

      case 'checkbox':
        return (
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => handleFieldChange(field.id, !field.value)}
            disabled={isDisabled}
          >
            <View style={[styles.checkbox, field.value && styles.checkboxChecked]}>
              {field.value && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Yes</Text>
          </TouchableOpacity>
        );

      case 'select':
        return (
          <View style={styles.selectContainer}>
            {field.options?.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.selectOption,
                  field.value === option && styles.selectOptionSelected,
                ]}
                onPress={() => handleFieldChange(field.id, option)}
                disabled={isDisabled}
              >
                <Text style={[
                  styles.selectOptionText,
                  field.value === option && styles.selectOptionTextSelected,
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{response.templateName}</Text>
          <Text style={styles.subtitle}>Job: {response.jobNumber}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          response.status === 'SUBMITTED' ? styles.statusSubmitted : styles.statusDraft
        ]}>
          <Text style={styles.statusText}>{response.status}</Text>
        </View>
      </View>

      {response.submittedAt && (
        <View style={styles.submittedInfo}>
          <Text style={styles.submittedText}>
            Submitted: {new Date(response.submittedAt).toLocaleString()}
          </Text>
        </View>
      )}

      {/* Form Fields */}
      <ScrollView style={styles.formContainer}>
        {response.fields.map((field) => (
          <View key={field.id} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              {field.label}
              {field.required && <Text style={styles.required}> *</Text>}
            </Text>
            {renderField(field)}
          </View>
        ))}
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        {response.status === 'DRAFT' ? (
          <>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.buttonSecondaryText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonPrimaryText}>Submit</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary, { flex: 1 }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonPrimaryText}>Close</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDraft: {
    backgroundColor: '#f59e0b',
  },
  statusSubmitted: {
    backgroundColor: '#10b981',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  submittedInfo: {
    backgroundColor: '#e0f2fe',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#bae6fd',
  },
  submittedText: {
    color: '#0369a1',
    fontSize: 14,
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
  fieldContainer: {
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
    minHeight: 44,
  },
  disabledInput: {
    backgroundColor: '#f9fafb',
    color: '#6b7280',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  selectOptionSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  selectOptionText: {
    fontSize: 14,
    color: '#333',
  },
  selectOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#3b82f6',
  },
  buttonPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  buttonSecondaryText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
});
