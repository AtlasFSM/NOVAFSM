import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useForm } from '../hooks/use-forms';
import { upsertForm } from '../services/database';
import { FormStatus, FormField } from '../types';

export default function FormDetailScreen({ route, navigation }: any) {
  const { formId } = route.params;
  const { form, isLoading, updateFormStatus } = useForm(formId);
  const [fields, setFields] = useState<FormField[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (form) {
      setFields(form.fields);
    }
  }, [form]);

  const handleFieldChange = (fieldId: string, value: string) => {
    setFields((prev) =>
      prev.map((field) =>
        field.id === fieldId ? { ...field, value } : field
      )
    );
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      if (!form) return;

      // Validate required fields
      const missingRequired = fields.filter(
        (f) => f.required && (!f.value || f.value.trim() === '')
      );

      if (missingRequired.length > 0) {
        Alert.alert(
          'Validation Error',
          `Please fill in all required fields: ${missingRequired.map((f) => f.label).join(', ')}`
        );
        return;
      }

      // Update form in database
      await upsertForm({
        ...form,
        fields,
        updatedAt: new Date().toISOString(),
      });

      Alert.alert('Success', 'Form saved successfully');
    } catch (error) {
      console.error('Failed to save form:', error);
      Alert.alert('Error', 'Failed to save form. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!form) return;

      // Validate required fields
      const missingRequired = fields.filter(
        (f) => f.required && (!f.value || f.value.trim() === '')
      );

      if (missingRequired.length > 0) {
        Alert.alert(
          'Validation Error',
          `Please fill in all required fields: ${missingRequired.map((f) => f.label).join(', ')}`
        );
        return;
      }

      setIsSaving(true);

      // Save fields first
      await upsertForm({
        ...form,
        fields,
        updatedAt: new Date().toISOString(),
      });

      // Update status to submitted
      await updateFormStatus(FormStatus.SUBMITTED);

      Alert.alert('Success', 'Form submitted successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Failed to submit form:', error);
      Alert.alert('Error', 'Failed to submit form. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !form) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const getStatusColor = (status: FormStatus) => {
    switch (status) {
      case FormStatus.DRAFT:
        return '#6b7280';
      case FormStatus.SUBMITTED:
        return '#3b82f6';
      case FormStatus.APPROVED:
        return '#10b981';
      case FormStatus.REJECTED:
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const canEdit = form.status === FormStatus.DRAFT;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.templateName}>{form.templateName}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(form.status) }]}>
          <Text style={styles.statusText}>{form.status}</Text>
        </View>
      </View>

      <View style={styles.section}>
        {fields.map((field) => (
          <View key={field.id} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              {field.label}
              {field.required && <Text style={styles.required}> *</Text>}
            </Text>

            {field.type === 'checkbox' ? (
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() =>
                  canEdit && handleFieldChange(field.id, field.value === 'true' ? 'false' : 'true')
                }
                disabled={!canEdit}
              >
                <View style={[
                  styles.checkboxBox,
                  field.value === 'true' && styles.checkboxBoxChecked,
                  !canEdit && styles.checkboxDisabled,
                ]}>
                  {field.value === 'true' && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Yes</Text>
              </TouchableOpacity>
            ) : field.type === 'signature' ? (
              <View style={styles.signatureContainer}>
                <Text style={styles.signaturePlaceholder}>
                  {field.value ? 'Signature captured' : 'Tap to sign'}
                </Text>
              </View>
            ) : (
              <TextInput
                style={[
                  styles.input,
                  field.type === 'text' && { minHeight: 40 },
                  !canEdit && styles.inputDisabled,
                ]}
                value={field.value || ''}
                onChangeText={(text) => canEdit && handleFieldChange(field.id, text)}
                placeholder={`Enter ${field.label.toLowerCase()}`}
                placeholderTextColor="#9ca3af"
                keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                multiline={field.type === 'text'}
                editable={canEdit}
              />
            )}
          </View>
        ))}
      </View>

      {canEdit && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Save Draft</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.submitButton]}
            onPress={handleSubmit}
            disabled={isSaving}
          >
            <Text style={styles.buttonText}>Submit Form</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.metadata}>
        <Text style={styles.metadataText}>
          Created: {new Date(form.createdAt).toLocaleString()}
        </Text>
        <Text style={styles.metadataText}>
          Last Updated: {new Date(form.updatedAt).toLocaleString()}
        </Text>
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
  templateName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
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
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inputDisabled: {
    backgroundColor: '#f9fafb',
    color: '#6b7280',
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxBoxChecked: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  checkboxDisabled: {
    opacity: 0.5,
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#1f2937',
  },
  signatureContainer: {
    height: 120,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  signaturePlaceholder: {
    fontSize: 14,
    color: '#9ca3af',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#6b7280',
  },
  submitButton: {
    backgroundColor: '#10b981',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  metadata: {
    padding: 16,
  },
  metadataText: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
});
