import apiClient from './client';
import type { ApiResponse, IncomeLevel } from '@/types';

export const commonService = {
  /**
   * Get income levels for KYC approval
   * Backend returns: IncomeLevel[] directly
   */
  getIncomeLevels: async (): Promise<ApiResponse<IncomeLevel[]>> => {
    if (__DEV__) console.log('[CommonService] getIncomeLevels - Fetching income levels');
    try {
      const response = await apiClient.get('/Common/GetIncomeLevels');
      if (__DEV__) console.log('[CommonService] getIncomeLevels - Fetched', response.data?.length || 0, 'levels');
      return { success: true, data: Array.isArray(response.data) ? response.data : [] };
    } catch (error: any) {
      if (__DEV__) console.error('[CommonService] getIncomeLevels - Error:', error.message);
      return { success: false, data: [], message: error.message || 'Failed to fetch income levels' };
    }
  },
};
