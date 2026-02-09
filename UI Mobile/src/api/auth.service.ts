import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './client';
import type { ApiResponse, LoginRequest } from '@/types';

export const authService = {
  loginAdmin: async (credentials: LoginRequest): Promise<ApiResponse<{ isAuthenticated: boolean }>> => {
    try {
      const response = await apiClient.post('/Login/admin', credentials);
      const data = response.data;
      if (data?.isAuthenticated || data === true) {
        await AsyncStorage.setItem('auth_token', 'authenticated');
        await AsyncStorage.setItem('username', credentials.username);
        await AsyncStorage.setItem('user_role', 'admin');
        return { success: true, data: { isAuthenticated: true } };
      }
      return { success: false, message: data?.message || 'Invalid credentials' };
    } catch (error: any) {
      const status = error.status;
      if (status === 400) return { success: false, message: error.message || 'Username and password are required' };
      if (status === 401) return { success: false, message: error.message || 'Invalid credentials' };
      return { success: false, message: error.message || 'Login failed. Please try again.' };
    }
  },

  loginPatient: async (mobileNumber: string, email?: string): Promise<ApiResponse<{ mobileNumber: string; otp?: string }>> => {
    try {
      const response = await apiClient.post('/Patient/Register', { mobileNumber, email: email || '' });
      const data = response.data;
      await AsyncStorage.setItem('patient_mobile', mobileNumber);
      return { success: true, data };
    } catch (error: any) {
      if (error.status === 400) return { success: false, message: error.message || 'Mobile number is required' };
      return { success: false, message: error.message || 'Failed to send OTP. Please try again.' };
    }
  },

  verifyOtp: async (mobileNumber: string, otp: string): Promise<ApiResponse<{ patientId: string; isValid: boolean }>> => {
    try {
      const response = await apiClient.post('/Patient/verify', { mobileNumber, otp });
      const data = response.data;
      // Handle invalid OTP (200 response with isValid: false)
      if (data?.isValid === false) {
        return { success: false, message: data.message || 'Invalid OTP. Please check and try again.' };
      }
      if (data?.patientId) {
        await AsyncStorage.setItem('auth_token', 'patient_authenticated');
        await AsyncStorage.setItem('user_role', 'patient');
        return { success: true, data };
      }
      return { success: false, message: data?.message || 'Invalid OTP. Please check and try again.' };
    } catch (error: any) {
      if (error.status === 400) return { success: false, message: error.message || 'Mobile number and OTP are required' };
      return { success: false, message: error.message || 'OTP verification failed. Please try again.' };
    }
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/Login/logout');
    } catch {
      // Proceed with local cleanup regardless
    }
    await AsyncStorage.multiRemove(['auth_token', 'username', 'user_role', 'patient_mobile', 'patient_data', 'patient_id', 'last_user_data', 'profile_complete']);
  },

  isAuthenticated: async (): Promise<boolean> => {
    const token = await AsyncStorage.getItem('auth_token');
    return !!token;
  },

  getUserRole: async (): Promise<string | null> => {
    return AsyncStorage.getItem('user_role');
  },

  getUsername: async (): Promise<string | null> => {
    return AsyncStorage.getItem('username');
  },
};
