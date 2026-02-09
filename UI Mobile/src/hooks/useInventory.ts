import { useState, useCallback } from 'react';
import { inventoryService } from '@/api';
import type { InventoryItem } from '@/types';

export const useInventory = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await inventoryService.getInventoryList();
      if (result.success && result.data) {
        setItems(result.data);
      } else {
        setError(result.message || 'Failed to fetch inventory');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addItem = useCallback(async (item: Partial<InventoryItem>) => {
    try {
      const result = await inventoryService.addInventoryItem(item);
      if (result.success) {
        await fetchInventory();
        return { success: true, message: result.message };
      }
      return { success: false, message: result.message || 'Failed to add item' };
    } catch (err: any) {
      return { success: false, message: err.message || 'An error occurred' };
    }
  }, [fetchInventory]);

  const updateItem = useCallback(async (item: Partial<InventoryItem>) => {
    try {
      const result = await inventoryService.updateInventoryItem(item);
      if (result.success) {
        await fetchInventory();
        return { success: true, message: result.message };
      }
      return { success: false, message: result.message || 'Failed to update item' };
    } catch (err: any) {
      return { success: false, message: err.message || 'An error occurred' };
    }
  }, [fetchInventory]);

  const deleteItem = useCallback(async (id: number) => {
    try {
      const result = await inventoryService.deleteInventoryItem(id);
      if (result.success) {
        setItems(prev => prev.filter(i => i.id !== id));
        return { success: true, message: result.message };
      }
      return { success: false, message: result.message || 'Failed to delete item' };
    } catch (err: any) {
      return { success: false, message: err.message || 'An error occurred' };
    }
  }, []);

  return { items, isLoading, error, fetchInventory, addItem, updateItem, deleteItem };
};
