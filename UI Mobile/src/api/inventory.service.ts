import apiClient from './client';
import type { ApiResponse, InventoryItem } from '@/types';

export const inventoryService = {
  getInventoryList: async (): Promise<ApiResponse<InventoryItem[]>> => {
    try {
      const response = await apiClient.get('/Inventory/GetInventoryList');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to fetch inventory. Please try again.' };
    }
  },

  saveInventory: async (items: Partial<InventoryItem>[]): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.post('/Inventory/save', items);
      return { success: true, data: response.data, message: response.data?.message || 'Items saved successfully' };
    } catch (error: any) {
      if (error.status === 400) return { success: false, message: error.message || 'At least one item is required' };
      return { success: false, message: error.message || 'Failed to save inventory. Please try again.' };
    }
  },

  addInventoryItem: async (item: Partial<InventoryItem>): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.post('/Inventory/save', [item]);
      return { success: true, data: response.data, message: response.data?.message || 'Item added successfully' };
    } catch (error: any) {
      if (error.status === 400) return { success: false, message: error.message || 'Invalid item data. Please check all fields.' };
      return { success: false, message: error.message || 'Failed to add item. Please try again.' };
    }
  },

  updateInventoryItem: async (item: Partial<InventoryItem>): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.post('/Inventory/save', [item]);
      return { success: true, data: response.data, message: response.data?.message || 'Item updated successfully' };
    } catch (error: any) {
      if (error.status === 400) return { success: false, message: error.message || 'Invalid item data. Please check all fields.' };
      return { success: false, message: error.message || 'Failed to update item. Please try again.' };
    }
  },

  deleteInventoryItem: async (id: number): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.delete(`/Inventory?userId=1&inventoryId=${id}`);
      return { success: true, data: response.data, message: response.data?.message || 'Item deleted successfully' };
    } catch (error: any) {
      if (error.status === 404) return { success: false, message: error.message || 'Inventory item not found' };
      return { success: false, message: error.message || 'Failed to delete item. Please try again.' };
    }
  },
};
