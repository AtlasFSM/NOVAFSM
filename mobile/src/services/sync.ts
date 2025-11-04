import * as FileSystem from 'expo-file-system';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { v4 as uuidv4 } from 'uuid';
import {
  SyncStatus,
  SyncOperation,
  SyncEntity,
  SyncQueueItem,
  Job,
  JobUpdateRequest,
  ConflictResponse,
} from '../types';
import { apiClient } from './api';
import {
  getAllJobs,
  upsertJob,
  updateJobSyncStatus,
  getPendingSyncQueueItems,
  insertSyncQueueItem,
  updateSyncQueueItemAttempt,
  deleteSyncQueueItem,
  getSyncQueueCount,
  getPendingPhotos,
  updateJobPhotoUploaded,
  getPendingSignatures,
  updateJobSignatureUploaded,
} from './database';

const BACKGROUND_SYNC_TASK = 'BACKGROUND_SYNC_TASK';
const MAX_SYNC_ATTEMPTS = 5;
const SYNC_INTERVAL = 15 * 60; // 15 minutes in seconds

// Sync state management
let isSyncing = false;
let lastSyncTimestamp: string | null = null;
let syncListeners: Array<(status: SyncStatusInfo) => void> = [];

export interface SyncStatusInfo {
  isSyncing: boolean;
  lastSyncAt: string | null;
  pendingChanges: number;
  failedChanges: number;
}

// Register sync status listener
export const onSyncStatusChange = (listener: (status: SyncStatusInfo) => void): (() => void) => {
  syncListeners.push(listener);
  // Return unsubscribe function
  return () => {
    syncListeners = syncListeners.filter((l) => l !== listener);
  };
};

// Notify all listeners of sync status change
const notifySyncStatus = async () => {
  const pendingChanges = await getSyncQueueCount();
  const status: SyncStatusInfo = {
    isSyncing,
    lastSyncAt: lastSyncTimestamp,
    pendingChanges,
    failedChanges: 0, // Could track this separately if needed
  };
  syncListeners.forEach((listener) => listener(status));
};

// Initialize sync service
export const initSyncService = async (): Promise<void> => {
  // Register background fetch task
  await registerBackgroundSyncTask();

  // Set up network state listener
  NetInfo.addEventListener(handleNetworkStateChange);

  console.log('Sync service initialized');
};

// Handle network state changes
const handleNetworkStateChange = async (state: NetInfoState) => {
  console.log('Network state changed:', state.isConnected, state.isInternetReachable);

  if (state.isConnected && state.isInternetReachable && !isSyncing) {
    // Connection restored, trigger sync
    await performSync();
  }
};

// Main sync function
export const performSync = async (): Promise<void> => {
  if (isSyncing) {
    console.log('Sync already in progress, skipping');
    return;
  }

  console.log('Starting sync...');
  isSyncing = true;
  await notifySyncStatus();

  try {
    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected || !netInfo.isInternetReachable) {
      console.log('No network connection, skipping sync');
      return;
    }

    // 1. Sync jobs from server (download)
    await syncJobsFromServer();

    // 2. Process pending changes (upload)
    await syncPendingChanges();

    // 3. Upload pending photos
    await uploadPendingPhotos();

    // 4. Upload pending signatures
    await uploadPendingSignatures();

    lastSyncTimestamp = new Date().toISOString();
    console.log('Sync completed successfully');
  } catch (error) {
    console.error('Sync failed:', error);
    throw error;
  } finally {
    isSyncing = false;
    await notifySyncStatus();
  }
};

// Sync jobs from server
export const syncJobsFromServer = async (): Promise<void> => {
  console.log('Syncing jobs from server...');

  try {
    const response = await apiClient.getJobs({
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Next 30 days
    });

    for (const job of response.data) {
      await upsertJob({
        ...job,
        syncStatus: SyncStatus.SYNCED,
        lastSyncedAt: new Date().toISOString(),
      });
    }

    console.log(`Synced ${response.data.length} jobs from server`);
  } catch (error) {
    console.error('Failed to sync jobs from server:', error);
    throw error;
  }
};

// Process pending changes from sync queue
export const syncPendingChanges = async (): Promise<void> => {
  console.log('Processing pending changes...');

  try {
    const pendingItems = await getPendingSyncQueueItems(MAX_SYNC_ATTEMPTS);

    for (const item of pendingItems) {
      try {
        await processSyncQueueItem(item);
        await deleteSyncQueueItem(item.id);
        console.log(`Successfully synced ${item.entity} ${item.entityId}`);
      } catch (error: any) {
        // Handle conflicts
        if (error.isConflict) {
          await handleConflict(item, error.conflictData);
        } else {
          // Increment attempt counter
          await updateSyncQueueItemAttempt(item.id);
          console.error(`Failed to sync ${item.entity} ${item.entityId}:`, error);
        }
      }
    }

    console.log(`Processed ${pendingItems.length} pending changes`);
  } catch (error) {
    console.error('Failed to process pending changes:', error);
    throw error;
  }
};

// Process individual sync queue item
const processSyncQueueItem = async (item: SyncQueueItem): Promise<void> => {
  const data = JSON.parse(item.data);

  switch (item.entity) {
    case SyncEntity.JOB:
      await syncJobUpdate(item.entityId, data, item.idempotencyKey);
      break;

    case SyncEntity.TIME_ENTRY:
      await syncTimeEntry(item, data);
      break;

    case SyncEntity.SIGNATURE:
      await syncSignature(item, data);
      break;

    default:
      console.warn(`Unknown sync entity: ${item.entity}`);
  }
};

// Sync job update
const syncJobUpdate = async (
  jobId: string,
  updates: JobUpdateRequest,
  idempotencyKey: string
): Promise<void> => {
  const updatedJob = await apiClient.updateJob(jobId, updates, idempotencyKey);
  await upsertJob({
    ...updatedJob,
    syncStatus: SyncStatus.SYNCED,
    lastSyncedAt: new Date().toISOString(),
  });
};

// Sync time entry
const syncTimeEntry = async (item: SyncQueueItem, data: any): Promise<void> => {
  if (item.operation === SyncOperation.CREATE) {
    await apiClient.createTimeEntry(data.jobId, data, item.idempotencyKey);
  } else if (item.operation === SyncOperation.UPDATE) {
    await apiClient.updateTimeEntry(data.jobId, item.entityId, data, item.idempotencyKey);
  }
};

// Sync signature
const syncSignature = async (item: SyncQueueItem, data: any): Promise<void> => {
  if (item.operation === SyncOperation.CREATE) {
    await apiClient.uploadSignature(data.jobId, data, item.idempotencyKey);
    await updateJobSignatureUploaded(item.entityId);
  }
};

// Upload pending photos
export const uploadPendingPhotos = async (): Promise<void> => {
  console.log('Uploading pending photos...');

  try {
    const pendingPhotos = await getPendingPhotos();

    for (const photo of pendingPhotos) {
      try {
        // Get presigned upload URL
        const fileName = photo.uri.split('/').pop() || `photo_${Date.now()}.jpg`;
        const { uploadUrl, publicUrl } = await apiClient.getPresignedUploadUrl(
          photo.jobId,
          fileName
        );

        // Read file from local storage
        const fileInfo = await FileSystem.getInfoAsync(photo.uri);
        if (!fileInfo.exists) {
          console.warn(`Photo file not found: ${photo.uri}`);
          continue;
        }

        // Upload file to presigned URL
        const fileBlob = await fetch(photo.uri).then((r) => r.blob());
        await apiClient.uploadPhotoToPresignedUrl(uploadUrl, fileBlob);

        // Confirm upload to backend
        const idempotencyKey = uuidv4();
        await apiClient.confirmPhotoUpload(photo.jobId, photo.id, publicUrl, idempotencyKey);

        // Update local database
        await updateJobPhotoUploaded(photo.id, publicUrl);

        console.log(`Successfully uploaded photo ${photo.id}`);
      } catch (error) {
        console.error(`Failed to upload photo ${photo.id}:`, error);
      }
    }

    console.log(`Uploaded ${pendingPhotos.length} photos`);
  } catch (error) {
    console.error('Failed to upload pending photos:', error);
    throw error;
  }
};

// Upload pending signatures
export const uploadPendingSignatures = async (): Promise<void> => {
  console.log('Uploading pending signatures...');

  try {
    const pendingSignatures = await getPendingSignatures();

    for (const signature of pendingSignatures) {
      try {
        const idempotencyKey = uuidv4();
        await apiClient.uploadSignature(
          signature.jobId,
          {
            type: signature.type,
            data: signature.data,
            signerName: signature.signerName,
          },
          idempotencyKey
        );

        await updateJobSignatureUploaded(signature.id);

        console.log(`Successfully uploaded signature ${signature.id}`);
      } catch (error) {
        console.error(`Failed to upload signature ${signature.id}:`, error);
      }
    }

    console.log(`Uploaded ${pendingSignatures.length} signatures`);
  } catch (error) {
    console.error('Failed to upload pending signatures:', error);
    throw error;
  }
};

// Handle sync conflict
const handleConflict = async (
  item: SyncQueueItem,
  conflictData: ConflictResponse
): Promise<void> => {
  console.warn(`Conflict detected for ${item.entity} ${item.entityId}`);

  // Mark job as conflicted in local database
  await updateJobSyncStatus(item.entityId, SyncStatus.CONFLICT);

  // In a real app, you'd show a UI to let the user resolve the conflict
  // For now, we'll just log it and delete the sync queue item
  // Server wins strategy
  await upsertJob({
    ...conflictData.serverData,
    syncStatus: SyncStatus.SYNCED,
    lastSyncedAt: new Date().toISOString(),
  });

  await deleteSyncQueueItem(item.id);
};

// Queue a job update for sync
export const queueJobUpdate = async (
  jobId: string,
  updates: JobUpdateRequest
): Promise<void> => {
  const syncItem: SyncQueueItem = {
    id: uuidv4(),
    operation: SyncOperation.UPDATE,
    entity: SyncEntity.JOB,
    entityId: jobId,
    data: JSON.stringify(updates),
    idempotencyKey: uuidv4(),
    attempts: 0,
    lastAttemptAt: null,
    createdAt: new Date().toISOString(),
  };

  await insertSyncQueueItem(syncItem);
  await updateJobSyncStatus(jobId, SyncStatus.PENDING);
  await notifySyncStatus();

  // Trigger immediate sync if online
  const netInfo = await NetInfo.fetch();
  if (netInfo.isConnected && netInfo.isInternetReachable) {
    performSync().catch(console.error);
  }
};

// Background sync task
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    console.log('Background sync task started');
    await performSync();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background sync failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Register background sync task
const registerBackgroundSyncTask = async (): Promise<void> => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
        minimumInterval: SYNC_INTERVAL,
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log('Background sync task registered');
    }
  } catch (error) {
    console.error('Failed to register background sync task:', error);
  }
};

// Get current sync status
export const getSyncStatus = async (): Promise<SyncStatusInfo> => {
  const pendingChanges = await getSyncQueueCount();
  return {
    isSyncing,
    lastSyncAt: lastSyncTimestamp,
    pendingChanges,
    failedChanges: 0,
  };
};

// Force sync now (for pull-to-refresh)
export const forceSyncNow = async (): Promise<void> => {
  return performSync();
};
