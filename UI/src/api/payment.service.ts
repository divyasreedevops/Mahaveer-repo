import apiClient from './client';
import type {
  ApiResponse,
  CreateOrderRequest,
  PaymentOrder,
  VerifyPaymentRequest,
  PaymentVerificationResponse,
} from '@/types';

/**
 * Payment service - Razorpay integration
 */
export const paymentService = {
  /**
   * Get Razorpay public key
   */
  async getRazorpayKey(): Promise<ApiResponse<{ key: string }>> {
    try {
      const response = await apiClient.get('/Payment/key');
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch payment key',
      };
    }
  },

  /**
   * Create a Razorpay payment order
   * Amount is in INR, backend converts to paise
   */
  async createOrder(data: CreateOrderRequest): Promise<ApiResponse<PaymentOrder>> {
    try {
      const response = await apiClient.post('/Payment/create-order', data);
      return {
        success: true,
        data: response.data,
        message: 'Order created successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create order',
      };
    }
  },

  /**
   * Verify payment signature from Razorpay
   */
  async verifyPayment(data: VerifyPaymentRequest): Promise<ApiResponse<PaymentVerificationResponse>> {
    try {
      const response = await apiClient.post('/Payment/verify', data);
      return {
        success: response.data.success,
        data: response.data,
        message: response.data.message || (response.data.success ? 'Payment verified' : 'Payment verification failed'),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Verification failed',
      };
    }
  },
};

export default paymentService;
