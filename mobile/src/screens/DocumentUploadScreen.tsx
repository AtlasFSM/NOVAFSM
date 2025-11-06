import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { v4 as uuidv4 } from 'uuid';
import { insertDocument, getPendingDocuments } from '../services/database';
import { DocumentType, SyncStatus } from '../types';

export default function DocumentUploadScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedType, setSelectedType] = useState<DocumentType>(DocumentType.OTHER);
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    mimeType: string;
    size: number;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera roll permission is required to select photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedFile({
        uri: asset.uri,
        name: asset.uri.split('/').pop() || 'image.jpg',
        mimeType: 'image/jpeg',
        size: asset.fileSize || 0,
      });
      setName(asset.uri.split('/').pop() || 'image.jpg');
      setSelectedType(DocumentType.PHOTO);
    }
  };

  const handlePickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets[0]) {
      const doc = result.assets[0];
      setSelectedFile({
        uri: doc.uri,
        name: doc.name,
        mimeType: doc.mimeType || 'application/octet-stream',
        size: doc.size || 0,
      });
      setName(doc.name);
    }
  };

  const handleSave = async () => {
    if (!selectedFile) {
      Alert.alert('Error', 'Please select a file to upload');
      return;
    }

    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name for the document');
      return;
    }

    try {
      setIsUploading(true);

      // Create document record in local database
      const document = {
        id: uuidv4(),
        tenantId: 'local', // Will be set from auth context
        name: name.trim(),
        type: selectedType,
        mimeType: selectedFile.mimeType,
        size: selectedFile.size,
        uri: selectedFile.uri,
        uploaded: false,
        uploadedUrl: null,
        jobId: null,
        assetId: null,
        description: description.trim() || null,
        syncStatus: SyncStatus.PENDING,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await insertDocument(document);

      Alert.alert('Success', 'Document added and will be uploaded when online', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Failed to save document:', error);
      Alert.alert('Error', 'Failed to save document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select File</Text>
        <View style={styles.fileButtons}>
          <TouchableOpacity style={styles.fileButton} onPress={handlePickImage}>
            <Text style={styles.fileButtonText}>📷 Photo Library</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.fileButton} onPress={handlePickDocument}>
            <Text style={styles.fileButtonText}>📁 Browse Files</Text>
          </TouchableOpacity>
        </View>

        {selectedFile && (
          <View style={styles.selectedFile}>
            <Text style={styles.selectedFileText}>Selected: {selectedFile.name}</Text>
            <Text style={styles.selectedFileMeta}>
              {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.mimeType}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Document Type</Text>
        <View style={styles.typeButtons}>
          {Object.values(DocumentType).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                selectedType === type && styles.typeButtonActive,
              ]}
              onPress={() => setSelectedType(type)}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  selectedType === type && styles.typeButtonTextActive,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter document name"
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Description (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Enter description"
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.saveButton, isUploading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isUploading}
        >
          {isUploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Document</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  fileButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  fileButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  fileButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  selectedFile: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  selectedFileText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  selectedFileMeta: {
    fontSize: 12,
    color: '#6b7280',
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  typeButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
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
  textArea: {
    minHeight: 100,
  },
  saveButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
