import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import { MedicineInventory, getNumericValue } from '../types/inventory';

export interface UseInventoryReturn {
  inventory: MedicineInventory[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  loadInventory: () => Promise<void>;
  addMedicine: (medicine: Omit<MedicineInventory, 'id' | 'createdBy' | 'createdDate' | 'updatedDate' | 'updatedBy' | 'status'>) => Promise<void>;
  removeMedicine: (id: number) => Promise<void>;
  updateMedicine: (id: number, updates: Partial<MedicineInventory>) => Promise<void>;
}

/**
 * Custom hook for inventory management with loading and error states
 */
/**
 * Transform MedicineInventory to API payload format
 * Converts ParsedValue objects to raw decimal numbers
 */
function transformMedicineForAPI(medicine: any, id?: number) {
  return {
    id: id || 0,
    name: medicine.name,
    type: medicine.type,
    disease: medicine.disease,
    dosageValue: getNumericValue(medicine.dosageValue),
    dosageUnits: medicine.dosageUnits,
    quantityValue: medicine.quantityValue,
    quantityUnits: medicine.quantityUnits,
    mrp: getNumericValue(medicine.mrp),
    discount: getNumericValue(medicine.discount),
    finalPrice: getNumericValue(medicine.finalPrice),
    status: medicine.status || 1,
    createdBy: medicine.createdBy || 0,
    updatedBy: medicine.updatedBy || null,
    createdDate: medicine.createdDate || new Date().toISOString(),
    updatedDate: medicine.updatedDate || new Date().toISOString(),
  };
}

export function useInventory(): UseInventoryReturn {
  const [inventory, setInventory] = useState<MedicineInventory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load inventory on mount
  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await api.inventory.getList();
      setInventory(items || []);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to load inventory';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const addMedicine = async (medicine: Omit<MedicineInventory, 'id' | 'createdBy' | 'createdDate' | 'updatedDate' | 'updatedBy' | 'status'>) => {
    setIsRefreshing(true);
    try {
      // Validate discount doesn't exceed MRP
      const mrpValue = getInventoryNumericValue(medicine.mrp);
      const discountValue = getInventoryNumericValue(medicine.discount);
      
      if (discountValue > mrpValue) {
        toast.error('Discount cannot exceed MRP amount');
        throw new Error('Discount cannot exceed MRP');
      }
      
      const payload = transformMedicineForAPI(medicine, 0);
      await api.inventory.save([payload]);
      await loadInventory();
      toast.success('Medicine added successfully!');
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to add medicine';
      toast.error(errorMsg);
      throw err;
    } finally {
      setIsRefreshing(false);
    }
  };

  const removeMedicine = async (id: number) => {
    setIsRefreshing(true);
    try {
      const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{"id": 0}');
      await api.inventory.delete(id, adminUser.id || 0);
      setInventory(prev => prev.filter(m => m.id !== id));
      toast.success('Medicine removed successfully!');
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to remove medicine';
      toast.error(errorMsg);
      throw err;
    } finally {
      setIsRefreshing(false);
    }
  };

  const updateMedicine = async (id: number, updates: Partial<MedicineInventory>) => {
    setIsRefreshing(true);
    try {
      const existing = inventory.find(m => m.id === id);
      if (!existing) throw new Error('Medicine not found');

      const merged = { ...existing, ...updates };
      
      // Validate discount doesn't exceed MRP
      const mrpValue = getInventoryNumericValue(merged.mrp);
      const discountValue = getInventoryNumericValue(merged.discount);
      
      if (discountValue > mrpValue) {
        toast.error('Discount cannot exceed MRP amount');
        throw new Error('Discount cannot exceed MRP');
      }
      
      const payload = transformMedicineForAPI(merged, id);
      await api.inventory.save([payload]);
      setInventory(prev => prev.map(m => m.id === id ? merged : m));
      toast.success('Medicine updated successfully!');
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to update medicine';
      toast.error(errorMsg);
      throw err;
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    inventory,
    isLoading,
    isRefreshing,
    error,
    loadInventory,
    addMedicine,
    removeMedicine,
    updateMedicine,
  };
}

/**
 * Helper function to convert ParsedValue or number to display format
 */
export const formatInventoryPrice = (price: any): string => {
  const numValue = typeof price === 'number' ? price : price?.parsedValue || 0;
  return `₹${numValue.toFixed(2)}`;
};

/**
 * Helper function to get numeric value from ParsedValue
 */
export const getInventoryNumericValue = (value: any): number => {
  return typeof value === 'number' ? value : value?.parsedValue || 0;
};

/**
 * Helper function to calculate discounted price
 * Ensures discount doesn't exceed 100% of MRP
 */
export const calculateInventoryDiscountedPrice = (mrp: any, discount: any): number => {
  const mrpValue = getInventoryNumericValue(mrp);
  const discountValue = getInventoryNumericValue(discount);
  const cappedDiscount = Math.min(discountValue, mrpValue);
  return Math.max(mrpValue - cappedDiscount, 0);
};

/**
 * Helper function to get discount percentage capped at 100%
 */
export const getDiscountPercentageCapped = (mrp: any, discount: any): number => {
  const mrpValue = getInventoryNumericValue(mrp);
  if (mrpValue === 0) return 0;
  const discountValue = getInventoryNumericValue(discount);
  return Math.min((discountValue / mrpValue) * 100, 100);
};
