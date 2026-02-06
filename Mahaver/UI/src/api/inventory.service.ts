import apiClient from './client';
import type { InventoryItem, ApiResponse } from '@/types';

/**
 * Inventory service
 */
export const inventoryService = {
  /**
   * Get all inventory items
   */
  async getInventoryList(): Promise<ApiResponse<InventoryItem[]>> {
    try {
      const response = await apiClient.get<InventoryItem[] | ApiResponse<InventoryItem[]>>(
        '/Inventory/GetInventoryList'
      );
      
      // Handle both wrapped and unwrapped responses
      const data = Array.isArray(response.data)
        ? response.data
        : (response.data as any).data || [];
      
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
   */
  async saveInventory(items: InventoryItem[]): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.post('/Inventory/save', items);
      // Backend returns: {message: "Inventory saved successfully"}
      return {
        success: true,
        message: response.data.message || 'Inventory saved successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to save inventory',
      };
    }
  },

  /**
   * Add a single inventory item
   */
  async addInventoryItem(item: InventoryItem): Promise<ApiResponse<InventoryItem>> {
    try {
      const response = await apiClient.post('/Inventory/save', [item]);
      return {
        success: true,
        data: response.data,
        message: response.data.message || 'Item added successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to add item',
      };
    }
  },

  /**
   * Update a single inventory item
   */
  async updateInventoryItem(item: InventoryItem): Promise<ApiResponse<InventoryItem>> {
    try {
      const response = await apiClient.post(`/Inventory/save`, [item]);
      return {
        success: true,
        data: response.data,
        message: response.data.message || 'Item updated successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update item',
      };
    }
  },

  /**
   * Delete a single inventory item
   */
  async deleteInventoryItem(id: number): Promise<ApiResponse<void>> {
    try {
      const payload = {
        userId :1,
        inventoryId: id
      }
      const response = await apiClient.delete(`/Inventory?userId=${payload.userId}&inventoryId=${payload.inventoryId}`);
      return {
        success: true,
        message: response.data.message || 'Item deleted successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete item',
      };
    }
  },
};

export default inventoryService;
