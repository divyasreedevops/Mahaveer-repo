import useSWR from 'swr';
import { inventoryService } from '@/api';
import type { InventoryItem, ApiResponse } from '@/types';

/**
 * Hook to fetch inventory list
 */
export function useInventory() {
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<InventoryItem[]>>(
    '/Inventory/GetInventoryList',
    () => inventoryService.getInventoryList()
  );

  return {
    inventory: data?.data || [],
    isLoading,
    error,
    mutate,
    isError: !!error,
  };
}

/**
 * Hook to save inventory
 */
export function useSaveInventory() {
  const saveInventory = async (items: InventoryItem[]) => {
    return await inventoryService.saveInventory(items);
  };

  return { saveInventory };
}

export default useInventory;
