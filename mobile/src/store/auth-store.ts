import { create } from 'zustand';
import { User, LoginCredentials } from '../types';
import { apiClient } from '../services/api';
import { clearAllData } from '../services/database';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,

  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await apiClient.login(credentials);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Login failed. Please try again.',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await apiClient.logout();
      await clearAllData(); // Clear local database on logout
      set({ user: null, isAuthenticated: false, isLoading: false });
    } catch (error) {
      console.error('Logout failed:', error);
      // Clear local state anyway
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  loadUser: async () => {
    set({ isLoading: true });
    try {
      const isAuth = await apiClient.isAuthenticated();
      if (isAuth) {
        const user = await apiClient.getStoredUser();
        if (user) {
          set({ user, isAuthenticated: true, isLoading: false });
        } else {
          // Try to fetch from server
          const fetchedUser = await apiClient.getCurrentUser();
          set({ user: fetchedUser, isAuthenticated: true, isLoading: false });
        }
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
