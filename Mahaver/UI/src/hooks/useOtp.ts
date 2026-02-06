import { useState, useCallback } from 'react';
import { otpService } from '@/api';
import type { OtpRequest, VerifyOtpRequest } from '@/types';

interface OtpState {
  isLoading: boolean;
  error: string | null;
  isVerified: boolean;
}

/**
 * Hook for OTP operations
 */
export function useOtp() {
  const [state, setState] = useState<OtpState>({
    isLoading: false,
    error: null,
    isVerified: false,
  });

  const sendOtp = useCallback(async (data: OtpRequest) => {
    setState({ isLoading: true, error: null, isVerified: false });
    
    try {
      const response = await otpService.sendOtp(data);
      
      if (response.success) {
        setState({ isLoading: false, error: null, isVerified: false });
        return { success: true };
      } else {
        const errorMessage = response.error || 'Failed to send OTP';
        setState({ isLoading: false, error: errorMessage, isVerified: false });
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = (error as Error).message || 'An error occurred';
      setState({ isLoading: false, error: errorMessage, isVerified: false });
      return { success: false, error: errorMessage };
    }
  }, []);

  const verifyOtp = useCallback(async (data: VerifyOtpRequest) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await otpService.verifyOtp(data);
      
      if (response.success && response.data?.isValid) {
        setState({ isLoading: false, error: null, isVerified: true });
        return { success: true, isValid: true };
      } else {
        const errorMessage = response.error || 'Invalid OTP';
        setState({ isLoading: false, error: errorMessage, isVerified: false });
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = (error as Error).message || 'An error occurred';
      setState({ isLoading: false, error: errorMessage, isVerified: false });
      return { success: false, error: errorMessage };
    }
  }, []);

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null, isVerified: false });
  }, []);

  return {
    isLoading: state.isLoading,
    error: state.error,
    isVerified: state.isVerified,
    sendOtp,
    verifyOtp,
    reset,
  };
}

export default useOtp;
