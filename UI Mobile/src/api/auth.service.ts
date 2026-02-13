import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './client';
import type { ApiResponse, LoginRequest } from '@/types';

export const authService = {
  loginAdmin: async (credentials: LoginRequest): Promise<ApiResponse<{ isAuthenticated: boolean }>> => {
    if (__DEV__) console.log('[AuthService] loginAdmin - Starting admin login for:', credentials.username);
    try {
      const response = await apiClient.post('/Login/admin', credentials);
      const data = response.data;
      if (data?.isAuthenticated || data === true) {
        await AsyncStorage.setItem('auth_token', 'authenticated');
        await AsyncStorage.setItem('username', credentials.username);
        await AsyncStorage.setItem('user_role', 'admin');
        if (__DEV__) console.log('[AuthService] loginAdmin - Admin login successful');
        return { success: true, data: { isAuthenticated: true } };
      }
      if (__DEV__) console.log('[AuthService] loginAdmin - Login failed:', data?.message);
      return { success: false, message: data?.message || 'Invalid credentials' };
    } catch (error: any) {
      if (__DEV__) console.error('[AuthService] loginAdmin - Error:', error.message);
      const status = error.status;
      if (status === 400) return { success: false, message: error.message || 'Username and password are required' };
      if (status === 401) return { success: false, message: error.message || 'Invalid credentials' };
      return { success: false, message: error.message || 'Login failed. Please try again.' };
    }
  },

  loginPatient: async (mobileNumber: string): Promise<ApiResponse<{ mobileNumber: string; otp?: string }>> => {
    if (__DEV__) console.log('[AuthService] loginPatient - Starting patient login for:', mobileNumber);
    try {
      const response = await apiClient.post('/Patient/Register', { mobileNumber });
      const data = response.data;
      await AsyncStorage.setItem('patient_mobile', mobileNumber);
      if (__DEV__) console.log('[AuthService] loginPatient - OTP sent successfully');
      return { success: true, data };
    } catch (error: any) {
      if (__DEV__) console.error('[AuthService] loginPatient - Error:', error.message);
      if (error.status === 400) return { success: false, message: error.message || 'Mobile number is required' };
      return { success: false, message: error.message || 'Failed to send OTP. Please try again.' };
    }
  },

  verifyOtp: async (mobileNumber: string, otp: string): Promise<ApiResponse<{ patientId: string; isValid: boolean }>> => {
    if (__DEV__) console.log('[AuthService] verifyOtp - Verifying OTP for:', mobileNumber);
    try {
      const response = await apiClient.post('/Patient/verify', { mobileNumber, otp });
      const data = response.data;
      // Handle invalid OTP (200 response with isValid: false)
      if (data?.isValid === false) {
        if (__DEV__) console.log('[AuthService] verifyOtp - Invalid OTP');
        return { success: false, message: data.message || 'Invalid OTP. Please check and try again.' };
      }
      if (data?.patientId) {
        await AsyncStorage.setItem('auth_token', 'patient_authenticated');
        await AsyncStorage.setItem('user_role', 'patient');
        if (__DEV__) console.log('[AuthService] verifyOtp - OTP verified successfully, patientId:', data.patientId);
        return { success: true, data };
      }
      if (__DEV__) console.log('[AuthService] verifyOtp - Verification failed');
      return { success: false, message: data?.message || 'Invalid OTP. Please check and try again.' };
    } catch (error: any) {
      if (__DEV__) console.error('[AuthService] verifyOtp - Error:', error.message);
      if (error.status === 400) return { success: false, message: error.message || 'Mobile number and OTP are required' };
      return { success: false, message: error.message || 'OTP verification failed. Please try again.' };
    }
  },

  logout: async (): Promise<void> => {
    if (__DEV__) console.log('[AuthService] logout - Logging out user');
    try {
      await apiClient.post('/Login/logout');
    } catch (error) {
      if (__DEV__) console.error('[AuthService] logout - API call failed, proceeding with local cleanup');
      // Proceed with local cleanup regardless
    }
    await AsyncStorage.multiRemove(['auth_token', 'username', 'user_role', 'patient_mobile', 'patient_data', 'patient_id', 'last_user_data', 'profile_complete']);
    if (__DEV__) console.log('[AuthService] logout - Logout complete');
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
