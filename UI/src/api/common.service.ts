import apiClient from './client';
import type { ApiResponse, IncomeLevel } from '@/types';

/**
 * Common service - shared lookup data
 */
export const commonService = {
  /**
   * Get income levels for KYC approval
   * Backend returns: IncomeLevel[] directly
   */
  async getIncomeLevels(): Promise<ApiResponse<IncomeLevel[]>> {
    try {
      const response = await apiClient.get<IncomeLevel[]>('/Common/GetIncomeLevels');
      const data = Array.isArray(response.data) ? response.data : [];
      return {
        success: true,
        data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message || 'Failed to fetch income levels',
      };
    }
  },
};

export default commonService;
