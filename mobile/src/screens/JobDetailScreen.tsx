import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  Modal,
  Image,
  FlatList,
} from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { useJobs } from '../hooks/use-jobs';
import { getJobPhotos, getJobSignatures, insertJobPhoto, insertJobSignature } from '../services/database';
import { queueJobUpdate } from '../services/sync';
import PhotoCapture from '../components/PhotoCapture';
import SignatureCapture from '../components/SignatureCapture';
import { LocalJobPhoto, LocalJobSignature } from '../types';

export default function JobDetailScreen({ route, navigation }: any) {
  const { jobId } = route.params;
  const { jobs } = useJobs();
  const job = jobs.find((j: any) => j.id === jobId);

  const [photos, setPhotos] = useState<LocalJobPhoto[]>([]);
  const [signatures, setSignatures] = useState<LocalJobSignature[]>([]);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [showSignatureCapture, setShowSignatureCapture] = useState(false);

  useEffect(() => {
    loadPhotosAndSignatures();
  }, [jobId]);

  const loadPhotosAndSignatures = async () => {
    try {
      const jobPhotos = await getJobPhotos(jobId);
      const jobSignatures = await getJobSignatures(jobId);
      setPhotos(jobPhotos);
      setSignatures(jobSignatures);
    } catch (error) {
      console.error('Failed to load photos and signatures:', error);
    }
  };

  if (!job) {
    return (
      <View style={styles.centerContainer}>
        <Text>Job not found</Text>
      </View>
    );
  }

  const handleCheckIn = async () => {
    try {
      await queueJobUpdate(jobId, {
        status: 'IN_PROGRESS',
        startedAt: new Date().toISOString(),
      });
      Alert.alert('Check In', 'Job started successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to check in. Please try again.');
      console.error('Check in failed:', error);
    }
  };

  const handleCheckOut = async () => {
    try {
      await queueJobUpdate(jobId, {
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
      });
      Alert.alert('Check Out', 'Job completed successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to check out. Please try again.');
      console.error('Check out failed:', error);
    }
  };

  const handleAddPhoto = () => {
    setShowPhotoCapture(true);
  };

  const handlePhotoSelected = async (uri: string) => {
    try {
      const photoId = uuidv4();
      await insertJobPhoto({
        id: photoId,
        jobId,
        uri,
        uploaded: false,
        uploadedUrl: null,
        caption: null,
        createdAt: new Date().toISOString(),
      });

      await loadPhotosAndSignatures();
      setShowPhotoCapture(false);
      Alert.alert('Success', 'Photo saved. It will be uploaded when online.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save photo. Please try again.');
      console.error('Failed to save photo:', error);
      throw error;
    }
  };

  const handleSignature = () => {
    setShowSignatureCapture(true);
  };

  const handleSignatureSaved = async (signatureData: string) => {
    try {
      const signatureId = uuidv4();
      await insertJobSignature({
        id: signatureId,
        jobId,
        type: 'CUSTOMER',
        data: signatureData,
        uploaded: false,
        signerName: job.customerName,
        createdAt: new Date().toISOString(),
      });

      await loadPhotosAndSignatures();
      setShowSignatureCapture(false);
      Alert.alert('Success', 'Signature saved. It will be uploaded when online.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save signature. Please try again.');
      console.error('Failed to save signature:', error);
      throw error;
    }
  };

  const handleNavigate = () => {
    if (job.siteAddress) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        job.siteAddress,
      )}`;
      Linking.openURL(url);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.number}>{job.number}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) }]}>
          <Text style={styles.statusText}>{job.status}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        <InfoRow label="Customer" value={job.customerName} />
        <InfoRow label="Title" value={job.title} />
        <InfoRow label="Description" value={job.description || 'N/A'} />
        <InfoRow
          label="Scheduled"
          value={new Date(job.scheduledStart).toLocaleString()}
        />
      </View>

      {job.status === 'SCHEDULED' && (
        <View style={styles.section}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleCheckIn}>
            <Text style={styles.primaryButtonText}>Check In & Start</Text>
          </TouchableOpacity>
        </View>
      )}

      {job.status === 'IN_PROGRESS' && (
        <View style={styles.section}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleCheckOut}>
            <Text style={styles.primaryButtonText}>Check Out & Complete</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleAddPhoto}>
          <Text style={styles.secondaryButtonText}>📷 Add Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleSignature}>
          <Text style={styles.secondaryButtonText}>✍️ Capture Signature</Text>
        </TouchableOpacity>
        {job.siteAddress && (
          <TouchableOpacity style={styles.secondaryButton} onPress={handleNavigate}>
            <Text style={styles.secondaryButtonText}>🗺️ Navigate to Site</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Photos ({photos.length})</Text>
        {photos.length === 0 ? (
          <Text style={styles.placeholder}>No photos yet</Text>
        ) : (
          <FlatList
            horizontal
            data={photos}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.photoContainer}>
                <Image source={{ uri: item.uri }} style={styles.photo} />
                {!item.uploaded && (
                  <View style={styles.photoStatusBadge}>
                    <Text style={styles.photoStatusText}>Pending Upload</Text>
                  </View>
                )}
              </View>
            )}
            contentContainerStyle={styles.photoList}
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Signatures ({signatures.length})</Text>
        {signatures.length === 0 ? (
          <Text style={styles.placeholder}>No signatures yet</Text>
        ) : (
          <FlatList
            data={signatures}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.signatureRow}>
                <View style={styles.signatureInfo}>
                  <Text style={styles.signatureType}>
                    {item.type === 'CUSTOMER' ? '✍️ Customer' : '✍️ Technician'}
                  </Text>
                  {item.signerName && (
                    <Text style={styles.signerName}>{item.signerName}</Text>
                  )}
                  <Text style={styles.signatureDate}>
                    {new Date(item.createdAt).toLocaleString()}
                  </Text>
                </View>
                {!item.uploaded && (
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingText}>Pending</Text>
                  </View>
                )}
              </View>
            )}
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Time Entries</Text>
        <Text style={styles.placeholder}>No time entries yet</Text>
      </View>

      <Modal
        visible={showPhotoCapture}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <PhotoCapture
          onPhotoSelected={handlePhotoSelected}
          onCancel={() => setShowPhotoCapture(false)}
        />
      </Modal>

      <Modal
        visible={showSignatureCapture}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SignatureCapture
          onSignatureSaved={handleSignatureSaved}
          onCancel={() => setShowSignatureCapture(false)}
          signatureType="CUSTOMER"
          customerName={job.customerName}
        />
      </Modal>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'SCHEDULED':
      return '#3b82f6';
    case 'IN_PROGRESS':
      return '#f59e0b';
    case 'COMPLETED':
      return '#10b981';
    default:
      return '#6b7280';
  }
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
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  number: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
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
    marginTop: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    color: '#6b7280',
  },
  infoValue: {
    flex: 2,
    fontSize: 14,
    color: '#1f2937',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  secondaryButtonText: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '500',
  },
  placeholder: {
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  photoList: {
    gap: 12,
  },
  photoContainer: {
    position: 'relative',
    marginRight: 12,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  photoStatusBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(251, 191, 36, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  photoStatusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  signatureInfo: {
    flex: 1,
  },
  signatureType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  signerName: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  signatureDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  pendingBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  pendingText: {
    color: '#d97706',
    fontSize: 12,
    fontWeight: '600',
  },
});
