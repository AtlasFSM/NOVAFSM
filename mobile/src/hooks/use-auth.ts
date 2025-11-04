import { useAuthStore } from '../store/auth-store';

export const useAuth = () => {
  const {
    user,
    isLoading,
    isAuthenticated,
    error,
    login,
    logout,
    loadUser,
    clearError,
  } = useAuthStore();

  return {
    user,
    isLoading,
    isAuthenticated,
    error,
    login,
    logout,
    loadUser,
    clearError,
  };
};
