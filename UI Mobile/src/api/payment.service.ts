import apiClient from './client';
import type {
  ApiResponse,
  CreateOrderRequest,
  PaymentOrder,
  VerifyPaymentRequest,
  PaymentVerificationResponse,
} from '@/types';

export const paymentService = {
  /**
   * Get Razorpay public key
   */
  getRazorpayKey: async (): Promise<ApiResponse<{ key: string }>> => {
    if (__DEV__) console.log('[PaymentService] getRazorpayKey - Fetching Razorpay key');
    try {
      const response = await apiClient.get('/Payment/key');
      if (__DEV__) console.log('[PaymentService] getRazorpayKey - Key fetched successfully');
      return { success: true, data: response.data };
    } catch (error: any) {
      if (__DEV__) console.error('[PaymentService] getRazorpayKey - Error:', error.message);
      return { success: false, message: error.message || 'Failed to fetch payment key' };
    }
  },

  /**
   * Create a Razorpay payment order
   * Amount is in INR, backend converts to paise
   */
  createOrder: async (data: CreateOrderRequest): Promise<ApiResponse<PaymentOrder>> => {
    if (__DEV__) console.log('[PaymentService] createOrder - Creating order for patient:', data.patientId, 'amount:', data.amount);
    try {
      const response = await apiClient.post('/Payment/create-order', data);
      if (__DEV__) console.log('[PaymentService] createOrder - Order created:', response.data?.orderId);
      return { success: true, data: response.data, message: 'Order created successfully' };
    } catch (error: any) {
      if (__DEV__) console.error('[PaymentService] createOrder - Error:', error.message);
      return { success: false, message: error.message || 'Failed to create order' };
    }
  },

  /**
   * Verify payment signature from Razorpay
   */
  verifyPayment: async (data: VerifyPaymentRequest): Promise<ApiResponse<PaymentVerificationResponse>> => {
    if (__DEV__) console.log('[PaymentService] verifyPayment - Verifying payment:', data.paymentId);
    try {
      const response = await apiClient.post('/Payment/verify', data);
      if (__DEV__) console.log('[PaymentService] verifyPayment - Result:', response.data?.success ? 'verified' : 'failed');
      return {
        success: response.data.success,
        data: response.data,
        message: response.data.message || (response.data.success ? 'Payment verified' : 'Payment verification failed'),
      };
    } catch (error: any) {
      if (__DEV__) console.error('[PaymentService] verifyPayment - Error:', error.message);
      return { success: false, message: error.message || 'Verification failed' };
    }
  },
};
