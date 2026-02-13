import apiClient from './client';
import type { ApiResponse, InventoryItem } from '@/types';

export const inventoryService = {
  getInventoryList: async (): Promise<ApiResponse<InventoryItem[]>> => {
    if (__DEV__) console.log('[InventoryService] getInventoryList - Fetching inventory list');
    try {
      const response = await apiClient.get('/Inventory/GetInventoryList');
      if (__DEV__) console.log('[InventoryService] getInventoryList - Fetched', response.data?.length || 0, 'items');
      return { success: true, data: response.data };
    } catch (error: any) {
      if (__DEV__) console.error('[InventoryService] getInventoryList - Error:', error.message);
      return { success: false, message: error.message || 'Failed to fetch inventory. Please try again.' };
    }
  },

  saveInventory: async (items: Partial<InventoryItem>[]): Promise<ApiResponse<any>> => {
    if (__DEV__) console.log('[InventoryService] saveInventory - Saving', items.length, 'items');
    try {
      const response = await apiClient.post('/Inventory/save', items);
      if (__DEV__) console.log('[InventoryService] saveInventory - Items saved successfully');
      return { success: true, data: response.data, message: response.data?.message || 'Items saved successfully' };
    } catch (error: any) {
      if (__DEV__) console.error('[InventoryService] saveInventory - Error:', error.message);
      if (error.status === 400) return { success: false, message: error.message || 'At least one item is required' };
      return { success: false, message: error.message || 'Failed to save inventory. Please try again.' };
    }
  },

  addInventoryItem: async (item: Partial<InventoryItem>): Promise<ApiResponse<any>> => {
    if (__DEV__) console.log('[InventoryService] addInventoryItem - Adding item:', item.itemName);
    try {
      const response = await apiClient.post('/Inventory/save', [item]);
      if (__DEV__) console.log('[InventoryService] addInventoryItem - Item added successfully');
      return { success: true, data: response.data, message: response.data?.message || 'Item added successfully' };
    } catch (error: any) {
      if (__DEV__) console.error('[InventoryService] addInventoryItem - Error:', error.message);
      if (error.status === 400) return { success: false, message: error.message || 'Invalid item data. Please check all fields.' };
      return { success: false, message: error.message || 'Failed to add item. Please try again.' };
    }
  },

  updateInventoryItem: async (item: Partial<InventoryItem>): Promise<ApiResponse<any>> => {
    if (__DEV__) console.log('[InventoryService] updateInventoryItem - Updating item:', item.itemName);
    try {
      const response = await apiClient.post('/Inventory/save', [item]);
      if (__DEV__) console.log('[InventoryService] updateInventoryItem - Item updated successfully');
      return { success: true, data: response.data, message: response.data?.message || 'Item updated successfully' };
    } catch (error: any) {
      if (__DEV__) console.error('[InventoryService] updateInventoryItem - Error:', error.message);
      if (error.status === 400) return { success: false, message: error.message || 'Invalid item data. Please check all fields.' };
      return { success: false, message: error.message || 'Failed to update item. Please try again.' };
    }
  },

  deleteInventoryItem: async (id: number): Promise<ApiResponse<any>> => {
    if (__DEV__) console.log('[InventoryService] deleteInventoryItem - Deleting item with ID:', id);
    try {
      const response = await apiClient.delete(`/Inventory?userId=1&inventoryId=${id}`);
      if (__DEV__) console.log('[InventoryService] deleteInventoryItem - Item deleted successfully');
      return { success: true, data: response.data, message: response.data?.message || 'Item deleted successfully' };
    } catch (error: any) {
      if (__DEV__) console.error('[InventoryService] deleteInventoryItem - Error:', error.message);
      if (error.status === 404) return { success: false, message: error.message || 'Inventory item not found' };
      return { success: false, message: error.message || 'Failed to delete item. Please try again.' };
    }
  },
};
