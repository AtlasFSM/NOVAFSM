import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth-store';
import { api } from '@/lib/api-client';
import type { LoginRequest, RegisterRequest } from '@/types/api';

export function useAuth() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const { user, isAuthenticated, login: setLogin, logout: setLogout } = useAuthStore();

  const login = useCallback(
    async (credentials: LoginRequest) => {
      setIsLoading(true);
      try {
        const response = await api.login(credentials);

        if (response.requiresMfa) {
          toast.info('MFA code required. Please enter your MFA code.');
          return { requiresMfa: true };
        }

        setLogin(response.user, response.tokens);
        toast.success('Login successful!');
        router.push('/dashboard');
        return { requiresMfa: false };
      } catch (error: any) {
        const message =
          error.response?.data?.message ||
          error.response?.data?.error?.message ||
          'Login failed. Please check your credentials.';
        toast.error(message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [router, setLogin]
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      setIsLoading(true);
      try {
        const response = await api.register(data);

        setLogin(response.user, response.tokens);
        toast.success('Registration successful! Welcome to NoVaFSM.');
        router.push('/dashboard');
      } catch (error: any) {
        const message =
          error.response?.data?.message ||
          error.response?.data?.error?.message ||
          'Registration failed. Please try again.';
        toast.error(message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [router, setLogin]
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await api.logout();
      setLogout();
      toast.success('Logged out successfully.');
      router.push('/login');
    } catch (error: any) {
      console.error('Logout error:', error);
      // Still clear local state even if API call fails
      setLogout();
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  }, [router, setLogout]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  };
}
