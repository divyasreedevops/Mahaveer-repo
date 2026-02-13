import apiClient from './client';
import type {
  LoginRequest,
  ApiResponse,
  UserRole,
} from '@/types';

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: UserRole;
  };
}

/**
 * Authentication service
 */
export const authService = {
  /**
   * Admin login
   * Backend returns: {message: "Login successful", isAuthenticated: true}
   */
  async loginAdmin(credentials: LoginRequest): Promise<ApiResponse<{isAuthenticated: boolean}>> {
    try {
      const response = await apiClient.post('/Login/admin', credentials);
      
      // Backend returns: {message: "...", isAuthenticated: true/false}
      const data = response.data;
      
      if (data.isAuthenticated) {
        // Store a session flag since backend doesn't return token
        localStorage.setItem('auth_token', 'authenticated');
        if (credentials.username) {
          localStorage.setItem('username', credentials.username);
        }
        return {
          success: true,
          data: { isAuthenticated: true },
          message: data.message || 'Login successful',
        };
      }
      
      return {
        success: false,
        error: data.message || 'Invalid credentials',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Invalid credentials',
      };
    }
  },

  /**
   * Patient login/register - Uses Patient/Register endpoint
   * Backend returns: {message, mobileNumber, otp} (otp only in dev)
   */
  async loginPatient(mobileNumber: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post('/Patient/Register', { mobileNumber });
      const data = response.data;
      
      // Backend returns {message, mobileNumber, otp} — no token at this stage
      // Auth happens after OTP verification
      return {
        success: true,
        data: data,
        message: data.message || 'OTP sent successfully',
      };
    } catch (error: any) {
      if (error.response?.status === 400) {
        return { success: false, error: 'Mobile number is required' };
      }
      return {
        success: false,
        error: error.message || 'Failed to send OTP',
      };
    }
  },

  /**
   * Logout
   */
  async logout(): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.post('/Login/logout');
      localStorage.removeItem('auth_token');
      // Backend returns: {message: "Logged out successfully"}
      return {
        success: true,
        message: response.data.message || 'Logged out successfully',
      };
    } catch (error: any) {
      // Clear token even if API call fails
      localStorage.removeItem('auth_token');
      return {
        success: true,
        message: 'Logged out successfully',
      };
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  },

  /**
   * Get current auth token
   */
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },
};

export default authService;
