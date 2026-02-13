import apiClient from './client';
import type { InventoryItem, ApiResponse } from '@/types';

/**
 * Inventory service
 */
export const inventoryService = {
  /**
   * Get all inventory items
   * Backend returns: InventoryItem[] directly (not wrapped)
   */
  async getInventoryList(): Promise<ApiResponse<InventoryItem[]>> {
    try {
      const response = await apiClient.get<InventoryItem[]>(
        '/Inventory/GetInventoryList'
      );
      
      // Backend returns array directly
      const data = Array.isArray(response.data) ? response.data : [];
      
      return {
        success: true,
        data: data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message || 'Failed to fetch inventory',
      };
    }
  },

  /**
   * Save inventory items (batch update/create)
   * Backend returns: { message: "Items saved successfully", count: N }
   */
  async saveInventory(items: InventoryItem[]): Promise<ApiResponse<{ message: string; count: number }>> {
    try {
      const response = await apiClient.post('/Inventory/save', items);
      return {
        success: true,
        data: response.data,
        message: response.data.message || 'Items saved successfully',
      };
    } catch (error: any) {
      const status = error.status || error.response?.status;
      if (status === 400) return { success: false, error: error.message || 'At least one item is required' };
      return {
        success: false,
        error: error.message || 'Failed to save inventory',
      };
    }
  },

  /**
   * Add a single inventory item (wraps in array for the batch endpoint)
   * Backend returns: { message: "Items saved successfully", count: N }
   */
  async addInventoryItem(item: InventoryItem): Promise<ApiResponse<{ message: string; count: number }>> {
    try {
      const response = await apiClient.post('/Inventory/save', [item]);
      return {
        success: true,
        data: response.data,
        message: response.data.message || 'Item added successfully',
      };
    } catch (error: any) {
      const status = error.status || error.response?.status;
      if (status === 400) return { success: false, error: error.message || 'Invalid item data' };
      return {
        success: false,
        error: error.message || 'Failed to add item',
      };
    }
  },

  /**
   * Update a single inventory item (wraps in array for the batch endpoint)
   * Backend returns: { message: "Items saved successfully", count: N }
   */
  async updateInventoryItem(item: InventoryItem): Promise<ApiResponse<{ message: string; count: number }>> {
    try {
      const response = await apiClient.post('/Inventory/save', [item]);
      return {
        success: true,
        data: response.data,
        message: response.data.message || 'Item updated successfully',
      };
    } catch (error: any) {
      const status = error.status || error.response?.status;
      if (status === 400) return { success: false, error: error.message || 'Invalid item data' };
      return {
        success: false,
        error: error.message || 'Failed to update item',
      };
    }
  },

  /**
   * Delete a single inventory item (soft delete)
   * Uses query params: inventoryId and userId
   * Backend returns: { message: "Inventory item deleted successfully" }
   */
  async deleteInventoryItem(id: number, userId: number = 1): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete(`/Inventory?inventoryId=${id}&userId=${userId}`);
      return {
        success: true,
        message: response.data.message || 'Item deleted successfully',
      };
    } catch (error: any) {
      const status = error.status || error.response?.status;
      if (status === 404) return { success: false, error: error.message || 'Inventory item not found' };
      return {
        success: false,
        error: error.message || 'Failed to delete item',
      };
    }
  },
};

export default inventoryService;
