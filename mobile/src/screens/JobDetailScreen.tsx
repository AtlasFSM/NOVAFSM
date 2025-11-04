import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { useJobs } from '../hooks/use-jobs';

export default function JobDetailScreen({ route, navigation }: any) {
  const { jobId } = route.params;
  const { jobs } = useJobs();
  const job = jobs.find((j: any) => j.id === jobId);

  if (!job) {
    return (
      <View style={styles.centerContainer}>
        <Text>Job not found</Text>
      </View>
    );
  }

  const handleCheckIn = () => {
    // TODO: Get current location and update job status
    Alert.alert('Check In', 'Location recorded. Job started.');
  };

  const handleCheckOut = () => {
    Alert.alert('Check Out', 'Location recorded. Job completed.');
  };

  const handleAddPhoto = () => {
    Alert.alert('Add Photo', 'Camera/gallery picker would open here');
  };

  const handleSignature = () => {
    Alert.alert('Signature', 'Signature capture would open here');
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
        <Text style={styles.sectionTitle}>Photos</Text>
        <Text style={styles.placeholder}>No photos yet</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Time Entries</Text>
        <Text style={styles.placeholder}>No time entries yet</Text>
      </View>
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
});
