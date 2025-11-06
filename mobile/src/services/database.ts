import * as SQLite from 'expo-sqlite';
import {
  LocalJob,
  LocalJobPhoto,
  LocalJobSignature,
  LocalSyncQueueItem,
  LocalTimeEntry,
  LocalAsset,
  LocalDocument,
  LocalForm,
  Job,
  JobPhoto,
  JobSignature,
  SyncQueueItem,
  TimeEntry,
  Asset,
  Document,
  Form,
  SyncStatus,
} from '../types';

const DB_NAME = 'novafsm.db';

// Initialize database
let db: SQLite.SQLiteDatabase | null = null;

export const initDatabase = async (): Promise<void> => {
  try {
    db = await SQLite.openDatabaseAsync(DB_NAME);

    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
    `);

    // Create jobs table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS jobs (
        localId INTEGER PRIMARY KEY AUTOINCREMENT,
        id TEXT UNIQUE NOT NULL,
        tenantId TEXT NOT NULL,
        number TEXT NOT NULL,
        status TEXT NOT NULL,
        customerId TEXT NOT NULL,
        customerName TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        scheduledStart TEXT NOT NULL,
        scheduledEnd TEXT NOT NULL,
        assignedTechnicianId TEXT,
        assignedTechnicianName TEXT,
        siteAddress TEXT,
        siteLatitude REAL,
        siteLongitude REAL,
        syncStatus TEXT NOT NULL DEFAULT 'SYNCED',
        version INTEGER NOT NULL DEFAULT 1,
        lastSyncedAt TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
      CREATE INDEX IF NOT EXISTS idx_jobs_sync_status ON jobs(syncStatus);
      CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_start ON jobs(scheduledStart);
    `);

    // Create job_photos table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS job_photos (
        localId INTEGER PRIMARY KEY AUTOINCREMENT,
        id TEXT UNIQUE NOT NULL,
        jobId TEXT NOT NULL,
        uri TEXT NOT NULL,
        uploaded INTEGER NOT NULL DEFAULT 0,
        uploadedUrl TEXT,
        caption TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (jobId) REFERENCES jobs(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_job_photos_job_id ON job_photos(jobId);
      CREATE INDEX IF NOT EXISTS idx_job_photos_uploaded ON job_photos(uploaded);
    `);

    // Create job_signatures table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS job_signatures (
        localId INTEGER PRIMARY KEY AUTOINCREMENT,
        id TEXT UNIQUE NOT NULL,
        jobId TEXT NOT NULL,
        type TEXT NOT NULL,
        data TEXT NOT NULL,
        uploaded INTEGER NOT NULL DEFAULT 0,
        signerName TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (jobId) REFERENCES jobs(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_job_signatures_job_id ON job_signatures(jobId);
      CREATE INDEX IF NOT EXISTS idx_job_signatures_uploaded ON job_signatures(uploaded);
    `);

    // Create time_entries table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS time_entries (
        localId INTEGER PRIMARY KEY AUTOINCREMENT,
        id TEXT UNIQUE NOT NULL,
        jobId TEXT NOT NULL,
        technicianId TEXT NOT NULL,
        startTime TEXT NOT NULL,
        endTime TEXT,
        notes TEXT,
        synced INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (jobId) REFERENCES jobs(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_time_entries_job_id ON time_entries(jobId);
      CREATE INDEX IF NOT EXISTS idx_time_entries_synced ON time_entries(synced);
    `);

    // Create sync_queue table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        localId INTEGER PRIMARY KEY AUTOINCREMENT,
        id TEXT UNIQUE NOT NULL,
        operation TEXT NOT NULL,
        entity TEXT NOT NULL,
        entityId TEXT NOT NULL,
        data TEXT NOT NULL,
        idempotencyKey TEXT UNIQUE NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        lastAttemptAt TEXT,
        createdAt TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_sync_queue_entity ON sync_queue(entity);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_attempts ON sync_queue(attempts);
    `);

    // Create assets table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS assets (
        localId INTEGER PRIMARY KEY AUTOINCREMENT,
        id TEXT UNIQUE NOT NULL,
        tenantId TEXT NOT NULL,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        status TEXT NOT NULL,
        serialNumber TEXT,
        assignedToTechnicianId TEXT,
        assignedToJobId TEXT,
        syncStatus TEXT NOT NULL DEFAULT 'SYNCED',
        version INTEGER NOT NULL DEFAULT 1,
        lastSyncedAt TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
      CREATE INDEX IF NOT EXISTS idx_assets_sync_status ON assets(syncStatus);
      CREATE INDEX IF NOT EXISTS idx_assets_code ON assets(code);
    `);

    // Create documents table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS documents (
        localId INTEGER PRIMARY KEY AUTOINCREMENT,
        id TEXT UNIQUE NOT NULL,
        tenantId TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        mimeType TEXT NOT NULL,
        size INTEGER NOT NULL,
        uri TEXT NOT NULL,
        uploaded INTEGER NOT NULL DEFAULT 0,
        uploadedUrl TEXT,
        jobId TEXT,
        assetId TEXT,
        description TEXT,
        syncStatus TEXT NOT NULL DEFAULT 'SYNCED',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
      CREATE INDEX IF NOT EXISTS idx_documents_uploaded ON documents(uploaded);
      CREATE INDEX IF NOT EXISTS idx_documents_job_id ON documents(jobId);
      CREATE INDEX IF NOT EXISTS idx_documents_asset_id ON documents(assetId);
    `);

    // Create forms table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS forms (
        localId INTEGER PRIMARY KEY AUTOINCREMENT,
        id TEXT UNIQUE NOT NULL,
        tenantId TEXT NOT NULL,
        templateId TEXT NOT NULL,
        templateName TEXT NOT NULL,
        jobId TEXT,
        status TEXT NOT NULL,
        fields TEXT NOT NULL,
        syncStatus TEXT NOT NULL DEFAULT 'SYNCED',
        version INTEGER NOT NULL DEFAULT 1,
        lastSyncedAt TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_forms_status ON forms(status);
      CREATE INDEX IF NOT EXISTS idx_forms_sync_status ON forms(syncStatus);
      CREATE INDEX IF NOT EXISTS idx_forms_job_id ON forms(jobId);
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

// Job CRUD operations
export const getAllJobs = async (): Promise<LocalJob[]> => {
  if (!db) throw new Error('Database not initialized');
  const result = await db.getAllAsync<LocalJob>('SELECT * FROM jobs ORDER BY scheduledStart DESC');
  return result;
};

export const getJobById = async (id: string): Promise<LocalJob | null> => {
  if (!db) throw new Error('Database not initialized');
  const result = await db.getFirstAsync<LocalJob>('SELECT * FROM jobs WHERE id = ?', [id]);
  return result || null;
};

export const getJobsByStatus = async (status: string): Promise<LocalJob[]> => {
  if (!db) throw new Error('Database not initialized');
  const result = await db.getAllAsync<LocalJob>(
    'SELECT * FROM jobs WHERE status = ? ORDER BY scheduledStart DESC',
    [status]
  );
  return result;
};

export const upsertJob = async (job: Job): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync(
    `INSERT INTO jobs (
      id, tenantId, number, status, customerId, customerName, title, description,
      scheduledStart, scheduledEnd, assignedTechnicianId, assignedTechnicianName,
      siteAddress, siteLatitude, siteLongitude, syncStatus, version, lastSyncedAt,
      createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      status = excluded.status,
      title = excluded.title,
      description = excluded.description,
      scheduledStart = excluded.scheduledStart,
      scheduledEnd = excluded.scheduledEnd,
      assignedTechnicianId = excluded.assignedTechnicianId,
      assignedTechnicianName = excluded.assignedTechnicianName,
      siteAddress = excluded.siteAddress,
      siteLatitude = excluded.siteLatitude,
      siteLongitude = excluded.siteLongitude,
      syncStatus = excluded.syncStatus,
      version = excluded.version,
      lastSyncedAt = excluded.lastSyncedAt,
      updatedAt = excluded.updatedAt`,
    [
      job.id,
      job.tenantId,
      job.number,
      job.status,
      job.customerId,
      job.customerName,
      job.title,
      job.description,
      job.scheduledStart,
      job.scheduledEnd,
      job.assignedTechnicianId || null,
      job.assignedTechnicianName || null,
      job.siteAddress || null,
      job.siteLatitude || null,
      job.siteLongitude || null,
      job.syncStatus,
      job.version,
      job.lastSyncedAt,
      job.createdAt,
      job.updatedAt,
    ]
  );
};

export const updateJobStatus = async (
  id: string,
  status: string,
  syncStatus: SyncStatus = SyncStatus.PENDING
): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync(
    'UPDATE jobs SET status = ?, syncStatus = ?, updatedAt = ? WHERE id = ?',
    [status, syncStatus, new Date().toISOString(), id]
  );
};

export const updateJobSyncStatus = async (id: string, syncStatus: SyncStatus): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync(
    'UPDATE jobs SET syncStatus = ?, lastSyncedAt = ? WHERE id = ?',
    [syncStatus, new Date().toISOString(), id]
  );
};

// Job Photo CRUD operations
export const getJobPhotos = async (jobId: string): Promise<LocalJobPhoto[]> => {
  if (!db) throw new Error('Database not initialized');
  const result = await db.getAllAsync<LocalJobPhoto>(
    'SELECT * FROM job_photos WHERE jobId = ? ORDER BY createdAt DESC',
    [jobId]
  );
  return result;
};

export const getPendingPhotos = async (): Promise<LocalJobPhoto[]> => {
  if (!db) throw new Error('Database not initialized');
  const result = await db.getAllAsync<LocalJobPhoto>(
    'SELECT * FROM job_photos WHERE uploaded = 0 ORDER BY createdAt ASC'
  );
  return result;
};

export const insertJobPhoto = async (photo: JobPhoto): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync(
    `INSERT INTO job_photos (id, jobId, uri, uploaded, uploadedUrl, caption, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      photo.id,
      photo.jobId,
      photo.uri,
      photo.uploaded ? 1 : 0,
      photo.uploadedUrl,
      photo.caption || null,
      photo.createdAt,
    ]
  );
};

export const updateJobPhotoUploaded = async (
  id: string,
  uploadedUrl: string
): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync(
    'UPDATE job_photos SET uploaded = 1, uploadedUrl = ? WHERE id = ?',
    [uploadedUrl, id]
  );
};

// Job Signature CRUD operations
export const getJobSignatures = async (jobId: string): Promise<LocalJobSignature[]> => {
  if (!db) throw new Error('Database not initialized');
  const result = await db.getAllAsync<LocalJobSignature>(
    'SELECT * FROM job_signatures WHERE jobId = ? ORDER BY createdAt DESC',
    [jobId]
  );
  return result;
};

export const getPendingSignatures = async (): Promise<LocalJobSignature[]> => {
  if (!db) throw new Error('Database not initialized');
  const result = await db.getAllAsync<LocalJobSignature>(
    'SELECT * FROM job_signatures WHERE uploaded = 0 ORDER BY createdAt ASC'
  );
  return result;
};

export const insertJobSignature = async (signature: JobSignature): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync(
    `INSERT INTO job_signatures (id, jobId, type, data, uploaded, signerName, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      signature.id,
      signature.jobId,
      signature.type,
      signature.data,
      signature.uploaded ? 1 : 0,
      signature.signerName || null,
      signature.createdAt,
    ]
  );
};

export const updateJobSignatureUploaded = async (id: string): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync('UPDATE job_signatures SET uploaded = 1 WHERE id = ?', [id]);
};

// Time Entry CRUD operations
export const getJobTimeEntries = async (jobId: string): Promise<LocalTimeEntry[]> => {
  if (!db) throw new Error('Database not initialized');
  const result = await db.getAllAsync<LocalTimeEntry>(
    'SELECT * FROM time_entries WHERE jobId = ? ORDER BY startTime DESC',
    [jobId]
  );
  return result;
};

export const getActiveTimeEntry = async (jobId: string): Promise<LocalTimeEntry | null> => {
  if (!db) throw new Error('Database not initialized');
  const result = await db.getFirstAsync<LocalTimeEntry>(
    'SELECT * FROM time_entries WHERE jobId = ? AND endTime IS NULL ORDER BY startTime DESC LIMIT 1',
    [jobId]
  );
  return result || null;
};

export const insertTimeEntry = async (timeEntry: TimeEntry): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync(
    `INSERT INTO time_entries (id, jobId, technicianId, startTime, endTime, notes, synced, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      timeEntry.id,
      timeEntry.jobId,
      timeEntry.technicianId,
      timeEntry.startTime,
      timeEntry.endTime,
      timeEntry.notes || null,
      timeEntry.synced ? 1 : 0,
      timeEntry.createdAt,
    ]
  );
};

export const updateTimeEntry = async (id: string, endTime: string, notes?: string): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync(
    'UPDATE time_entries SET endTime = ?, notes = ?, synced = 0 WHERE id = ?',
    [endTime, notes || null, id]
  );
};

// Sync Queue CRUD operations
export const getAllSyncQueueItems = async (): Promise<LocalSyncQueueItem[]> => {
  if (!db) throw new Error('Database not initialized');
  const result = await db.getAllAsync<LocalSyncQueueItem>(
    'SELECT * FROM sync_queue ORDER BY createdAt ASC'
  );
  return result;
};

export const getPendingSyncQueueItems = async (maxAttempts: number = 5): Promise<LocalSyncQueueItem[]> => {
  if (!db) throw new Error('Database not initialized');
  const result = await db.getAllAsync<LocalSyncQueueItem>(
    'SELECT * FROM sync_queue WHERE attempts < ? ORDER BY createdAt ASC',
    [maxAttempts]
  );
  return result;
};

export const insertSyncQueueItem = async (item: SyncQueueItem): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync(
    `INSERT INTO sync_queue (id, operation, entity, entityId, data, idempotencyKey, attempts, lastAttemptAt, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item.id,
      item.operation,
      item.entity,
      item.entityId,
      item.data,
      item.idempotencyKey,
      item.attempts,
      item.lastAttemptAt,
      item.createdAt,
    ]
  );
};

export const updateSyncQueueItemAttempt = async (id: string): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync(
    'UPDATE sync_queue SET attempts = attempts + 1, lastAttemptAt = ? WHERE id = ?',
    [new Date().toISOString(), id]
  );
};

export const deleteSyncQueueItem = async (id: string): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [id]);
};

export const getSyncQueueCount = async (): Promise<number> => {
  if (!db) throw new Error('Database not initialized');

  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM sync_queue'
  );
  return result?.count || 0;
};

// Asset CRUD operations
export const getAllAssets = async (): Promise<LocalAsset[]> => {
  if (!db) throw new Error('Database not initialized');
  const result = await db.getAllAsync<LocalAsset>('SELECT * FROM assets ORDER BY name ASC');
  return result;
};

export const getAssetById = async (id: string): Promise<LocalAsset | null> => {
  if (!db) throw new Error('Database not initialized');
  const result = await db.getFirstAsync<LocalAsset>('SELECT * FROM assets WHERE id = ?', [id]);
  return result || null;
};

export const getAssetsByStatus = async (status: string): Promise<LocalAsset[]> => {
  if (!db) throw new Error('Database not initialized');
  const result = await db.getAllAsync<LocalAsset>(
    'SELECT * FROM assets WHERE status = ? ORDER BY name ASC',
    [status]
  );
  return result;
};

export const upsertAsset = async (asset: Asset): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync(
    `INSERT INTO assets (
      id, tenantId, code, name, description, category, status, serialNumber,
      assignedToTechnicianId, assignedToJobId, syncStatus, version, lastSyncedAt,
      createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      description = excluded.description,
      category = excluded.category,
      status = excluded.status,
      serialNumber = excluded.serialNumber,
      assignedToTechnicianId = excluded.assignedToTechnicianId,
      assignedToJobId = excluded.assignedToJobId,
      syncStatus = excluded.syncStatus,
      version = excluded.version,
      lastSyncedAt = excluded.lastSyncedAt,
      updatedAt = excluded.updatedAt`,
    [
      asset.id,
      asset.tenantId,
      asset.code,
      asset.name,
      asset.description,
      asset.category,
      asset.status,
      asset.serialNumber,
      asset.assignedToTechnicianId,
      asset.assignedToJobId,
      asset.syncStatus,
      asset.version,
      asset.lastSyncedAt,
      asset.createdAt,
      asset.updatedAt,
    ]
  );
};

export const updateAssetStatus = async (
  id: string,
  status: string,
  syncStatus: SyncStatus = SyncStatus.PENDING
): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync(
    'UPDATE assets SET status = ?, syncStatus = ?, updatedAt = ? WHERE id = ?',
    [status, syncStatus, new Date().toISOString(), id]
  );
};

// Document CRUD operations
export const getAllDocuments = async (): Promise<LocalDocument[]> => {
  if (!db) throw new Error('Database not initialized');
  const result = await db.getAllAsync<LocalDocument>('SELECT * FROM documents ORDER BY createdAt DESC');
  return result;
};

export const getDocumentById = async (id: string): Promise<LocalDocument | null> => {
  if (!db) throw new Error('Database not initialized');
  const result = await db.getFirstAsync<LocalDocument>('SELECT * FROM documents WHERE id = ?', [id]);
  return result || null;
};

export const getDocumentsByJob = async (jobId: string): Promise<LocalDocument[]> => {
  if (!db) throw new Error('Database not initialized');
  const result = await db.getAllAsync<LocalDocument>(
    'SELECT * FROM documents WHERE jobId = ? ORDER BY createdAt DESC',
    [jobId]
  );
  return result;
};

export const getPendingDocuments = async (): Promise<LocalDocument[]> => {
  if (!db) throw new Error('Database not initialized');
  const result = await db.getAllAsync<LocalDocument>(
    'SELECT * FROM documents WHERE uploaded = 0 ORDER BY createdAt ASC'
  );
  return result;
};

export const insertDocument = async (document: Document): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync(
    `INSERT INTO documents (
      id, tenantId, name, type, mimeType, size, uri, uploaded, uploadedUrl,
      jobId, assetId, description, syncStatus, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      document.id,
      document.tenantId,
      document.name,
      document.type,
      document.mimeType,
      document.size,
      document.uri,
      document.uploaded ? 1 : 0,
      document.uploadedUrl,
      document.jobId,
      document.assetId,
      document.description,
      document.syncStatus,
      document.createdAt,
      document.updatedAt,
    ]
  );
};

export const updateDocumentUploaded = async (id: string, uploadedUrl: string): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync(
    'UPDATE documents SET uploaded = 1, uploadedUrl = ?, updatedAt = ? WHERE id = ?',
    [uploadedUrl, new Date().toISOString(), id]
  );
};

// Form CRUD operations
export const getAllForms = async (): Promise<LocalForm[]> => {
  if (!db) throw new Error('Database not initialized');
  const result = await db.getAllAsync<LocalForm>('SELECT * FROM forms ORDER BY createdAt DESC');
  return result.map((form) => ({
    ...form,
    fields: JSON.parse(form.fields as unknown as string),
  }));
};

export const getFormById = async (id: string): Promise<LocalForm | null> => {
  if (!db) throw new Error('Database not initialized');
  const result = await db.getFirstAsync<LocalForm>('SELECT * FROM forms WHERE id = ?', [id]);
  if (!result) return null;
  return {
    ...result,
    fields: JSON.parse(result.fields as unknown as string),
  };
};

export const getFormsByJob = async (jobId: string): Promise<LocalForm[]> => {
  if (!db) throw new Error('Database not initialized');
  const result = await db.getAllAsync<LocalForm>(
    'SELECT * FROM forms WHERE jobId = ? ORDER BY createdAt DESC',
    [jobId]
  );
  return result.map((form) => ({
    ...form,
    fields: JSON.parse(form.fields as unknown as string),
  }));
};

export const upsertForm = async (form: Form): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  const fieldsJson = JSON.stringify(form.fields);

  await db.runAsync(
    `INSERT INTO forms (
      id, tenantId, templateId, templateName, jobId, status, fields,
      syncStatus, version, lastSyncedAt, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      status = excluded.status,
      fields = excluded.fields,
      syncStatus = excluded.syncStatus,
      version = excluded.version,
      lastSyncedAt = excluded.lastSyncedAt,
      updatedAt = excluded.updatedAt`,
    [
      form.id,
      form.tenantId,
      form.templateId,
      form.templateName,
      form.jobId,
      form.status,
      fieldsJson,
      form.syncStatus,
      form.version,
      form.lastSyncedAt,
      form.createdAt,
      form.updatedAt,
    ]
  );
};

export const updateFormStatus = async (
  id: string,
  status: string,
  syncStatus: SyncStatus = SyncStatus.PENDING
): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.runAsync(
    'UPDATE forms SET status = ?, syncStatus = ?, updatedAt = ? WHERE id = ?',
    [status, syncStatus, new Date().toISOString(), id]
  );
};

// Utility functions
export const clearAllData = async (): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.execAsync(`
    DELETE FROM forms;
    DELETE FROM documents;
    DELETE FROM assets;
    DELETE FROM sync_queue;
    DELETE FROM time_entries;
    DELETE FROM job_signatures;
    DELETE FROM job_photos;
    DELETE FROM jobs;
  `);
};

export const getDatabase = (): SQLite.SQLiteDatabase => {
  if (!db) throw new Error('Database not initialized');
  return db;
};
