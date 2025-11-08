import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useForms } from '../hooks/use-forms';
import { useSync } from '../hooks/use-sync';
import { Form, FormStatus } from '../types';

export default function FormsScreen({ navigation }: any) {
  const { forms, isLoading, refreshForms } = useForms();
  const { syncStatus } = useSync();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });
    return unsubscribe;
  }, []);

  const handleRefresh = async () => {
    await refreshForms();
  };

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

  const getCompletionPercentage = (form: Form): number => {
    const requiredFields = form.fields.filter((f) => f.required);
    const filledFields = requiredFields.filter((f) => f.value !== null && f.value !== '');
    return requiredFields.length > 0
      ? Math.round((filledFields.length / requiredFields.length) * 100)
      : 100;
  };

  const renderForm = ({ item }: { item: Form }) => {
    const completion = getCompletionPercentage(item);

    return (
      <TouchableOpacity
        style={styles.formCard}
        onPress={() => navigation.navigate('FormDetail', { formId: item.id })}
      >
        <View style={styles.formHeader}>
          <Text style={styles.formTemplate}>{item.templateName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        {item.jobId && (
          <Text style={styles.formJobLink}>Linked to Job</Text>
        )}

        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>Completion: {completion}%</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${completion}%`, backgroundColor: getStatusColor(item.status) },
              ]}
            />
          </View>
        </View>

        <Text style={styles.formDate}>
          Created: {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </TouchableOpacity>
    );
  };

  if (isLoading && forms.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Forms</Text>
        {!isOnline && (
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineText}>Offline</Text>
          </View>
        )}
        {syncStatus.isSyncing && (
          <ActivityIndicator size="small" color="#3b82f6" style={{ marginLeft: 8 }} />
        )}
      </View>

      <FlatList
        data={forms}
        renderItem={renderForm}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No forms found</Text>
            <Text style={styles.emptySubtext}>Pull down to refresh</Text>
          </View>
        }
      />
    </View>
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
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  offlineBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  offlineText: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  formTemplate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  formJobLink: {
    fontSize: 12,
    color: '#3b82f6',
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  formDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
});
