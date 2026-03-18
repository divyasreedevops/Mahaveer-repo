/**
 * Inventory Management Types
 * Represents pharmaceutical product inventory structure
 */

export interface ParsedValue {
  source: string;
  parsedValue: number;
}

export interface MedicineInventory {
  id: number;
  name: string;
  type: string; // tablet, capsule, syrup, injection, etc.
  disease: string;
  dosageValue: ParsedValue;
  dosageUnits: string; // mg, ml, etc.
  quantityValue: number;
  quantityUnits: string; // strip, ml, qty/strip, etc.
  mrp: ParsedValue;
  discount: ParsedValue | number; // Can be object or direct number
  finalPrice: ParsedValue | number; // Can be object or direct number
  status: number;
  createdBy: number;
  createdDate: string; // ISO 8601 datetime
  updatedDate: string; // ISO 8601 datetime
  updatedBy: number | null;
}

export interface InventoryFilters {
  disease?: string;
  type?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  status?: number;
}

export interface InventoryStats {
  totalMedicines: number;
  totalValue: number;
  averagePrice: number;
  medicinesByDisease: Record<string, number>;
  medicinesByType: Record<string, number>;
}

/**
 * Helper function to get the actual numeric value from ParsedValue or number
 */
export const getNumericValue = (value: ParsedValue | number): number => {
  if (typeof value === 'number') {
    return value;
  }
  return value.parsedValue;
};

/**
 * Helper function to format price for display
 */
export const formatPrice = (price: ParsedValue | number): string => {
  const numValue = getNumericValue(price);
  return `₹${numValue.toFixed(2)}`;
};

/**
 * Helper function to calculate discounted price
 */
export const calculateDiscountedPrice = (
  mrp: ParsedValue | number,
  discount: ParsedValue | number
): number => {
  const mrpValue = getNumericValue(mrp);
  const discountValue = getNumericValue(discount);
  return mrpValue - (mrpValue * discountValue) / 100;
};
