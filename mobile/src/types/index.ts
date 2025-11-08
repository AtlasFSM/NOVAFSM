// User and Authentication Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'DISPATCHER' | 'TECHNICIAN';
  tenantId: string;
  organization?: {
    id: string;
    name: string;
    slug: string;
    currency?: string;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// Job Types
export enum JobStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum SyncStatus {
  SYNCED = 'SYNCED',
  PENDING = 'PENDING',
  CONFLICT = 'CONFLICT',
  ERROR = 'ERROR',
}

export interface Job {
  id: string;
  tenantId: string;
  number: string;
  status: JobStatus;
  customerId: string;
  customerName: string;
  title: string;
  description: string | null;
  scheduledStart: string;
  scheduledEnd: string;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  siteAddress?: string;
  siteLatitude?: number;
  siteLongitude?: number;
  syncStatus: SyncStatus;
  version: number;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LocalJob extends Job {
  localId?: number;
}

// Photo Types
export interface JobPhoto {
  id: string;
  jobId: string;
  uri: string;
  uploaded: boolean;
  uploadedUrl: string | null;
  caption?: string;
  createdAt: string;
}

export interface LocalJobPhoto extends JobPhoto {
  localId?: number;
}

// Signature Types
export enum SignatureType {
  CUSTOMER = 'CUSTOMER',
  TECHNICIAN = 'TECHNICIAN',
}

export interface JobSignature {
  id: string;
  jobId: string;
  type: SignatureType;
  data: string; // base64
  uploaded: boolean;
  signerName?: string;
  createdAt: string;
}

export interface LocalJobSignature extends JobSignature {
  localId?: number;
}

// Time Entry Types
export interface TimeEntry {
  id: string;
  jobId: string;
  technicianId: string;
  startTime: string;
  endTime: string | null;
  notes?: string;
  synced: boolean;
  createdAt: string;
}

export interface LocalTimeEntry extends TimeEntry {
  localId?: number;
}

// Sync Queue Types
export enum SyncOperation {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export enum SyncEntity {
  JOB = 'JOB',
  PHOTO = 'PHOTO',
  SIGNATURE = 'SIGNATURE',
  TIME_ENTRY = 'TIME_ENTRY',
  ASSET = 'ASSET',
  DOCUMENT = 'DOCUMENT',
  FORM = 'FORM',
}

export interface SyncQueueItem {
  id: string;
  operation: SyncOperation;
  entity: SyncEntity;
  entityId: string;
  data: string; // JSON stringified
  idempotencyKey: string;
  attempts: number;
  lastAttemptAt: string | null;
  createdAt: string;
}

export interface LocalSyncQueueItem extends SyncQueueItem {
  localId?: number;
}

// Location Types
export interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

export interface ConflictResponse {
  message: string;
  conflictingVersion: number;
  serverData: Job;
  clientData: Job;
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Navigation Types
export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  JobDetail: { jobId: string };
  AssetDetail: { assetId: string };
  DocumentUpload: { documentId?: string };
  FormDetail: { formId: string };
};

export type MainTabParamList = {
  Jobs: undefined;
  Map: undefined;
  Assets: undefined;
  Documents: undefined;
  Forms: undefined;
  Profile: undefined;
};

export type JobsStackParamList = {
  JobsList: undefined;
  JobDetail: { jobId: string };
};

// Network Status
export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
}

// Sync Status
export interface SyncStatusInfo {
  isSyncing: boolean;
  lastSyncAt: string | null;
  pendingChanges: number;
  failedChanges: number;
}

// Photo Upload
export interface PhotoUploadRequest {
  jobId: string;
  photoId: string;
  uri: string;
}

export interface PresignedUploadUrl {
  uploadUrl: string;
  publicUrl: string;
}

// Job Update Request
export interface JobUpdateRequest {
  status?: JobStatus;
  checkInLocation?: LocationData;
  checkOutLocation?: LocationData;
  notes?: string;
  startedAt?: string;
  completedAt?: string;
}

// Check-in/Check-out
export interface CheckInData {
  jobId: string;
  location: LocationData;
  timestamp: string;
}

export interface CheckOutData {
  jobId: string;
  location: LocationData;
  timestamp: string;
  notes?: string;
}

// Asset Types
export enum AssetStatus {
  AVAILABLE = 'AVAILABLE',
  IN_USE = 'IN_USE',
  MAINTENANCE = 'MAINTENANCE',
  RETIRED = 'RETIRED',
}

export interface Asset {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  status: AssetStatus;
  serialNumber: string | null;
  assignedToTechnicianId: string | null;
  assignedToJobId: string | null;
  syncStatus: SyncStatus;
  version: number;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LocalAsset extends Asset {
  localId?: number;
}

// Document Types
export enum DocumentType {
  INVOICE = 'INVOICE',
  QUOTE = 'QUOTE',
  REPORT = 'REPORT',
  PHOTO = 'PHOTO',
  OTHER = 'OTHER',
}

export interface Document {
  id: string;
  tenantId: string;
  name: string;
  type: DocumentType;
  mimeType: string;
  size: number;
  uri: string;
  uploaded: boolean;
  uploadedUrl: string | null;
  jobId: string | null;
  assetId: string | null;
  description: string | null;
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
}

export interface LocalDocument extends Document {
  localId?: number;
}

// Form Types
export enum FormStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'checkbox' | 'signature';
  value: string | null;
  required: boolean;
}

export interface Form {
  id: string;
  tenantId: string;
  templateId: string;
  templateName: string;
  jobId: string | null;
  status: FormStatus;
  fields: FormField[];
  syncStatus: SyncStatus;
  version: number;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LocalForm extends Form {
  localId?: number;
}
