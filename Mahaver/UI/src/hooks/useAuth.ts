import { useState, useCallback } from 'react';
import { authService } from '@/api';
import type { LoginRequest, UserRole, ApiResponse } from '@/types';

interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Custom hook for authentication
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: authService.isAuthenticated(),
    isLoading: false,
    error: null,
  });

  const login = useCallback(async (credentials: LoginRequest) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await authService.loginAdmin(credentials);
      
      if (response.success && response.data?.isAuthenticated) {
        // Backend doesn't return user object, create minimal user from credentials
        const user = {
          id: 1, // Default as backend doesn't provide
          username: credentials.username || 'admin',
          email: credentials.username + '@pharmacare.com',
          role: 'admin' as UserRole,
        };
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return { success: true, user };
      } else {
        const errorMessage = response.error || 'Login failed';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = (error as Error).message || 'An error occurred during login';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    
    try {
      await authService.logout();
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Clear state anyway
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    login,
    logout,
    clearError,
  };
}

export default useAuth;
