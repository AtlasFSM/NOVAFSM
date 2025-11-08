import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import {
  User,
  AuthTokens,
  LoginCredentials,
  Job,
  Asset,
  Document,
  Form,
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

  // Asset methods
  async getAssets(params?: {
    status?: string;
    category?: string;
  }): Promise<PaginatedResponse<Asset>> {
    const { data } = await this.client.get<PaginatedResponse<Asset>>('/assets', { params });
    return data;
  }

  async getAssetById(id: string): Promise<Asset> {
    const { data } = await this.client.get<ApiResponse<Asset>>(`/assets/${id}`);
    return data.data;
  }

  async updateAsset(
    id: string,
    updates: Partial<Asset>,
    idempotencyKey?: string
  ): Promise<Asset> {
    const headers = idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {};

    const { data } = await this.client.put<ApiResponse<Asset>>(
      `/assets/${id}`,
      updates,
      { headers }
    );
    return data.data;
  }

  // Document methods
  async getDocuments(params?: {
    type?: string;
    jobId?: string;
    assetId?: string;
  }): Promise<PaginatedResponse<Document>> {
    const { data } = await this.client.get<PaginatedResponse<Document>>('/documents', { params });
    return data;
  }

  async getDocumentById(id: string): Promise<Document> {
    const { data } = await this.client.get<ApiResponse<Document>>(`/documents/${id}`);
    return data.data;
  }

  async getDocumentPresignedUploadUrl(fileName: string, mimeType: string): Promise<PresignedUploadUrl> {
    const { data } = await this.client.post<ApiResponse<PresignedUploadUrl>>(
      '/documents/upload-url',
      { fileName, mimeType }
    );
    return data.data;
  }

  async confirmDocumentUpload(
    documentId: string,
    uploadedUrl: string,
    metadata: {
      name: string;
      type: string;
      mimeType: string;
      size: number;
      jobId?: string;
      assetId?: string;
      description?: string;
    },
    idempotencyKey: string
  ): Promise<void> {
    const headers = { 'Idempotency-Key': idempotencyKey };

    await this.client.post(
      `/documents/${documentId}/confirm`,
      { uploadedUrl, ...metadata },
      { headers }
    );
  }

  // Form methods
  async getForms(params?: {
    status?: string;
    jobId?: string;
    templateId?: string;
  }): Promise<PaginatedResponse<Form>> {
    const { data } = await this.client.get<PaginatedResponse<Form>>('/forms', { params });
    return data;
  }

  async getFormById(id: string): Promise<Form> {
    const { data } = await this.client.get<ApiResponse<Form>>(`/forms/${id}`);
    return data.data;
  }

  async createForm(
    formData: {
      templateId: string;
      jobId?: string;
      fields: any[];
    },
    idempotencyKey: string
  ): Promise<Form> {
    const headers = { 'Idempotency-Key': idempotencyKey };

    const { data } = await this.client.post<ApiResponse<Form>>(
      '/forms',
      formData,
      { headers }
    );
    return data.data;
  }

  async updateForm(
    id: string,
    updates: {
      status?: string;
      fields?: any[];
    },
    idempotencyKey?: string
  ): Promise<Form> {
    const headers = idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {};

    const { data } = await this.client.put<ApiResponse<Form>>(
      `/forms/${id}`,
      updates,
      { headers }
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
    if (error.response && error.response.status >= 500) {
      return 'Server error. Please try again later.';
    }
    if (error.message === 'Network Error') {
      return 'Network error. Please check your connection.';
    }
  }
  return 'An unexpected error occurred.';
};

export default apiClient;
