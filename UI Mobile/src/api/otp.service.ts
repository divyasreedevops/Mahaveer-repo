import apiClient from './client';
import type { ApiResponse } from '@/types';

export const otpService = {
  sendOtp: async (mobileNumber: string): Promise<ApiResponse<{ mobileNumber: string }>> => {
    if (__DEV__) console.log('[OtpService] sendOtp - Sending OTP to:', mobileNumber);
    try {
      const response = await apiClient.post('/Otp/send', { mobileNumber });
      if (__DEV__) console.log('[OtpService] sendOtp - OTP sent successfully');
      return { success: true, data: response.data };
    } catch (error: any) {
      if (__DEV__) console.error('[OtpService] sendOtp - Error:', error.message);
      if (error.status === 400) return { success: false, message: error.message || 'Mobile number is required' };
      return { success: false, message: error.message || 'Failed to send OTP. Please try again.' };
    }
  },

  verifyOtp: async (mobileNumber: string, otp: string): Promise<ApiResponse<{ isValid: boolean }>> => {
    if (__DEV__) console.log('[OtpService] verifyOtp - Verifying OTP for:', mobileNumber);
    try {
      const response = await apiClient.post('/Otp/verify', { mobileNumber, otp });
      const data = response.data;
      // Handle invalid OTP (200 response with isValid: false)
      if (data?.isValid === false) {
        if (__DEV__) console.log('[OtpService] verifyOtp - Invalid OTP');
        return { success: false, message: data.message || 'Invalid OTP. Please check and try again.' };
      }
      if (__DEV__) console.log('[OtpService] verifyOtp - OTP verified successfully');
      return { success: true, data };
    } catch (error: any) {
      if (__DEV__) console.error('[OtpService] verifyOtp - Error:', error.message);
      if (error.status === 400) return { success: false, message: error.message || 'Mobile number and OTP are required' };
      return { success: false, message: error.message || 'OTP verification failed. Please try again.' };
    }
  },
};
