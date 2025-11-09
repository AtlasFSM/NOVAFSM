import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuthStore } from '../store/auth-store';
import { apiClient } from '../services/api';
import { v4 as uuidv4 } from 'uuid';

interface TimeEntry {
  id: string;
  type: 'WORK' | 'TRAVEL' | 'BREAK';
  startedAt: string;
  endedAt?: string;
  duration?: number;
  jobId?: string;
  jobNumber?: string;
}

export default function TimeEntryScreen({ route }: any) {
  const { jobId, jobNumber } = route.params || {};
  const { user } = useAuthStore();
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [entryType, setEntryType] = useState<'WORK' | 'TRAVEL' | 'BREAK'>('WORK');
  const [isLoading, setIsLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    loadTimeEntries();
  }, [jobId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeEntry) {
      interval = setInterval(() => {
        const started = new Date(activeEntry.startedAt).getTime();
        const now = Date.now();
        setElapsedSeconds(Math.floor((now - started) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeEntry]);

  const loadTimeEntries = async () => {
    try {
      setIsLoading(true);
      const params = jobId ? { jobId } : {};
      const response = await apiClient.get('/time-entries', { params });
      setEntries(response.data.data || []);

      // Check if there's an active entry
      const active = response.data.data?.find((e: TimeEntry) => !e.endedAt);
      if (active) {
        setActiveEntry(active);
        setEntryType(active.type);
      }
    } catch (error) {
      console.error('Failed to load time entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startTimer = async () => {
    try {
      const idempotencyKey = uuidv4();
      const newEntry: Partial<TimeEntry> = {
        type: entryType,
        startedAt: new Date().toISOString(),
        jobId: jobId || undefined,
      };

      const response = await apiClient.post('/time-entries', newEntry, {
        headers: { 'Idempotency-Key': idempotencyKey },
      });

      setActiveEntry(response.data);
      setElapsedSeconds(0);
      Alert.alert('Success', 'Time tracking started');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to start timer');
    }
  };

  const stopTimer = async () => {
    if (!activeEntry) return;

    try {
      const idempotencyKey = uuidv4();
      const response = await apiClient.patch(
        `/time-entries/${activeEntry.id}`,
        { endedAt: new Date().toISOString() },
        { headers: { 'Idempotency-Key': idempotencyKey } }
      );

      setActiveEntry(null);
      setElapsedSeconds(0);
      loadTimeEntries();
      Alert.alert('Success', `Time entry saved: ${formatDuration(response.data.duration)}`);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to stop timer');
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatElapsedTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'WORK':
        return '#10b981';
      case 'TRAVEL':
        return '#3b82f6';
      case 'BREAK':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const renderTimeEntry = ({ item }: { item: TimeEntry }) => (
    <View style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type) }]}>
          <Text style={styles.typeText}>{item.type}</Text>
        </View>
        <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
      </View>
      <Text style={styles.timeText}>
        {new Date(item.startedAt).toLocaleString()} -{' '}
        {item.endedAt ? new Date(item.endedAt).toLocaleString() : 'In Progress'}
      </Text>
      {item.jobNumber && (
        <Text style={styles.jobText}>Job: {item.jobNumber}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Timer Section */}
      <View style={styles.timerSection}>
        <Text style={styles.title}>Time Tracker</Text>
        {jobNumber && <Text style={styles.jobInfo}>Job: {jobNumber}</Text>}

        {activeEntry ? (
          <View style={styles.activeTimer}>
            <Text style={styles.timerDisplay}>{formatElapsedTime(elapsedSeconds)}</Text>
            <View style={[styles.typeBadge, { backgroundColor: getTypeColor(activeEntry.type) }]}>
              <Text style={styles.typeText}>{activeEntry.type}</Text>
            </View>
            <TouchableOpacity style={styles.stopButton} onPress={stopTimer}>
              <Text style={styles.stopButtonText}>⏹ Stop Timer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.startSection}>
            <Text style={styles.label}>Entry Type:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={entryType}
                onValueChange={(value) => setEntryType(value)}
                style={styles.picker}
              >
                <Picker.Item label="Work" value="WORK" />
                <Picker.Item label="Travel" value="TRAVEL" />
                <Picker.Item label="Break" value="BREAK" />
              </Picker>
            </View>
            <TouchableOpacity style={styles.startButton} onPress={startTimer}>
              <Text style={styles.startButtonText}>▶ Start Timer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* History Section */}
      <View style={styles.historySection}>
        <Text style={styles.historyTitle}>Recent Entries</Text>
        {isLoading ? (
          <ActivityIndicator size="large" color="#3b82f6" />
        ) : (
          <FlatList
            data={entries.filter((e) => e.endedAt)}
            renderItem={renderTimeEntry}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No time entries yet</Text>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  timerSection: {
    backgroundColor: '#fff',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  jobInfo: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  activeTimer: {
    alignItems: 'center',
    marginTop: 16,
  },
  timerDisplay: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  startSection: {
    marginTop: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginBottom: 16,
  },
  picker: {
    height: 50,
  },
  startButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  stopButton: {
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 200,
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginVertical: 8,
  },
  typeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  historySection: {
    flex: 1,
    padding: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  entryCard: {
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
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  durationText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  timeText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  jobText: {
    fontSize: 12,
    color: '#3b82f6',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    marginTop: 24,
  },
});
