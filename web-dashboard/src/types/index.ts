// Enums
export enum JobStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum JobPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum UserStatus {
  AVAILABLE = 'AVAILABLE',
  ON_JOB = 'ON_JOB',
  BREAK = 'BREAK',
  OFFLINE = 'OFFLINE',
}

export enum CustomerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum QuoteStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

// Base types
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status?: UserStatus;
  avatar?: string;
  skills?: string[];
}

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  provinceState: string | null;
  postalZip: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  status: CustomerStatus;
  tags: string[];
  billingAddress: any | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    sites?: number;
    jobs?: number;
    quotes?: number;
    invoices?: number;
  };
}

export interface CreateCustomerDto {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  provinceState?: string;
  postalZip?: string;
  country?: string;
  tags?: string[];
  notes?: string;
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {
  status?: CustomerStatus;
}

export interface Site {
  id: string;
  tenantId: string;
  customerId: string;
  name: string;
  address: string | null;
  city: string | null;
  provinceState: string | null;
  postalZip: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  contactName: string | null;
  contactPhone: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSiteDto {
  customerId: string;
  name: string;
  address?: string;
  city?: string;
  provinceState?: string;
  postalZip?: string;
  country?: string;
  contactName?: string;
  contactPhone?: string;
  notes?: string;
}

export interface QuoteLine {
  id: string;
  tenantId: string;
  quoteId: string;
  itemId: string | null;
  sku: string | null;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discounts: number;
  taxes: Array<{
    code: string;
    rate: number;
    amount: number;
  }>;
  amount: number;
  sort: number;
  createdAt: string;
  updatedAt: string;
}

export interface Quote {
  id: string;
  tenantId: string;
  number: string;
  status: QuoteStatus;
  currency: string;
  customerId: string;
  siteId: string | null;
  title: string | null;
  description: string | null;
  subtotal: number;
  taxTotal: number;
  total: number;
  validUntil: string | null;
  version: number;
  notes: string | null;
  termsConditions: string | null;
  createdById: string;
  approvedAt: string | null;
  approvedById: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  site?: Site;
  lines?: QuoteLine[];
  createdBy?: User;
  approvedBy?: User;
}

export interface CreateQuoteLineDto {
  itemId?: string;
  sku?: string;
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  discounts?: number;
  sort?: number;
}

export interface CreateQuoteDto {
  customerId: string;
  siteId?: string;
  title?: string;
  description?: string;
  validUntil?: string;
  notes?: string;
  termsConditions?: string;
  lines: CreateQuoteLineDto[];
}

export interface UpdateQuoteDto extends Partial<CreateQuoteDto> {
  status?: QuoteStatus;
}

export interface Invoice {
  id: string;
  tenantId: string;
  number: string;
  status: InvoiceStatus;
  currency: string;
  customerId: string;
  jobId: string | null;
  quoteId: string | null;
  subtotal: number;
  taxTotal: number;
  total: number;
  dueDate: string | null;
  paidAt: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  job?: Job;
  quote?: Quote;
}

export interface TimeEntry {
  id: string;
  jobId: string;
  technicianId: string;
  technician?: User;
  startTime: string;
  endTime?: string;
  duration?: number;
  description?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unit: string;
}

export interface JobInventoryUsage {
  id: string;
  jobId: string;
  inventoryItemId: string;
  item?: InventoryItem;
  quantity: number;
  usedAt: string;
}

export interface JobHistory {
  id: string;
  jobId: string;
  userId: string;
  user?: User;
  action: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
}

export interface CheckInOut {
  latitude: number;
  longitude: number;
  address?: string;
}

// Main Job type
export interface Job {
  id: string;
  number: string;
  title: string;
  description?: string;
  status: JobStatus;
  priority: JobPriority;

  customerId: string;
  customer?: Customer;

  siteId: string;
  site?: Site;

  assignedToId?: string;
  assignedTo?: User;

  quoteId?: string;
  quote?: Quote;

  scheduledStart: string;
  scheduledEnd: string;

  actualStart?: string;
  actualEnd?: string;

  checkIn?: CheckInOut;
  checkOut?: CheckInOut;

  timeEntries?: TimeEntry[];
  inventoryUsage?: JobInventoryUsage[];
  history?: JobHistory[];

  createdAt: string;
  updatedAt: string;
}

// Filter types
export interface JobFilters {
  status?: JobStatus[];
  priority?: JobPriority[];
  assignedToId?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

// Form types
export interface CreateJobInput {
  title: string;
  description?: string;
  priority: JobPriority;
  customerId: string;
  siteId: string;
  assignedToId?: string;
  quoteId?: string;
  scheduledStart: string;
  scheduledEnd: string;
}

export interface UpdateJobInput {
  title?: string;
  description?: string;
  priority?: JobPriority;
  status?: JobStatus;
  assignedToId?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
}

export interface ScheduleConflict {
  jobId: string;
  jobNumber: string;
  technicianId: string;
  scheduledStart: string;
  scheduledEnd: string;
}

// WebSocket event types
export interface JobAssignedEvent {
  jobId: string;
  job: Job;
  assignedToId: string;
}

export interface JobUpdatedEvent {
  jobId: string;
  job: Job;
  changes: Partial<Job>;
}

// Pagination types
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// API Response types
export interface ApiResponseData<T> {
  data: T;
  success?: boolean;
  message?: string;
}
