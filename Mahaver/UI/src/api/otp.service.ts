import apiClient from './client';
import type { OtpRequest, VerifyOtpRequest, ApiResponse } from '@/types';

/**
 * OTP service
 */
export const otpService = {
  /**
   * Send OTP to mobile number
   */
  async sendOtp(data: OtpRequest): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post('/Otp/send', data);
      // Backend returns: {message: "OTP sent successfully", ...otherData}
      return {
        success: true,
        data: response.data,
        message: response.data.message || 'OTP sent successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send OTP',
      };
    }
  },

  /**
   * Verify OTP
   * Backend returns: {message: "OTP verified successfully", isValid: true}
   */
  async verifyOtp(data: VerifyOtpRequest): Promise<ApiResponse<{ isValid: boolean }>> {
    try {
      const response = await apiClient.post('/Otp/verify', data);
      // Backend returns: {message: "...", isValid: true/false}
      const isValid = response.data.isValid === true;
      
      return {
        success: isValid,
        data: { isValid },
        message: response.data.message || (isValid ? 'OTP verified successfully' : 'Invalid OTP'),
      };
    } catch (error: any) {
      return {
        success: false,
        data: { isValid: false },
        error: error.message || 'Invalid OTP',
      };
    }
  },
};

export default otpService;
