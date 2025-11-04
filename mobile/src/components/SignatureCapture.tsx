import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import SignatureScreen from 'react-native-signature-canvas';

interface SignatureCaptureProps {
  onSignatureSaved: (signature: string) => Promise<void>;
  onCancel: () => void;
  signatureType?: 'CUSTOMER' | 'TECHNICIAN';
  customerName?: string;
}

export default function SignatureCapture({
  onSignatureSaved,
  onCancel,
  signatureType = 'CUSTOMER',
  customerName,
}: SignatureCaptureProps) {
  const signatureRef = useRef<any>(null);
  const [saving, setSaving] = useState(false);

  const handleSignature = async (signature: string) => {
    try {
      setSaving(true);
      await onSignatureSaved(signature);
    } catch (error) {
      Alert.alert('Error', 'Failed to save signature. Please try again.');
      console.error('Error saving signature:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    signatureRef.current?.clearSignature();
  };

  const handleConfirm = () => {
    signatureRef.current?.readSignature();
  };

  const handleEmpty = () => {
    Alert.alert('Empty Signature', 'Please provide a signature before confirming.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {signatureType === 'CUSTOMER' ? 'Customer Signature' : 'Technician Signature'}
        </Text>
        <TouchableOpacity onPress={onCancel} disabled={saving}>
          <Text style={[styles.cancelText, saving && styles.disabledText]}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {customerName && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Customer:</Text>
          <Text style={styles.infoValue}>{customerName}</Text>
        </View>
      )}

      <View style={styles.instructionContainer}>
        <Text style={styles.instructionText}>
          {signatureType === 'CUSTOMER'
            ? 'Please ask the customer to sign below'
            : 'Please sign below'}
        </Text>
      </View>

      <View style={styles.signatureContainer}>
        <SignatureScreen
          ref={signatureRef}
          onOK={handleSignature}
          onEmpty={handleEmpty}
          descriptionText=""
          clearText="Clear"
          confirmText="Confirm"
          webStyle={`.m-signature-pad {
            box-shadow: none;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
          }
          .m-signature-pad--body {
            border: none;
          }
          .m-signature-pad--footer {
            display: none;
          }`}
        />
      </View>

      {saving && (
        <View style={styles.savingOverlay}>
          <View style={styles.savingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.savingText}>Saving signature...</Text>
          </View>
        </View>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.secondaryButton, saving && styles.disabledButton]}
          onPress={handleClear}
          disabled={saving}
        >
          <Text style={styles.secondaryButtonText}>Clear</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryButton, saving && styles.disabledButton]}
          onPress={handleConfirm}
          disabled={saving}
        >
          <Text style={styles.primaryButtonText}>
            {saving ? 'Saving...' : 'Confirm'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          By signing above, you acknowledge that the work has been completed as described.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  cancelText: {
    fontSize: 16,
    color: '#3b82f6',
  },
  disabledText: {
    opacity: 0.5,
  },
  infoContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginRight: 8,
  },
  infoValue: {
    fontSize: 14,
    color: '#1f2937',
  },
  instructionContainer: {
    padding: 16,
    backgroundColor: '#eff6ff',
    borderBottomWidth: 1,
    borderBottomColor: '#dbeafe',
  },
  instructionText: {
    fontSize: 14,
    color: '#1e40af',
    textAlign: 'center',
  },
  signatureContainer: {
    flex: 1,
    margin: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  savingContainer: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  savingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#1f2937',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disclaimer: {
    padding: 16,
    paddingTop: 0,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 18,
  },
});
