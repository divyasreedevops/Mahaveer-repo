import apiClient from './client';
import type { ApiResponse } from '@/types';

export const otpService = {
  sendOtp: async (mobileNumber: string, email?: string): Promise<ApiResponse<{ otp?: string }>> => {
    try {
      const response = await apiClient.post('/Otp/send', { mobileNumber, email });
      return { success: true, data: response.data };
    } catch (error: any) {
      if (error.status === 400) return { success: false, message: error.message || 'Mobile number is required' };
      return { success: false, message: error.message || 'Failed to send OTP. Please try again.' };
    }
  },

  verifyOtp: async (mobileNumber: string, otp: string): Promise<ApiResponse<{ isValid: boolean }>> => {
    try {
      const response = await apiClient.post('/Otp/verify', { mobileNumber, otp });
      const data = response.data;
      // Handle invalid OTP (200 response with isValid: false)
      if (data?.isValid === false) {
        return { success: false, message: data.message || 'Invalid OTP. Please check and try again.' };
      }
      return { success: true, data };
    } catch (error: any) {
      if (error.status === 400) return { success: false, message: error.message || 'Mobile number and OTP are required' };
      return { success: false, message: error.message || 'OTP verification failed. Please try again.' };
    }
  },
};
