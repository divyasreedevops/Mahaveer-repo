import apiClient from './client';
import type {
  ApiResponse,
  ApproveKycRequest,
  UpdateRegistrationStatusRequest,
} from '@/types';

/**
 * Admin service for administrative tasks
 */
export const adminService = {
  /**
   * Approve KYC - Sets income level for patient
   * Backend returns: { message: "KYC approved successfully" }
   */
  async approveKyc(data: ApproveKycRequest): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.post('/Admin/ApproveKyc', {
        id: data.id,
        incomeLevel: data.incomeLevel,
      });
      return {
        success: true,
        message: response.data.message || 'KYC approved successfully',
      };
    } catch (error: any) {
      const status = error.status || error.response?.status;
      if (status === 404) return { success: false, error: error.message || 'Patient not found' };
      if (status === 400) return { success: false, error: error.message || 'Invalid request data' };
      return {
        success: false,
        error: error.message || 'Failed to approve KYC',
      };
    }
  },

  /**
   * Update patient registration status (Approve/Reject)
   * Backend returns: { message: "Registration status updated successfully" }
   */
  async updateRegistrationStatus(data: UpdateRegistrationStatusRequest): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.post('/Admin/UpdateRegistrationStatus', {
        id: data.id,
        patientId: data.patientId,
        registrationStatus: data.registrationStatus,
      });
      return {
        success: true,
        message: response.data.message || 'Registration status updated successfully',
      };
    } catch (error: any) {
      const status = error.status || error.response?.status;
      if (status === 404) return { success: false, error: error.message || 'Patient not found' };
      return {
        success: false,
        error: error.message || 'Failed to update registration status',
      };
    }
  },
};

export default adminService;
