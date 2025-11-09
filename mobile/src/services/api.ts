import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import {
  User,
  AuthTokens,
  LoginCredentials,
  Job,
  ApiResponse,
  ConflictResponse,
  PaginatedResponse,
  PresignedUploadUrl,
  JobUpdateRequest,
  CheckInData,
  CheckOutData,
} from '../types';

// API Configuration
const API_URL = process.env.API_URL || 'http://192.168.1.100:3000/api';

// Storage Keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: '@novafsm/access_token',
  REFRESH_TOKEN: '@novafsm/refresh_token',
  USER: '@novafsm/user',
};

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add idempotency key for POST/PUT/PATCH requests
        if (
          config.method &&
          ['post', 'put', 'patch'].includes(config.method.toLowerCase()) &&
          config.headers
        ) {
          if (!config.headers['Idempotency-Key']) {
            config.headers['Idempotency-Key'] = uuidv4();
          }
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle errors and token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Handle 401 Unauthorized - attempt token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
            if (refreshToken) {
              const { data } = await axios.post<ApiResponse<AuthTokens>>(
                `${API_URL}/auth/refresh`,
                { refreshToken }
              );

              await this.saveTokens(data.data);

              // Retry original request with new token
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
              }
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, clear auth and redirect to login
            await this.clearAuth();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth methods
  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    const { data } = await this.client.post<ApiResponse<{ user: User; tokens: AuthTokens }>>(
      '/auth/login',
      credentials
    );

    await this.saveTokens(data.data.tokens);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.data.user));

    return data.data;
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout');
    } finally {
      await this.clearAuth();
    }
  }

  async getCurrentUser(): Promise<User> {
    const { data } = await this.client.get<ApiResponse<User>>('/auth/me');
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.data));
    return data.data;
  }

  private async saveTokens(tokens: AuthTokens): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
    await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
  }

  private async clearAuth(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER,
    ]);
  }

  async getStoredUser(): Promise<User | null> {
    const userStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return userStr ? JSON.parse(userStr) : null;
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    return !!token;
  }

  // Job methods
  async getJobs(params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<Job>> {
    const { data } = await this.client.get<PaginatedResponse<Job>>('/jobs', { params });
    return data;
  }

  async getJobById(id: string): Promise<Job> {
    const { data } = await this.client.get<ApiResponse<Job>>(`/jobs/${id}`);
    return data.data;
  }

  async updateJob(
    id: string,
    updates: JobUpdateRequest,
    idempotencyKey?: string
  ): Promise<Job> {
    const headers = idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {};

    try {
      const { data } = await this.client.put<ApiResponse<Job>>(
        `/jobs/${id}`,
        updates,
        { headers }
      );
      return data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        throw {
          isConflict: true,
          conflictData: error.response.data as ConflictResponse,
        };
      }
      throw error;
    }
  }

  async checkInJob(checkInData: CheckInData, idempotencyKey: string): Promise<Job> {
    const headers = { 'Idempotency-Key': idempotencyKey };

    try {
      const { data } = await this.client.post<ApiResponse<Job>>(
        `/jobs/${checkInData.jobId}/check-in`,
        {
          location: checkInData.location,
          timestamp: checkInData.timestamp,
        },
        { headers }
      );
      return data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        throw {
          isConflict: true,
          conflictData: error.response.data as ConflictResponse,
        };
      }
      throw error;
    }
  }

  async checkOutJob(checkOutData: CheckOutData, idempotencyKey: string): Promise<Job> {
    const headers = { 'Idempotency-Key': idempotencyKey };

    try {
      const { data } = await this.client.post<ApiResponse<Job>>(
        `/jobs/${checkOutData.jobId}/check-out`,
        {
          location: checkOutData.location,
          timestamp: checkOutData.timestamp,
          notes: checkOutData.notes,
        },
        { headers }
      );
      return data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        throw {
          isConflict: true,
          conflictData: error.response.data as ConflictResponse,
        };
      }
      throw error;
    }
  }

  // Photo methods
  async getPresignedUploadUrl(jobId: string, fileName: string): Promise<PresignedUploadUrl> {
    const { data } = await this.client.post<ApiResponse<PresignedUploadUrl>>(
      `/jobs/${jobId}/photos/upload-url`,
      { fileName }
    );
    return data.data;
  }

  async uploadPhotoToPresignedUrl(url: string, file: Blob): Promise<void> {
    await axios.put(url, file, {
      headers: {
        'Content-Type': file.type,
      },
    });
  }

  async confirmPhotoUpload(
    jobId: string,
    photoId: string,
    uploadedUrl: string,
    idempotencyKey: string
  ): Promise<void> {
    const headers = { 'Idempotency-Key': idempotencyKey };

    await this.client.post(
      `/jobs/${jobId}/photos/${photoId}/confirm`,
      { uploadedUrl },
      { headers }
    );
  }

  // Signature methods
  async uploadSignature(
    jobId: string,
    signatureData: { type: string; data: string; signerName?: string },
    idempotencyKey: string
  ): Promise<void> {
    const headers = { 'Idempotency-Key': idempotencyKey };

    await this.client.post(`/jobs/${jobId}/signatures`, signatureData, { headers });
  }

  // Time entry methods
  async createTimeEntry(
    jobId: string,
    timeEntryData: { startTime: string; endTime?: string; notes?: string },
    idempotencyKey: string
  ): Promise<void> {
    const headers = { 'Idempotency-Key': idempotencyKey };

    await this.client.post(`/jobs/${jobId}/time-entries`, timeEntryData, { headers });
  }

  async updateTimeEntry(
    jobId: string,
    timeEntryId: string,
    updates: { endTime: string; notes?: string },
    idempotencyKey: string
  ): Promise<void> {
    const headers = { 'Idempotency-Key': idempotencyKey };

    await this.client.put(`/jobs/${jobId}/time-entries/${timeEntryId}`, updates, { headers });
  }

  // Form Assignment methods
  async getFormAssignments(params?: {
    status?: string;
    assignedType?: string;
  }): Promise<PaginatedResponse<any>> {
    const { data } = await this.client.get<PaginatedResponse<any>>('/forms/assignments', { params });
    return data;
  }

  async getFormAssignmentById(id: string): Promise<any> {
    const { data } = await this.client.get<ApiResponse<any>>(`/forms/assignments/${id}`);
    return data.data;
  }

  async submitFormResponse(
    assignmentId: string,
    responseData: {
      responses: Record<string, any>;
      latitude?: number;
      longitude?: number;
      deviceInfo?: any;
    },
    idempotencyKey: string
  ): Promise<any> {
    const headers = { 'Idempotency-Key': idempotencyKey };

    const { data } = await this.client.post<ApiResponse<any>>(
      `/forms/assignments/${assignmentId}/submit`,
      responseData,
      { headers }
    );
    return data.data;
  }

  async getFormResponse(id: string): Promise<any> {
    const { data } = await this.client.get<ApiResponse<any>>(`/forms/responses/${id}`);
    return data.data;
  }

  // Asset methods
  async getAssets(params?: {
    siteId?: string;
    customerId?: string;
    search?: string;
  }): Promise<PaginatedResponse<any>> {
    const { data } = await this.client.get<PaginatedResponse<any>>('/assets', { params });
    return data;
  }

  async getAssetById(id: string): Promise<any> {
    const { data } = await this.client.get<ApiResponse<any>>(`/assets/${id}`);
    return data.data;
  }

  async updateAssetStatus(
    id: string,
    statusUpdate: { status: string; notes?: string },
    idempotencyKey: string
  ): Promise<any> {
    const headers = { 'Idempotency-Key': idempotencyKey };

    const { data } = await this.client.patch<ApiResponse<any>>(
      `/assets/${id}/status`,
      statusUpdate,
      { headers }
    );
    return data.data;
  }

  // Document methods
  async getDocuments(params?: {
    jobId?: string;
    customerId?: string;
    type?: string;
    search?: string;
  }): Promise<PaginatedResponse<any>> {
    const { data } = await this.client.get<PaginatedResponse<any>>('/documents', { params });
    return data;
  }

  async getDocumentById(id: string): Promise<any> {
    const { data } = await this.client.get<ApiResponse<any>>(`/documents/${id}`);
    return data.data;
  }

  async getDocumentDownloadUrl(id: string): Promise<{ downloadUrl: string }> {
    const { data } = await this.client.get<ApiResponse<{ downloadUrl: string }>>(
      `/documents/${id}/download`
    );
    return data.data;
  }

  async uploadDocument(
    documentData: {
      name: string;
      type: string;
      jobId?: string;
      customerId?: string;
      file: Blob;
    },
    idempotencyKey: string
  ): Promise<any> {
    const headers = { 'Idempotency-Key': idempotencyKey };
    const formData = new FormData();

    formData.append('name', documentData.name);
    formData.append('type', documentData.type);
    if (documentData.jobId) formData.append('jobId', documentData.jobId);
    if (documentData.customerId) formData.append('customerId', documentData.customerId);
    formData.append('file', documentData.file);

    const { data } = await this.client.post<ApiResponse<any>>(
      '/documents',
      formData,
      {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data',
        }
      }
    );
    return data.data;
  }

  // Generic request method for custom calls
  async request<T>(config: {
    method: string;
    url: string;
    data?: any;
    params?: any;
    headers?: Record<string, string>;
  }): Promise<T> {
    const { data } = await this.client.request<T>(config);
    return data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export error handler helper
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.status === 401) {
      return 'Unauthorized. Please login again.';
    }
    if (error.response?.status === 403) {
      return 'You do not have permission to perform this action.';
    }
    if (error.response?.status === 404) {
      return 'Resource not found.';
    }
    if (error.response?.status >= 500) {
      return 'Server error. Please try again later.';
    }
    if (error.message === 'Network Error') {
      return 'Network error. Please check your connection.';
    }
  }
  return 'An unexpected error occurred.';
};

export default apiClient;
