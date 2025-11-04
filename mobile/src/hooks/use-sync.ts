import { useState, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import {
  getSyncStatus,
  forceSyncNow,
  onSyncStatusChange,
  SyncStatusInfo,
} from '../services/sync';
import { NetworkStatus } from '../types';

export const useSync = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatusInfo>({
    isSyncing: false,
    lastSyncAt: null,
    pendingChanges: 0,
    failedChanges: 0,
  });

  useEffect(() => {
    // Load initial sync status
    getSyncStatus().then(setSyncStatus);

    // Subscribe to sync status changes
    const unsubscribe = onSyncStatusChange(setSyncStatus);

    return unsubscribe;
  }, []);

  const sync = useCallback(async () => {
    try {
      await forceSyncNow();
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  }, []);

  return {
    syncStatus,
    sync,
  };
};

export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: null,
  });

  useEffect(() => {
    // Get initial network status
    NetInfo.fetch().then((state) => {
      setNetworkStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
      });
    });

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      setNetworkStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
      });
    });

    return unsubscribe;
  }, []);

  return networkStatus;
};
